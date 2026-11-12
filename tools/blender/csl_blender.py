"""bpy layer: turns csl_geometry output into a rigged Blender scene, saves .blend, exports GLB.
Targets Blender 4.5 LTS (also written to run on 5.x). Run via build_characters.py."""
import math
import bpy
import csl_geometry as G


def srgb_to_linear(h):
    out = []
    for i in (1, 3, 5):
        c = int(h[i:i + 2], 16) / 255.0
        out.append(c / 12.92 if c <= 0.04045 else ((c + 0.055) / 1.055) ** 2.4)
    return tuple(out) + (1.0,)


def reset_scene():
    bpy.ops.wm.read_factory_settings(use_empty=True)


def make_atlas_material(res):
    import os
    import csl_atlas as AT
    name = res['spec']['name']
    path = os.path.join(bpy.app.tempdir, name + '_atlas.png')
    AT.write_png(path, res['atlas_arr'])
    img = bpy.data.images.load(path)
    img.name = name + '_atlas'
    img.colorspace_settings.name = 'sRGB'
    img.pack()
    m = bpy.data.materials.new('CSL_' + name + '_Atlas')
    m.use_nodes = True
    nt = m.node_tree
    bsdf = nt.nodes.get('Principled BSDF')
    tex = nt.nodes.new('ShaderNodeTexImage')
    tex.image = img
    tex.interpolation = 'Linear'
    nt.links.new(tex.outputs['Color'], bsdf.inputs['Base Color'])
    bsdf.inputs['Roughness'].default_value = 0.6
    bsdf.inputs['Metallic'].default_value = 0.0
    return {'atlas': m}


def make_materials(table):
    mats = {}
    for name, (hexc, rough) in table.items():
        m = bpy.data.materials.new('CSL_' + name)
        m.use_nodes = True
        bsdf = m.node_tree.nodes.get('Principled BSDF')
        bsdf.inputs['Base Color'].default_value = srgb_to_linear(hexc)
        bsdf.inputs['Roughness'].default_value = rough
        bsdf.inputs['Metallic'].default_value = 0.0
        m.diffuse_color = srgb_to_linear(hexc)  # viewport / Workbench colour
        mats[name] = m
    return mats


def make_armature(bones, name='Armature'):
    arm = bpy.data.armatures.new(name)
    obj = bpy.data.objects.new(name, arm)
    bpy.context.scene.collection.objects.link(obj)
    bpy.context.view_layer.objects.active = obj
    obj.select_set(True)
    bpy.ops.object.mode_set(mode='EDIT')
    eb = {}
    for bn in G.BONE_NAMES:
        head, tail, parent = bones[bn]
        e = arm.edit_bones.new(bn)
        e.head, e.tail = head, tail
        e.roll = 0.0
        eb[bn] = e
    for bn in G.BONE_NAMES:
        parent = bones[bn][2]
        if parent:
            eb[bn].parent = eb[parent]
    bpy.ops.object.mode_set(mode='OBJECT')
    return obj


def make_mesh_object(m, arm_obj, mats):
    me = bpy.data.meshes.new(m.name)
    me.from_pydata(m.verts, [], [list(f[0]) for f in m.faces])
    slots = m.material_names()
    for s in slots:
        me.materials.append(mats[s])
    me.polygons.foreach_set('material_index', [slots.index(f[2]) for f in m.faces])
    me.polygons.foreach_set('use_smooth', [True] * len(m.faces))
    uv = me.uv_layers.new(name='UVMap')
    for poly, f in zip(me.polygons, m.faces):
        for k in range(poly.loop_total):
            uv.data[poly.loop_start + k].uv = f[1][k]
    me.update()
    obj = bpy.data.objects.new(m.name, me)
    bpy.context.scene.collection.objects.link(obj)

    # vertex groups (skin weights computed analytically in csl_geometry)
    groups = {}
    for vi, w in enumerate(m.weights):
        for bone, val in w.items():
            groups.setdefault(bone, []).append((vi, val))
    for bone in G.BONE_NAMES:
        vg = obj.vertex_groups.new(name=bone)
        for vi, val in groups.get(bone, []):
            vg.add([vi], val, 'REPLACE')

    # morph targets
    if m.morphs:
        obj.shape_key_add(name='Basis', from_mix=False)
        for name, deltas in m.morphs.items():
            sk = obj.shape_key_add(name=name, from_mix=False)
            for vi, d in deltas.items():
                x, y, z = m.verts[vi]
                sk.data[vi].co = (x + d[0], y + d[1], z + d[2])

    mod = obj.modifiers.new('Armature', 'ARMATURE')
    mod.object = arm_obj
    obj.parent = arm_obj
    return obj


def build_scene(res):
    reset_scene()
    mats = make_atlas_material(res) if 'atlas_arr' in res else make_materials(res['materials'])
    arm = make_armature(res['bones'])
    objs = [make_mesh_object(m, arm, mats) for m in res['meshes']]
    return arm, objs


def export_glb(path, animations=False):
    bpy.ops.object.select_all(action='SELECT')
    kw = dict(filepath=path, export_format='GLB', use_selection=False, export_apply=False,
              export_skins=True, export_morph=True, export_animations=animations,
              export_yup=True, export_cameras=False, export_lights=False)
    if animations:
        kw['export_animation_mode'] = 'NLA_TRACKS'
        kw['export_force_sampling'] = True
    try:
        bpy.ops.export_scene.gltf(**kw, export_image_format='AUTO', export_materials='EXPORT')
    except TypeError:
        kw.pop('export_animation_mode', None)
        bpy.ops.export_scene.gltf(**kw)


# ------------------------------------------------------------ animation ----
def add_animations(arm_obj, spec, clip_names=None):
    """Bake csl_anim clips into Blender actions + NLA tracks (one track per clip, named
    exactly like the clip) so export_scene.gltf emits them as named animations."""
    import csl_anim as A
    from mathutils import Matrix, Vector
    x = A.Ctx(spec)
    res = G.build(spec)
    pts = []
    for m in res['meshes']:
        for i in range(0, len(m.verts), 2):
            pts.append((m.verts[i], m.weights[i]))
    bpy.context.view_layer.objects.active = arm_obj
    bpy.ops.object.mode_set(mode='POSE')
    ad = arm_obj.animation_data_create()
    Q = {b.name: b.matrix_local.to_3x3() for b in arm_obj.data.bones}
    for pb in arm_obj.pose.bones:
        pb.rotation_mode = 'QUATERNION'
    info = {}
    for name in (clip_names or A.all_clip_names()):
        frames = A.sample_clip(x, name, pts)
        act = bpy.data.actions.new(name)
        ad.action = act
        prev = {}
        for fi, fr in enumerate(frames):
            f = fi + 1
            for pb in arm_obj.pose.bones:
                R = fr['R'].get(pb.name)
                q = Matrix(R) if R else Matrix.Identity(3)
                basis = (Q[pb.name].inverted() @ q @ Q[pb.name]).to_quaternion()
                if pb.name in prev and prev[pb.name].dot(basis) < 0:
                    basis.negate()
                prev[pb.name] = basis.copy()
                pb.rotation_quaternion = basis
                pb.keyframe_insert('rotation_quaternion', frame=f)
                if pb.name == 'Hips':
                    pb.location = Q['Hips'].inverted() @ Vector(fr['hips_t'])
                    pb.keyframe_insert('location', frame=f)
        track = ad.nla_tracks.new()
        track.name = name
        strip = track.strips.new(name, 1, act)
        strip.name = name
        ad.action = None
        info[name] = dict(A.clip_info(name), frames=len(frames), fps=A.FPS)
        if name == 'Walk':   # Run is not measured: ground-lock also pins the swing foot
            info[name]['speed'] = A.stance_speed(x, frames)
    for pb in arm_obj.pose.bones:   # leave the rig in rest pose
        pb.rotation_quaternion = (1, 0, 0, 0)
        pb.location = (0, 0, 0)
    bpy.ops.object.mode_set(mode='OBJECT')
    return info
