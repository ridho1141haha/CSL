"""CSL texture atlas — numpy only (no PIL, so it also runs inside Blender's Python).

One 1024x512 sRGB atlas per character. 8 cells of 256 px:
  skin, face, shirt, trousers(+skirt), hair, shoe, accent  -> procedurally detailed
  palette                                                    -> 4x4 flat swatches for tiny parts
After apply(), every mesh uses ONE material ('atlas') => 3 draw calls per character
(Body, Head, Hair) instead of ~13.
"""
import zlib, struct
import numpy as np

GX, GY, CELL = 4, 2, 256
ATLAS_W, ATLAS_H = GX * CELL, GY * CELL
CELLS = {'skin': 0, 'face': 1, 'shirt': 2, 'trousers': 3, 'hair': 4, 'shoe': 5, 'accent': 6, 'palette': 7}
ALIAS = {'skirt': 'trousers'}
SWATCH = ['belt', 'sole', 'pupil', 'mouth', 'lip', 'button', 'metal', 'eye_white', 'iris', 'sock']
MARGIN = 0.03


def hex_rgb(h):
    return np.array([int(h[i:i + 2], 16) for i in (1, 3, 5)], dtype=np.float32)


# ------------------------------------------------------------- uv remap ----
def remap_uv(mat, uv):
    mat = ALIAS.get(mat, mat)
    if mat in SWATCH:
        k = SWATCH.index(mat)
        cx, cy = CELLS['palette'] % GX, CELLS['palette'] // GX
        u = (cx + ((k % 4) + 0.5) / 4.0) / GX
        v = (cy + ((k // 4) + 0.5) / 4.0) / GY
        return (u, v)
    cx, cy = CELLS[mat] % GX, CELLS[mat] // GX
    return ((cx + MARGIN + uv[0] * (1 - 2 * MARGIN)) / GX, (cy + MARGIN + uv[1] * (1 - 2 * MARGIN)) / GY)


# ------------------------------------------------------------- painting ----
def vnoise(rng, cells):
    g = rng.random((cells + 1, cells + 1)).astype(np.float32)
    xs = np.linspace(0, cells - 1e-3, CELL)
    i0 = xs.astype(int)
    f = xs - i0
    f = f * f * (3 - 2 * f)
    fx, fy = f[None, :], f[:, None]
    a = g[np.ix_(i0, i0)] * (1 - fx) + g[np.ix_(i0, i0 + 1)] * fx
    b = g[np.ix_(i0 + 1, i0)] * (1 - fx) + g[np.ix_(i0 + 1, i0 + 1)] * fx
    return (a * (1 - fy) + b * fy) - 0.5          # -0.5 .. 0.5


def grids():
    U = np.linspace(0, 1, CELL, dtype=np.float32)[None, :].repeat(CELL, 0)
    V = np.linspace(1, 0, CELL, dtype=np.float32)[:, None].repeat(CELL, 1)   # image row 0 = v 1
    return U, V


def blob(U, V, u0, v0, su, sv):
    return np.exp(-(((U - u0) / su) ** 2 + ((V - v0) / sv) ** 2))


def paint(name, base_hex, rng):
    base = hex_rgb(base_hex)
    U, V = grids()
    k = np.ones((CELL, CELL), np.float32)
    if name == 'skin':
        k += 0.06 * vnoise(rng, 4) + 0.03 * vnoise(rng, 24)
        img = base[None, None, :] * k[..., None]
    elif name == 'face':
        # v = 0 crown ... 1 chin; u = 0.5 is the front of the face (seam sits at the back of the head)
        k += 0.05 * vnoise(rng, 4) + 0.025 * vnoise(rng, 24)
        k += 0.035 * np.clip((0.25 - V) * 4, 0, 1) * -1 + 0.03 * np.clip((V - 0.82) * 6, 0, 1) * -1
        img = base[None, None, :] * k[..., None]
        blush = (blob(U, V, 0.415, 0.56, 0.045, 0.06) + blob(U, V, 0.585, 0.56, 0.045, 0.06)) * 0.20
        blush += blob(U, V, 0.5, 0.49, 0.03, 0.035) * 0.10
        warm = np.array([225, 120, 105], np.float32)
        img = img * (1 - blush[..., None]) + warm[None, None, :] * blush[..., None]
    elif name == 'shirt':
        weave = 0.020 * np.sin(2 * np.pi * U * CELL / 3.0) * np.sin(2 * np.pi * V * CELL / 3.0)
        k += weave + 0.035 * vnoise(rng, 6) + 0.015 * vnoise(rng, 32)
        img = base[None, None, :] * k[..., None]
    elif name == 'trousers':
        twill = 0.040 * np.sin(2 * np.pi * (U + V) * CELL / 5.0)
        k += twill + 0.04 * vnoise(rng, 6) + 0.015 * vnoise(rng, 32)
        img = base[None, None, :] * k[..., None]
    elif name == 'hair':
        col = rng.random(CELL).astype(np.float32)
        col = np.convolve(col, np.ones(5, np.float32) / 5, mode='same')
        col = (col - col.mean()) / (col.std() + 1e-6)
        strand = col[None, :] * np.ones((CELL, 1), np.float32)
        hl = blob(U, V, 0.5, 0.40, 2.0, 0.07)            # glossy band across the crown
        img = base[None, None, :] + strand[..., None] * 7.0 + 14.0 * vnoise(rng, 40)[..., None] \
            + hl[..., None] * np.array([26, 28, 34], np.float32)[None, None, :]
        img = img + (strand * 4.0)[..., None]
    elif name == 'shoe':
        k += 0.05 * vnoise(rng, 8) + 0.02 * vnoise(rng, 32)
        img = base[None, None, :] * k[..., None] + blob(U, V, 0.5, 0.6, 2.0, 0.12)[..., None] * 9.0
    else:  # accent
        k += 0.04 * vnoise(rng, 8) + 0.02 * vnoise(rng, 32)
        img = base[None, None, :] * k[..., None]
    return np.clip(img, 0, 255)


def build_atlas(res):
    mats = res['materials']
    rng = np.random.default_rng(7)
    atlas = np.zeros((ATLAS_H, ATLAS_W, 3), np.float32)

    def put(idx, tile):
        cx, cy = idx % GX, idx // GX
        r0 = (GY - 1 - cy) * CELL
        atlas[r0:r0 + CELL, cx * CELL:(cx + 1) * CELL] = tile

    for nm in ('skin', 'face', 'shirt', 'trousers', 'hair', 'shoe', 'accent'):
        put(CELLS[nm], paint(nm, mats[nm][0], rng))
    pal = np.zeros((CELL, CELL, 3), np.float32)
    sw = CELL // 4
    for k, nm in enumerate(SWATCH):
        r, c = k // 4, k % 4            # swatch row counted from the BOTTOM of the cell (v up)
        pal[CELL - (r + 1) * sw:CELL - r * sw, c * sw:(c + 1) * sw] = hex_rgb(mats[nm][0])
    put(CELLS['palette'], pal)
    return np.clip(atlas, 0, 255).astype(np.uint8)


def apply(res):
    """Convert a G.build() result to the single-material atlas layout (in place)."""
    arr = build_atlas(res)
    for m in res['meshes']:
        m.faces = [(vs, tuple(remap_uv(mat, uv) for uv in uvs), 'atlas') for vs, uvs, mat in m.faces]
    res['atlas_arr'] = arr
    res['materials'] = {'atlas': ('#ffffff', 0.6)}
    return res


def write_png(path, arr):
    h, w, _ = arr.shape
    raw = np.concatenate([np.zeros((h, 1), np.uint8), arr.reshape(h, w * 3)], axis=1).tobytes()

    def chunk(tag, data):
        c = struct.pack('>I', len(data)) + tag + data
        return c + struct.pack('>I', zlib.crc32(tag + data) & 0xffffffff)
    with open(path, 'wb') as f:
        f.write(b'\x89PNG\r\n\x1a\n' + chunk(b'IHDR', struct.pack('>IIBBBBB', w, h, 8, 2, 0, 0, 0))
                + chunk(b'IDAT', zlib.compress(raw, 9)) + chunk(b'IEND', b''))
