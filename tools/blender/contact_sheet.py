"""Render contact sheets from the exported GLBs (Workbench, no GPU needed).

  blender -b --python tools/blender/contact_sheet.py -- --dir assets/characters --out assets/characters/sheets
Produces rest_pose_front.png and presentation_three_quarter.png.
"""
import sys, os, math, glob, argparse
import bpy
argv = sys.argv[sys.argv.index('--') + 1:] if '--' in sys.argv else []
ap = argparse.ArgumentParser(); ap.add_argument('--dir', default='assets/characters'); ap.add_argument('--out', default='assets/characters/sheets')
a = ap.parse_args(argv)
os.makedirs(a.out, exist_ok=True)

order = ['ren', 'aris', 'siti', 'bimo', 'pak_budi']
files = [os.path.join(a.dir, n + '.glb') for n in order if os.path.exists(os.path.join(a.dir, n + '.glb'))]
files += sorted(glob.glob(os.path.join(a.dir, 'ambient', '*.glb')))

bpy.ops.wm.read_factory_settings(use_empty=True)
for i, f in enumerate(files):
    before = set(bpy.data.objects)
    bpy.ops.import_scene.gltf(filepath=f)
    new = [o for o in bpy.data.objects if o not in before]
    for o in new:
        if o.parent is None:
            o.location.x += (i - (len(files) - 1) / 2) * 0.9

sc = bpy.context.scene
sc.render.engine = 'BLENDER_WORKBENCH'
sc.display.shading.light = 'STUDIO'
sc.display.shading.color_type = 'MATERIAL'
sc.render.resolution_x, sc.render.resolution_y = 3200, 1100
sc.world = bpy.data.worlds.new('w'); sc.world.color = (0.23, 0.24, 0.27)
cam = bpy.data.objects.new('cam', bpy.data.cameras.new('cam')); sc.collection.objects.link(cam); sc.camera = cam
cam.data.type = 'ORTHO'; cam.data.ortho_scale = max(3.0, 0.9 * len(files) + 0.4)

def shot(name, yaw):
    d = 12.0
    cam.location = (math.sin(yaw) * d, -math.cos(yaw) * d, 0.95)
    cam.rotation_euler = (math.radians(90), 0, yaw)
    sc.render.filepath = os.path.join(a.out, name)
    bpy.ops.render.render(write_still=True)

shot('rest_pose_front.png', 0.0)
shot('presentation_three_quarter.png', math.radians(35))
print('[CSL] sheets written to', a.out)
