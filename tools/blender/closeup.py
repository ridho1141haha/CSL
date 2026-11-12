"""python3 closeup.py out.png [char ...]  -> head (front, 3/4 via side) + hand + hair-back close-ups."""
import sys
from PIL import Image
import csl_geometry as G
from preview_pure import render_view
from csl_specs import SPECS
out = sys.argv[1]; names = sys.argv[2:] or ['aris', 'siti', 'bimo']
tex = None
rows = []
for n in names:
    sp = SPECS[n]; r = G.build(sp)
    if 'atlas_arr' in r: tex = r['atlas_arr']
    H = sp['height']
    cells = [render_view(r, 'front', 0, H - 0.105, 0.30, 520, tex),
             render_view(r, 'side', 0, H - 0.105, 0.30, 520, tex),
             render_view(r, 'back', 0, H - 0.105, 0.30, 520, tex),
             render_view(r, 'front', 0.17 * H / 1.62, 0.43 * H, 0.34, 520, tex),
             render_view(r, 'front', 0, 0.74 * H, 0.60, 520, tex)]
    row = Image.new('RGB', (520 * len(cells), 520))
    for i, c in enumerate(cells): row.paste(c, (i * 520, 0))
    rows.append(row)
sheet = Image.new('RGB', (rows[0].width, 520 * len(rows)))
for i, rw in enumerate(rows): sheet.paste(rw, (0, i * 520))
sheet.save(out)
