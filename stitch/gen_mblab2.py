# CSL — realistic bodies + anime faces, uniforms, rig & animations (MB-Lab + headless Blender)
# Run: blender.exe --background --python gen_mblab2.py -- <mblab_zip> <out_dir>
import bpy, sys, math, os, importlib
from mathutils import Vector

args = sys.argv[sys.argv.index("--") + 1:]
MBLAB_ZIP, OUT = args[0], args[1]

bpy.ops.preferences.addon_install(filepath=MBLAB_ZIP)
import addon_utils
addon_utils.enable("MB-Lab-master", default_set=True)
mod = importlib.import_module("MB-Lab-master")

def mat(name, color, rough=0.85):
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    b = m.node_tree.nodes["Principled BSDF"]
    b.inputs["Base Color"].default_value = (*color, 1.0)
    b.inputs["Roughness"].default_value = rough
    m.diffuse_color = (*color, 1.0)
    return m

def smooth(ob):
    for p in ob.data.polygons:
        p.use_smooth = True
    m = ob.modifiers.new("Sub", "SUBSURF")
    m.levels = 2
    return ob

def sphere(rx, ry, rz, loc, material, name, parts, seg=24):
    bpy.ops.mesh.primitive_uv_sphere_add(radius=1, segments=seg, ring_count=int(seg*0.6), location=loc)
    ob = bpy.context.active_object
    ob.name = name
    ob.scale = (rx, ry, rz)
    ob.data.materials.append(material)
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    parts.append(smooth(ob))
    return ob

def cyl(r1, r2, depth, loc, material, name, parts, rot=(0, 0, 0), seg=20):
    bpy.ops.mesh.primitive_cone_add(radius1=r1, radius2=r2, depth=depth, vertices=seg, location=loc, rotation=rot)
    ob = bpy.context.active_object
    ob.name = name
    ob.data.materials.append(material)
    parts.append(smooth(ob))
    return ob

def build_armature(H):
    s = H / 1.72
    ad = bpy.data.armatures.new("Armature")
    rig = bpy.data.objects.new("Rig", ad)
    bpy.context.scene.collection.objects.link(rig)
    bpy.context.view_layer.objects.active = rig
    bpy.ops.object.mode_set(mode="EDIT")

    def bone(name, head, tail, parent=None):
        e = ad.edit_bones.new(name)
        e.head = Vector(head) * s
        e.tail = Vector(tail) * s
        e.parent = parent
        return e

    hips = bone("Hips",   (0, 0, 0.94), (0, 0, 1.02))
    spine = bone("Spine", (0, 0, 1.02), (0, 0, 1.20), hips)
    chest = bone("Chest", (0, 0, 1.20), (0, 0, 1.42), spine)
    neck = bone("Neck",   (0, 0, 1.42), (0, 0, 1.50), chest)
    bone("Head",          (0, 0, 1.50), (0, 0, 1.74), neck)
    for sd in (-1, 1):
        n = "L" if sd < 0 else "R"
        sh = bone(f"Shoulder_{n}", (0.04*sd, 0, 1.42), (0.17*sd, 0, 1.43), chest)
        ua = bone(f"UpperArm_{n}", (0.19*sd, 0, 1.43), (0.20*sd, 0, 1.11), sh)
        la = bone(f"LowerArm_{n}", (0.20*sd, 0, 1.11), (0.21*sd, 0, 0.84), ua)
        bone(f"Hand_{n}", (0.21*sd, 0, 0.84), (0.21*sd, 0, 0.70), la)
        th = bone(f"UpperLeg_{n}", (0.09*sd, 0, 0.92), (0.09*sd, 0, 0.52), hips)
        shn = bone(f"LowerLeg_{n}", (0.09*sd, 0, 0.52), (0.09*sd, 0, 0.10), th)
        bone(f"Foot_{n}", (0.09*sd, 0, 0.09), (0.09*sd, -0.17, 0.09), shn)
    bpy.ops.object.mode_set(mode="OBJECT")
    return rig

def dress_and_rig(obj, cfg, H):
    parts = []
    M = {k: mat(k, v) for k, v in cfg["colors"].items()}
    f = cfg["female"]
    # landmark fractions of height
    zC, zW, zH, zK, zA = 0.74*H, 0.62*H, 0.50*H, 0.28*H, 0.03*H
    headC, headR = 0.925*H, 0.062*H
    wr = 0.16*H if not f else 0.13*H  # half chest width

    # uniform: shirt/torso  (Z-up: loc = (x, depth, height), faces -Y)
    cyl(wr, wr*0.86, (zC+0.10*H)-zW, (0, 0, (zC+zW)/2), M["shirt"], "Shirt", parts)
    for sd in (-1, 1):
        n = "L" if sd < 0 else "R"
        # sleeves to elbow
        cyl(0.052*H, 0.046*H, 0.24*H, (0.155*sd, 0, 0.68*H), M["shirt"], f"Sleeve_{n}", parts, rot=(0, 0.03*sd, 0))
    if f:  # long skirt
        cyl(0.135*H, 0.165*H, 0.36*H, (0, 0, zH+0.08*H), M["pants"], "Skirt", parts, seg=28)
    else:
        # trousers: two tapered cylinders + hip block
        cyl(0.16*H, 0.14*H, 0.12*H, (0, 0, zH+0.02*H), M["pants"], "HipsBlk", parts)
        for sd in (-1, 1):
            n = "L" if sd < 0 else "R"
            cyl(0.065*H, 0.045*H, 0.44*H, (0.062*sd, 0, (zK+zH)/2), M["pants"], f"Trousers_{n}", parts)
    # shoes (toes toward -Y)
    for sd in (-1, 1):
        n = "L" if sd < 0 else "R"
        sphere(0.042*H, 0.085*H, 0.032*H, (0.062*sd if not f else 0.055*sd, -0.015*H, 0.025*H), M["shoes"], f"Shoe_{n}", parts)
    # hair
    hc = M["hair"]
    if cfg.get("hijab"):
        sphere(headR*1.18, headR*1.22, headR*1.28, (0, -0.008*H, headC), hc, "Hijab", parts, seg=28)
        sphere(headR*1.1, headR*1.1, headR*0.75, (0, 0, headC-0.06*H), hc, "HijabFall", parts, seg=24)
    else:
        sphere(headR*1.1, headR*1.08, headR*1.15, (0, -0.006*H, headC+0.008*H), hc, "HairCap", parts, seg=28)
        sphere(headR*0.92, headR*0.62, headR*1.05, (0, -0.055*H, headC-0.05*H), hc, "HairBack", parts, seg=24)
        if cfg.get("spiky"):
            for i, (x, df) in enumerate([(-0.03, 0.01), (0.0, -0.015), (0.03, 0.01), (-0.01, 0.03)]):
                cyl(headR*0.22, headR*0.03, 0.05*H, (x*H, df*H, headC+headR*1.05), hc, f"Spike_{i}", parts, seg=10)
    if cfg.get("glasses"):
        for sd in (-1, 1):
            n = "L" if sd < 0 else "R"
            sphere(headR*0.32, headR*0.05, headR*0.26, (0.038*H*sd, -headR*0.82, headC+0.01*H), M["glasses"], f"Lens_{n}", parts, seg=18)
        cyl(headR*0.04, headR*0.04, 0.028*H, (0, -headR*0.8, headC+0.012*H), M["glasses"], "Bridge", parts, rot=(0, math.pi/2, 0), seg=8)

    # rig everything with envelope auto-weights
    rig = build_armature(H)
    bpy.ops.object.select_all(action="DESELECT")
    obj.select_set(True)
    for p in parts:
        p.select_set(True)
    rig.select_set(True)
    bpy.context.view_layer.objects.active = rig
    bpy.ops.object.parent_set(type="ARMATURE_AUTO")
    return rig, parts

def set_rot(pb, x=0.0, y=0.0, z=0.0):
    pb.rotation_mode = "XYZ"
    pb.rotation_euler = (x, y, z)

def add_animations(rig):
    def idle(f, n, p):
        t = 2 * math.pi * f / n
        set_rot(p["Chest"], 0.02 + 0.012*math.sin(t), 0, 0.015*math.sin(t*0.5))
        set_rot(p["Head"], -0.01 + 0.018*math.sin(t+1), 0, 0.025*math.sin(t*0.5))
        set_rot(p["UpperArm_L"], 0.03*math.sin(t), 0, 0.045)
        set_rot(p["UpperArm_R"], -0.03*math.sin(t), 0, -0.045)
    def walk(f, n, p):
        t = 2 * math.pi * f / n
        s = math.sin(t)
        set_rot(p["UpperLeg_L"], 0.48*s, 0, 0)
        set_rot(p["UpperLeg_R"], -0.48*s, 0, 0)
        set_rot(p["LowerLeg_L"], max(0.0, -0.85*s), 0, 0)
        set_rot(p["LowerLeg_R"], max(0.0, 0.85*s), 0, 0)
        set_rot(p["Foot_L"], -0.18*s, 0, 0)
        set_rot(p["Foot_R"], 0.18*s, 0, 0)
        set_rot(p["UpperArm_L"], -0.38*s, 0, 0.06)
        set_rot(p["UpperArm_R"], 0.38*s, 0, -0.06)
        set_rot(p["Chest"], 0.05, 0, 0.028*s)
    for name, frames, fn in (("Idle", 60, idle), ("Walk", 24, walk)):
        sc = bpy.context.scene
        act = bpy.data.actions.new(name)
        rig.animation_data_create()
        rig.animation_data.action = act
        sc.frame_start, sc.frame_end = 1, frames
        p = rig.pose.bones
        for f in range(1, frames+1):
            sc.frame_set(f)
            fn(f, frames, p)
            for pb in p:
                pb.keyframe_insert("rotation_euler")
        rig.animation_data.action = None
        track = rig.animation_data.nla_tracks.new()
        track.strips.new(act.name, 1, act)
        act.use_fake_user = True

def render_preview(path):
    sc = bpy.context.scene
    sc.render.engine = "BLENDER_WORKBENCH"
    sh = sc.display.shading
    sh.light, sh.color_type = "STUDIO", "MATERIAL"
    sh.background_type = "WORLD"
    w = bpy.data.worlds.new("World")
    w.use_nodes = True
    w.node_tree.nodes["Background"].inputs[0].default_value = (0.85, 0.87, 0.9, 1)
    sc.world = w
    cam = bpy.data.objects.new("Cam", bpy.data.cameras.new("CamData"))
    sc.collection.objects.link(cam)
    cam.location = (1.5, -2.2, 1.35)
    tgt = bpy.data.objects.new("Tgt", None)
    tgt.location = (0, 0, 0.9)
    sc.collection.objects.link(tgt)
    con = cam.constraints.new("TRACK_TO"); con.target = tgt
    sc.camera = cam
    sc.render.resolution_x, sc.render.resolution_y = 512, 640
    sc.render.filepath = path
    bpy.ops.render.render(write_still=True)

def make(name, char_id, mass, tone, cfg):
    bpy.ops.wm.read_factory_settings(use_empty=True)
    addon_utils.enable("MB-Lab-master", default_set=True)
    scn = bpy.context.scene
    scn.mblab_character_name = char_id
    scn.mblab_use_ik = scn.mblab_use_muscle = scn.mblab_use_cycles = scn.mblab_use_eevee = scn.mblab_use_lamps = False
    mod.start_lab_session()
    hum = mod.mblab_humanoid
    # keep canonical anatomy; only mass/tone explicitly set (all preserve flags True)
    hum.generate_character(0.0, True, True, True, True, True, True, True, mass, tone, True)
    hum.update_materials(update_textures_nodes=True)

    obj = next((o for o in bpy.data.objects if o.get("manuellab_id")), None)
    if not obj:
        print(f"[{name}] ERROR no human"); return
    obj.name = name
    # measure height (world = local at origin)
    bb = [Vector(c) for c in obj.bound_box]
    H = max(v.z for v in bb) - min(v.z for v in bb)
    print(f"[{name}] H={H:.3f}")
    rig, parts = dress_and_rig(obj, cfg, H)
    add_animations(rig)

    bpy.ops.object.select_all(action="DESELECT")
    obj.select_set(True)
    for p in parts:
        p.select_set(True)
    rig.select_set(True)
    bpy.context.view_layer.objects.active = rig
    bpy.ops.export_scene.gltf(
        filepath=os.path.join(OUT, f"{name}.glb"),
        export_format="GLB", use_selection=True, export_apply=True,
        export_animations=True, export_skins=True, export_yup=True,
    )
    render_preview(os.path.join(OUT, f"{name}_preview.png"))
    print(f"DONE {name}")

HAIR_B = (0.07, 0.05, 0.04)
CAST = [
    ("aris", "m_an01", 0.30, 0.30, {"female": False, "glasses": True,
        "colors": {"shirt": (0.92, 0.92, 0.90), "pants": (0.15, 0.18, 0.25), "hair": HAIR_B,
                   "shoes": (0.12, 0.12, 0.13), "glasses": (0.08, 0.08, 0.09)}}),
    ("bimo", "m_an02", 0.80, 0.65, {"female": False, "spiky": True,
        "colors": {"shirt": (0.48, 0.09, 0.09), "pants": (0.09, 0.09, 0.11), "hair": (0.04, 0.04, 0.04),
                   "shoes": (0.18, 0.05, 0.05), "glasses": (0.08, 0.08, 0.09)}}),
    ("pakbudi", "m_as01", 0.60, 0.40, {"female": False, "glasses": True,
        "colors": {"shirt": (0.42, 0.45, 0.28), "pants": (0.23, 0.20, 0.17), "hair": (0.20, 0.18, 0.16),
                   "shoes": (0.14, 0.11, 0.09), "glasses": (0.08, 0.08, 0.09)}}),
    ("student", "m_an03", 0.50, 0.50, {"female": False,
        "colors": {"shirt": (0.90, 0.90, 0.87), "pants": (0.17, 0.21, 0.28), "hair": (0.12, 0.09, 0.07),
                   "shoes": (0.13, 0.13, 0.14), "glasses": (0.08, 0.08, 0.09)}}),
    ("siti", "f_an01", 0.30, 0.40, {"female": True, "hijab": True,
        "colors": {"shirt": (0.95, 0.95, 0.93), "pants": (0.20, 0.23, 0.30), "hair": (0.92, 0.92, 0.94),
                   "shoes": (0.12, 0.12, 0.13), "glasses": (0.08, 0.08, 0.09)}}),
    ("student_f", "f_an02", 0.40, 0.50, {"female": True,
        "colors": {"shirt": (0.93, 0.93, 0.91), "pants": (0.22, 0.22, 0.27), "hair": (0.11, 0.07, 0.05),
                   "shoes": (0.13, 0.13, 0.14), "glasses": (0.08, 0.08, 0.09)}}),
]
for nm, cid, mass, tone, cfg in CAST:
    make(nm, cid, mass, tone, cfg)
