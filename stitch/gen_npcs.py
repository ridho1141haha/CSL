# Chaos School Life — procedural NPC generator v3 (semi-realistic)
# Run: blender.exe --background --python gen_npcs.py -- <output_dir>
# Realistic proportions (7.5 heads), smooth organic surfaces, SSS skin.
import bpy, math, os, sys
from mathutils import Vector

OUT = sys.argv[sys.argv.index("--") + 1] if "--" in sys.argv else "."
SUBSURF = 2  # subdivision level for organic smoothness

def reset():
    bpy.ops.wm.read_factory_settings(use_empty=True)

def mat(name, color, rough=0.75, sss=0.0):
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    b = m.node_tree.nodes["Principled BSDF"]
    b.inputs["Base Color"].default_value = (*color, 1.0)
    b.inputs["Roughness"].default_value = rough
    if sss > 0:
        b.inputs["Subsurface Weight"].default_value = sss
        b.inputs["Subsurface Radius"].default_value = (0.03, 0.012, 0.006)
    m.diffuse_color = (*color, 1.0)
    return m

def smooth(ob, subsurf=True):
    for p in ob.data.polygons:
        p.use_smooth = True
    if subsurf:
        m = ob.modifiers.new("Sub", "SUBSURF")
        m.levels = SUBSURF
        m.render_levels = SUBSURF
    return ob

def sphere(rx, ry, rz, loc, material, name, seg=32):
    bpy.ops.mesh.primitive_uv_sphere_add(radius=1, segments=seg, ring_count=int(seg*0.6), location=loc)
    ob = bpy.context.active_object
    ob.name = name
    ob.scale = (rx, ry, rz)
    ob.data.materials.append(material)
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    return smooth(ob)

def cyl(r1, r2, depth, loc, material, name, rot=(0, 0, 0), seg=24):
    bpy.ops.mesh.primitive_cone_add(radius1=r1, radius2=r2, depth=depth, vertices=seg, location=loc, rotation=rot)
    ob = bpy.context.active_object
    ob.name = name
    ob.data.materials.append(material)
    return smooth(ob)

def ellipsoid_chain(r_start, r_end, a, b, loc, material, name, seg=24):
    # tapered limb from point a to b (local coords around loc), ellipsoid end caps
    d = Vector(b) - Vector(a)
    center = Vector(loc)
    ob = cyl(r_start, r_end, d.length, center + (Vector(a) + Vector(b)) / 2, material, name,
             rot=d.to_track_quat("Z", "Y").to_euler(), seg=seg)
    return ob

def build_armature():
    ad = bpy.data.armatures.new("Armature")
    rig = bpy.data.objects.new("Rig", ad)
    bpy.context.scene.collection.objects.link(rig)
    bpy.context.view_layer.objects.active = rig
    bpy.ops.object.mode_set(mode="EDIT")

    def bone(name, head, tail, parent=None):
        e = ad.edit_bones.new(name)
        e.head = Vector(head); e.tail = Vector(tail)
        e.parent = parent
        return e

    # realistic proportions, total height ~1.72, head length 0.23
    hips = bone("Hips",   (0, 0.94, 0), (0, 1.02, 0))
    spine = bone("Spine", (0, 1.02, 0), (0, 1.20, 0), hips)
    chest = bone("Chest", (0, 1.20, 0), (0, 1.42, 0), spine)
    neck = bone("Neck",   (0, 1.42, 0), (0, 1.50, 0), chest)
    bone("Head",          (0, 1.50, 0), (0, 1.72, 0), neck)

    for s in (-1, 1):
        n = "L" if s < 0 else "R"
        sh = bone(f"Shoulder_{n}", (0.04*s, 1.42, 0), (0.17*s, 1.43, 0), chest)
        ua = bone(f"UpperArm_{n}", (0.19*s, 1.43, 0), (0.20*s, 1.11, 0), sh)
        la = bone(f"LowerArm_{n}", (0.20*s, 1.11, 0), (0.21*s, 0.84, 0), ua)
        bone(f"Hand_{n}", (0.21*s, 0.84, 0), (0.21*s, 0.70, 0), la)
        th = bone(f"UpperLeg_{n}", (0.09*s, 0.92, 0), (0.09*s, 0.52, 0), hips)
        shn = bone(f"LowerLeg_{n}", (0.09*s, 0.52, 0), (0.09*s, 0.10, 0), th)
        bone(f"Foot_{n}", (0.09*s, 0.09, 0), (0.09*s, 0.09, -0.17), shn)

    bpy.ops.object.mode_set(mode="OBJECT")
    return rig

def skin(rig, meshes):
    bpy.ops.object.select_all(action="DESELECT")
    for m in meshes:
        m.select_set(True)
    rig.select_set(True)
    bpy.context.view_layer.objects.active = rig
    bpy.ops.object.parent_set(type="ARMATURE_AUTO")

def build_character(cfg):
    reset()
    M = {k: mat(k, v, sss=0.06 if k in ("skin",) else 0.0,
                rough=0.55 if k == "skin" else 0.85) for k, v in cfg["colors"].items()}
    parts = []

    def P(fn, *a, **kw):
        ob = fn(*a, **kw)
        parts.append(ob)
        return ob

    f = cfg["female"]
    hw = 0.34 if f else 0.38  # shoulder half-width

    # ---- torso: stacked ellipsoids -> organic waist/chest shape ----
    P(sphere, 0.16, 0.11, 0.10, (0, 1.00, 0), M["shirt"], "Pelvis")
    P(sphere, 0.145, 0.105, 0.095, (0, 1.10, 0), M["shirt"], "Waist")
    P(sphere, hw * 0.82, 0.13, 0.115, (0, 1.30, 0), M["shirt"], "Chest")
    if f:
        P(sphere, hw * 0.6, 0.115, 0.10, (0, 1.38, 0), M["shirt"], "UpperChest")
    # shirt collar hint
    P(cyl, 0.055, 0.07, 0.06, (0, 1.46, 0), M["shirt"], "Collar", seg=20)

    # ---- head ----
    P(cyl, 0.045, 0.05, 0.14, (0, 1.44, 0), M["skin"], "Neck", seg=16)
    P(sphere, 0.088, 0.105, 0.096, (0, 1.585, 0.005), M["skin"], "Skull", seg=32)
    P(sphere, 0.075, 0.085, 0.08, (0, 1.575, 0.035), M["skin"], "Face", seg=32)
    P(sphere, 0.028, 0.017, 0.024, (0, 1.53, 0.088), M["skin"], "Jaw", seg=24)
    # nose + ears
    P(sphere, 0.012, 0.018, 0.014, (0, 1.575, 0.095), M["skin"], "Nose", seg=16)
    for s in (-1, 1):
        P(sphere, 0.008, 0.02, 0.014, (0.085*s, 1.585, 0.005), M["skin"], f"Ear_{'L' if s<0 else 'R'}", seg=16)
    # eyes: sclera + iris + pupil, eyelid line via brow
    for s in (-1, 1):
        n = "L" if s < 0 else "R"
        P(sphere, 0.018, 0.011, 0.012, (0.033*s, 1.60, 0.078), M["white"], f"Sclera_{n}", seg=20)
        P(sphere, 0.0095, 0.0095, 0.007, (0.033*s, 1.60, 0.086), M["eyes"], f"Iris_{n}", seg=20)
        P(sphere, 0.0045, 0.0045, 0.004, (0.033*s, 1.60, 0.0905), M["pupil"], f"Pupil_{n}", seg=16)
        # eyebrow
        P(sphere, 0.024, 0.005, 0.007, (0.034*s, 1.632, 0.082), M["hair"], f"Brow_{'L' if s<0 else 'R'}", seg=12)
    # lips
    P(sphere, 0.017, 0.006, 0.008, (0, 1.535, 0.088), M["lips"], "Lips", seg=16)
    # hair: smooth cap + back volume (+ ponytail / hijab variants)
    hc = M["hair"]
    if cfg.get("hijab"):
        P(sphere, 0.105, 0.115, 0.108, (0, 1.59, -0.008), hc, "Hijab", seg=32)
        P(sphere, 0.115, 0.09, 0.115, (0, 1.52, -0.01), hc, "HijabShoulder", seg=32)
    else:
        P(sphere, 0.096, 0.108, 0.102, (0, 1.605, -0.008), hc, "HairCap", seg=32)
        P(sphere, 0.085, 0.10, 0.07, (0, 1.55, -0.062), hc, "HairBack", seg=32)
        if cfg.get("long_hair"):
            P(sphere, 0.05, 0.16, 0.05, (0, 1.44, -0.075), hc, "Ponytail", seg=24)
        if cfg.get("spiky"):
            for i, (x, z) in enumerate([(-0.04, 0.01), (0.0, -0.02), (0.04, 0.02), (-0.01, 0.04)]):
                P(cyl, 0.016, 0.002, 0.06, (x, 1.665 + z*0.3, z), hc, f"Spike_{i}", seg=10)
    if cfg.get("glasses"):
        for s in (-1, 1):
            P(sphere, 0.028, 0.022, 0.004, (0.033*s, 1.60, 0.094), M["glasses"], f"Lens_{'L' if s<0 else 'R'}", seg=20)
        P(cyl, 0.003, 0.003, 0.03, (0, 1.605, 0.09), M["glasses"], "Bridge", rot=(math.pi/2, 0, 0), seg=8)

    # ---- arms ----
    for s in (-1, 1):
        n = "L" if s < 0 else "R"
        P(sphere, 0.06, 0.05, 0.06, (0.155*s, 1.40, 0), M["shirt"], f"Shoulder_{n}", seg=24)
        P(cyl, 0.048, 0.038, 0.30, (0.19*s, 1.26, 0), M["shirt"], f"UpperArm_{n}", rot=(0.035*s, 0, 0), seg=20)
        P(sphere, 0.038, 0.038, 0.038, (0.197*s, 1.11, 0), M["skin"], f"Elbow_{n}", seg=20)
        P(cyl, 0.036, 0.028, 0.26, (0.203*s, 0.97, 0), M["skin"], f"LowerArm_{n}", rot=(0.03*s, 0, 0), seg=20)
        P(sphere, 0.032, 0.05, 0.022, (0.208*s, 0.80, 0.008), M["skin"], f"Hand_{n}", seg=20)

    # ---- legs ----
    for s in (-1, 1):
        n = "L" if s < 0 else "R"
        leg_m = M["skin"] if f else M["pants"]
        P(sphere, 0.075, 0.08, 0.075, (0.085*s, 0.95, 0), M["pants"], f"Hip_{n}", seg=24)
        P(cyl, 0.062, 0.048, 0.40, (0.088*s, 0.73, 0), leg_m if f else M["pants"], f"Thigh_{n}", seg=20)
        P(sphere, 0.046, 0.046, 0.046, (0.09*s, 0.52, -0.005), leg_m, f"Knee_{n}", seg=20)
        P(cyl, 0.045, 0.032, 0.40, (0.09*s, 0.31, -0.005), leg_m, f"Shin_{n}", seg=20)
        P(cyl, 0.033, 0.035, 0.09, (0.09*s, 0.12, 0), M["white"] if f else M["pants"], f"Sock_{n}", seg=16)
        # shoe: rounded wedge
        P(sphere, 0.045, 0.038, 0.10, (0.09*s, 0.035, -0.02), M["shoes"], f"Shoe_{n}", seg=20)
    if f:
        # smooth long skirt
        P(cyl, 0.145, 0.175, 0.34, (0, 0.76, 0), M["pants"], "Skirt", seg=28)

    rig = build_armature()
    skin(rig, parts)
    bpy.ops.object.select_all(action="DESELECT")
    for ob in parts + [rig]:
        ob.rotation_euler = (math.pi / 2, 0, 0)
        ob.select_set(True)
    bpy.context.view_layer.objects.active = rig
    bpy.ops.object.transform_apply(location=False, rotation=True, scale=False)
    return rig

def set_rot(pb, x=0.0, y=0.0, z=0.0):
    pb.rotation_mode = "XYZ"
    pb.rotation_euler = (x, y, z)

def make_action(rig, name, frames, fn):
    sc = bpy.context.scene
    act = bpy.data.actions.new(name)
    rig.animation_data_create()
    rig.animation_data.action = act
    sc.frame_start, sc.frame_end = 1, frames
    p = rig.pose.bones
    for f in range(1, frames + 1):
        sc.frame_set(f)
        fn(f, frames, p)
        for pb in p:
            pb.keyframe_insert("rotation_euler")
    rig.animation_data.action = None
    track = rig.animation_data.nla_tracks.new()
    track.strips.new(act.name, 1, act)
    act.use_fake_user = True

def add_animations(rig):
    def idle(f, n, p):
        t = 2 * math.pi * f / n
        set_rot(p["Chest"], 0.02 + 0.012 * math.sin(t), 0, 0.015 * math.sin(t * 0.5))
        set_rot(p["Head"], -0.01 + 0.018 * math.sin(t + 1), 0, 0.025 * math.sin(t * 0.5))
        set_rot(p["UpperArm_L"], 0.03 * math.sin(t), 0, 0.045)
        set_rot(p["UpperArm_R"], -0.03 * math.sin(t), 0, -0.045)

    def walk(f, n, p):
        t = 2 * math.pi * f / n
        s = math.sin(t)
        set_rot(p["UpperLeg_L"], 0.48 * s, 0, 0)
        set_rot(p["UpperLeg_R"], -0.48 * s, 0, 0)
        set_rot(p["LowerLeg_L"], max(0.0, -0.85 * s), 0, 0)
        set_rot(p["LowerLeg_R"], max(0.0, 0.85 * s), 0, 0)
        set_rot(p["Foot_L"], -0.18 * s, 0, 0)
        set_rot(p["Foot_R"], 0.18 * s, 0, 0)
        set_rot(p["UpperArm_L"], -0.38 * s, 0, 0.06)
        set_rot(p["UpperArm_R"], 0.38 * s, 0, -0.06)
        set_rot(p["Chest"], 0.05, 0, 0.028 * s)

    make_action(rig, "Idle", 60, idle)
    make_action(rig, "Walk", 24, walk)

def export(rig, path):
    bpy.ops.object.select_all(action="DESELECT")
    rig.select_set(True)
    bpy.context.view_layer.objects.active = rig
    bpy.ops.export_scene.gltf(
        filepath=path, export_format="GLB", use_selection=True,
        export_animations=True, export_skins=True, export_rest_position_armature=False,
        export_yup=True, export_apply=False,
    )

def render_preview(path):
    sc = bpy.context.scene
    sc.render.engine = "BLENDER_WORKBENCH"
    sh = sc.display.shading
    sh.light = "STUDIO"
    sh.color_type = "MATERIAL"
    sh.background_type = "WORLD"
    w = bpy.data.worlds.new("World")
    w.use_nodes = True
    w.node_tree.nodes["Background"].inputs[0].default_value = (0.85, 0.87, 0.9, 1)
    sc.world = w
    cam_data = bpy.data.cameras.new("Cam")
    cam = bpy.data.objects.new("Cam", cam_data)
    sc.collection.objects.link(cam)
    cam.location = (1.6, -2.0, 1.35)
    target = bpy.data.objects.new("Target", None)
    target.location = (0, 0, 0.95)
    sc.collection.objects.link(target)
    con = cam.constraints.new("TRACK_TO")
    con.target = target
    sc.camera = cam
    sc.render.resolution_x, sc.render.resolution_y = 512, 640
    sc.render.filepath = path
    bpy.ops.render.render(write_still=True)

SKIN = (0.72, 0.52, 0.38)
DARKSKIN = (0.55, 0.36, 0.24)
WHITE = (0.97, 0.97, 0.95)
CONFIGS = {
    "aris": {
        "female": False, "glasses": True,
        "colors": {"shirt": (0.90, 0.90, 0.88), "pants": (0.15, 0.18, 0.25),
                   "skin": SKIN, "hair": (0.08, 0.06, 0.05), "eyes": (0.20, 0.12, 0.08),
                   "pupil": (0.02, 0.02, 0.02), "white": WHITE, "lips": (0.60, 0.42, 0.34),
                   "shoes": (0.12, 0.12, 0.13), "glasses": (0.08, 0.08, 0.09)},
    },
    "siti": {
        "female": True, "hijab": True, "long_hair": False,
        "colors": {"shirt": (0.94, 0.94, 0.92), "pants": (0.20, 0.23, 0.30),
                   "skin": SKIN, "hair": (0.92, 0.92, 0.94), "eyes": (0.20, 0.12, 0.08),
                   "pupil": (0.02, 0.02, 0.02), "white": WHITE, "lips": (0.62, 0.42, 0.35),
                   "shoes": (0.12, 0.12, 0.13), "glasses": (0.08, 0.08, 0.09)},
    },
    "bimo": {
        "female": False, "spiky": True,
        "colors": {"shirt": (0.48, 0.09, 0.09), "pants": (0.09, 0.09, 0.11),
                   "skin": DARKSKIN, "hair": (0.04, 0.04, 0.04), "eyes": (0.09, 0.07, 0.05),
                   "pupil": (0.01, 0.01, 0.01), "white": WHITE, "lips": (0.45, 0.28, 0.22),
                   "shoes": (0.18, 0.05, 0.05), "glasses": (0.08, 0.08, 0.09)},
    },
    "pakbudi": {
        "female": False, "glasses": True,
        "colors": {"shirt": (0.42, 0.45, 0.28), "pants": (0.23, 0.20, 0.17),
                   "skin": (0.62, 0.45, 0.33), "hair": (0.20, 0.18, 0.16), "eyes": (0.16, 0.12, 0.09),
                   "pupil": (0.02, 0.02, 0.02), "white": WHITE, "lips": (0.52, 0.36, 0.30),
                   "shoes": (0.14, 0.11, 0.09), "glasses": (0.08, 0.08, 0.09)},
    },
    "student": {
        "female": False,
        "colors": {"shirt": (0.90, 0.90, 0.87), "pants": (0.17, 0.21, 0.28),
                   "skin": SKIN, "hair": (0.13, 0.10, 0.08), "eyes": (0.19, 0.12, 0.08),
                   "pupil": (0.02, 0.02, 0.02), "white": WHITE, "lips": (0.60, 0.42, 0.34),
                   "shoes": (0.13, 0.13, 0.14), "glasses": (0.08, 0.08, 0.09)},
    },
    "student_f": {
        "female": True, "long_hair": True,
        "colors": {"shirt": (0.92, 0.92, 0.90), "pants": (0.22, 0.22, 0.27),
                   "skin": SKIN, "hair": (0.12, 0.08, 0.06), "eyes": (0.19, 0.12, 0.08),
                   "pupil": (0.02, 0.02, 0.02), "white": WHITE, "lips": (0.62, 0.42, 0.35),
                   "shoes": (0.13, 0.13, 0.14), "glasses": (0.08, 0.08, 0.09)},
    },
}

for name, cfg in CONFIGS.items():
    rig = build_character(cfg)
    add_animations(rig)
    export(rig, os.path.join(OUT, f"{name}.glb"))
    render_preview(os.path.join(OUT, f"{name}_preview.png"))
    print(f"DONE {name}")
