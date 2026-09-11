# CSL — realistic NPC generator via MB-Lab (Blender headless)
# Run: blender.exe --background --python gen_mblab.py -- <mblab_zip> <out_dir>
import bpy, sys, math, importlib, os
from mathutils import Vector

args = sys.argv[sys.argv.index("--") + 1:]
MBLAB_ZIP, OUT = args[0], args[1]

# 1. install + enable the add-on
bpy.ops.preferences.addon_install(filepath=MBLAB_ZIP)
import addon_utils
addon_utils.enable("MB-Lab-master", default_set=True)
mod = importlib.import_module("MB-Lab-master")
print("MB-Lab enabled:", hasattr(mod, "start_lab_session"))

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
    cam.location = (1.4, -2.1, 1.3)
    target = bpy.data.objects.new("Target", None)
    target.location = (0, 0, 0.95)
    sc.collection.objects.link(target)
    con = cam.constraints.new("TRACK_TO")
    con.target = target
    sc.camera = cam
    sc.render.resolution_x, sc.render.resolution_y = 512, 640
    sc.render.filepath = path
    bpy.ops.render.render(write_still=True)

def make(name, char_id, mass, tone, seed_note):
    # fresh scene (this resets addon state -> re-enable)
    bpy.ops.wm.read_factory_settings(use_empty=True)
    import addon_utils
    addon_utils.enable("MB-Lab-master", default_set=True)
    scn = bpy.context.scene
    scn.mblab_character_name = char_id
    scn.mblab_use_ik = False
    scn.mblab_use_muscle = False
    scn.mblab_use_cycles = False
    scn.mblab_use_eevee = False
    scn.mblab_use_lamps = False
    mod.start_lab_session()
    hum = mod.mblab_humanoid
    # (random_value, prv_face, prv_body, prv_mass, prv_tone, prv_height, prv_phenotype,
    #  set_tone_and_mass, body_mass, body_tone, prv_fantasy)
    hum.generate_character(0.2, False, False, False, False, False, False, True, mass, tone, False)
    hum.update_materials(update_textures_nodes=True)
    print(f"[{name}] built: {hum.has_data}")

    # find the human mesh object
    obj = None
    for o in bpy.data.objects:
        if o.get("manuellab_id"):
            obj = o
            break
    if not obj:
        print(f"[{name}] ERROR no human object")
        return
    obj.name = name

    # select only the human (skip internal rigs of base template) and export
    bpy.ops.object.select_all(action="DESELECT")
    obj.select_set(True)
    bpy.context.view_layer.objects.active = obj
    bpy.ops.export_scene.gltf(
        filepath=os.path.join(OUT, f"{name}.glb"),
        export_format="GLB", use_selection=True, export_apply=True,
        export_animations=False, export_yup=True,
    )
    render_preview(os.path.join(OUT, f"{name}_preview.png"))
    print(f"DONE {name}")

# casts: (name, character_id, body_mass, body_tone)
CAST = [
    ("aris",     "m_as01", 0.3, 0.3),   # slim, pale
    ("bimo",     "m_as01", 0.8, 0.7),   # heavy build, tan
    ("pakbudi",  "m_as01", 0.6, 0.4),   # middle-aged build
    ("student",  "m_as01", 0.5, 0.5),
    ("siti",     "f_as01", 0.3, 0.4),
    ("student_f","f_as01", 0.4, 0.5),
]
for nm, cid, mass, tone in CAST:
    make(nm, cid, mass, tone, "")
