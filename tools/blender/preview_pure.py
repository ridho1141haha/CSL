"""Blender-free preview: orthographic painter's-algorithm render of the pure
geometry (front + side) to a PNG, plus a stats table. Run: python3 preview_pure.py [out.png]"""
import sys, json
from PIL import Image, ImageDraw
import csl_geometry as G
from csl_specs import SPECS

def hexrgb(h): return tuple(int(h[i:i+2], 16) for i in (1, 3, 5))

def render(res, view, scale=300, pad=30, Hmax=1.85, Wm=0.9):
    mats = res['materials']
    W_, H_ = int(Wm * scale) + pad * 2, int(Hmax * scale) + pad * 2
    img = Image.new('RGB', (W_, H_), (58, 62, 70)); dr = ImageDraw.Draw(img)
    polys = []
    for m in res['meshes']:
        for vs, uv, mat in m.faces:
            P = [m.verts[i] for i in vs]
            if view == 'front':
                pts = [(p[0], p[2]) for p in P]; depth = sum(p[1] for p in P) / len(P)   # smaller y = nearer
                key = -depth
            else:
                pts = [(p[1], p[2]) for p in P]; depth = sum(p[0] for p in P) / len(P)   # larger x = nearer
                key = depth
            n = G.cross(G.sub(P[1], P[0]), G.sub(P[2], P[0])); n = G.norm(n)
            cam = (0, -1, 0) if view == 'front' else (1, 0, 0)
            facing = G.dot(n, cam)
            if facing < 0: continue
            light = 0.35 + 0.65 * facing
            c = hexrgb(mats[mat][0]); col = tuple(int(min(255, v * light)) for v in c)
            polys.append((key, pts, col))
    polys.sort(key=lambda t: t[0])
    cx = W_ / 2
    for _, pts, col in polys:
        dr.polygon([(cx + x * scale, H_ - pad - z * scale) for x, z in pts], fill=col)
    return img

if __name__ == '__main__':
    out = sys.argv[1] if len(sys.argv) > 1 else 'preview.png'
    names = list(SPECS)
    sheet = None; allstats = {}
    for i, k in enumerate(names):
        res = G.build(SPECS[k]); allstats[k] = G.stats(res)
        f, s = render(res, 'front'), render(res, 'side')
        if sheet is None: sheet = Image.new('RGB', (f.width * len(names), f.height * 2))
        sheet.paste(f, (i * f.width, 0)); sheet.paste(s, (i * f.width, f.height))
    sheet.save(out)
    for k, v in allstats.items():
        print(k, 'tris', v['_total_tris'], 'height %.3f' % v['_height'], 'minz %.4f' % v['_min_z'],
              {n: (v[n]['tris'], len(v[n]['materials'])) for n in v if not n.startswith('_')})


def render_view(res, view, cx, cz, span, size=640, tex=None):
    """Zoomed ortho render. view: front|side|back. (cx, cz) = world centre, span = metres shown."""
    mats = res['materials']
    img = Image.new('RGB', (size, size), (58, 62, 70)); dr = ImageDraw.Draw(img)
    polys = []
    cam = {'front': (0, -1, 0), 'side': (1, 0, 0), 'back': (0, 1, 0)}[view]
    for m in res['meshes']:
        for vs, uv, mat in m.faces:
            P = [m.verts[i] for i in vs]
            n = G.norm(G.cross(G.sub(P[1], P[0]), G.sub(P[2], P[0])))
            f = G.dot(n, cam)
            if f < 0: continue
            if view == 'front': pts = [(p[0], p[2]) for p in P]; key = -sum(p[1] for p in P)
            elif view == 'back': pts = [(-p[0], p[2]) for p in P]; key = sum(p[1] for p in P)
            else: pts = [(p[1], p[2]) for p in P]; key = sum(p[0] for p in P)
            if tex is not None and mat == 'atlas':
                u = sum(c[0] for c in uv) / len(uv); v = sum(c[1] for c in uv) / len(uv)
                h, w, _ = tex.shape; c = tuple(int(x) for x in tex[min(h - 1, int((1 - v) * h)), min(w - 1, int(u * w))])
            else:
                c = hexrgb(mats[mat][0])
            col = tuple(int(min(255, x * (0.35 + 0.65 * f))) for x in c)
            polys.append((key, pts, col))
    polys.sort(key=lambda t: t[0])
    k = size / span; cxp = cx if view != 'back' else -cx
    for _, pts, col in polys:
        dr.polygon([((x - cxp) * k + size / 2, size / 2 - (z - cz) * k) for x, z in pts], fill=col)
    return img
