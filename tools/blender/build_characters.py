"""Build CSL characters in Blender.

  blender -b --python tools/blender/build_characters.py -- --out assets/characters [--only aris,siti]

Writes <out>/<file>.glb and <out>/blend/<file>.blend for each spec in csl_specs.SPECS.
"""
import sys, os, json, argparse
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import bpy
import csl_geometry as G
import csl_blender as B
from csl_specs import SPECS

argv = sys.argv[sys.argv.index('--') + 1:] if '--' in sys.argv else []
ap = argparse.ArgumentParser()
ap.add_argument('--out', default='assets/characters')
ap.add_argument('--only', default='')
a = ap.parse_args(argv)

os.makedirs(os.path.join(a.out, 'blend'), exist_ok=True)
names = [n for n in a.only.split(',') if n] or list(SPECS)
report = {}
for n in names:
    spec = SPECS[n]
    res = G.build(spec)
    B.build_scene(res)
    glb = os.path.join(a.out, spec['file'] + '.glb')
    B.export_glb(glb)
    bpy.ops.wm.save_as_mainfile(filepath=os.path.join(a.out, 'blend', spec['file'] + '.blend'))
    st = G.stats(res)
    st['bytes'] = os.path.getsize(glb)
    report[n] = st
    print('[CSL] %-9s tris=%d height=%.3f glb=%.1fKB' % (n, st['_total_tris'], st['_height'], st['bytes'] / 1024))
with open(os.path.join(a.out, 'build_report.json'), 'w') as f:
    json.dump(report, f, indent=2)
