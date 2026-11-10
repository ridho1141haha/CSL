"""Blender-free animation QA: pose the geometry with FK + skinning and render strips.
  python3 anim_preview.py <char> <out.png> Clip1:6 Clip2:6 ...   (name:frames-to-show)
Also prints grounding stats (lowest vertex per clip) for every clip."""
import sys
from PIL import Image, ImageDraw
import csl_geometry as G, csl_anim as A
from csl_specs import SPECS
from preview_pure import render

def vpts(res, step=5):
    pts = []
    for m in res['meshes']:
        for i in range(0, len(m.verts), step): pts.append((m.verts[i], m.weights[i]))
    return pts

def stats(char='aris'):
    x = A.Ctx(SPECS[char]); res = G.build(SPECS[char]); sp = vpts(res)
    print('%-18s %5s %6s  %s' % ('clip', 'frames', 'minZ', 'max |bone angle| deg'))
    for name in A.all_clip_names():
        fr = A.sample_clip(x, name, sp); mn = 9; mx = 0
        for f in fr[::3]:
            pm = A.posed_meshes(res, x, f)
            mn = min(mn, min(v[2] for m in pm['meshes'] for v in m.verts))
        for f in fr:
            for v in f['pose'].r.values(): mx = max(mx, max(abs(c) for c in v))
        print('%-18s %5d %6.3f  %.0f' % (name, len(fr), mn, mx))

if __name__ == '__main__':
    if len(sys.argv) < 3: stats(); sys.exit()
    char, out = sys.argv[1], sys.argv[2]
    x = A.Ctx(SPECS[char]); res = G.build(SPECS[char]); sp = vpts(res)
    rows = []
    for arg in sys.argv[3:]:
        name, n = (arg.split(':') + ['6'])[:2]; n = int(n)
        fr = A.sample_clip(x, name, sp); idx = [round(i * (len(fr) - 1) / max(1, n - (0 if A.clip_info(name)['loop'] else 1))) for i in range(n)]
        idx = [min(i, len(fr) - 1) for i in idx]
        cells = [render(A.posed_meshes(res, x, fr[i]), 'side', scale=150, pad=14, Hmax=1.85, Wm=1.5) for i in idx]
        row = Image.new('RGB', (cells[0].width * n, cells[0].height))
        for k, c in enumerate(cells): row.paste(c, (k * c.width, 0))
        ImageDraw.Draw(row).text((6, 4), name, fill=(255, 255, 255)); rows.append(row)
    sheet = Image.new('RGB', (rows[0].width, sum(r.height for r in rows)))
    y = 0
    for r in rows: sheet.paste(r, (0, y)); y += r.height
    sheet.save(out)
