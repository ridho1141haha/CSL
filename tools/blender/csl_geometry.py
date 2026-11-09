"""CSL character geometry — PURE PYTHON (no bpy).

Builds a rigged, weighted, UV'd humanoid as plain lists so it can be unit-tested
and previewed without Blender. csl_blender.py turns the result into Blender
objects and exports GLB.

Coordinates: metres, Z-up, character faces -Y, character's LEFT is +X
(Blender convention; the glTF exporter converts to Y-up / +Z forward).
Feet at z = 0.
"""
import math

H0 = 1.62  # reference height the profile tables below were authored at


# ----------------------------------------------------------------- math ----
def clamp(x, a, b):
    return a if x < a else b if x > b else x


def smooth(e0, e1, x):
    """smoothstep from e0 (->0) to e1 (->1); works for e0 > e1 too."""
    if e0 == e1:
        return 1.0 if x >= e1 else 0.0
    t = clamp((x - e0) / (e1 - e0), 0.0, 1.0)
    return t * t * (3 - 2 * t)


def lerp(a, b, t):
    return a + (b - a) * t


def add(a, b):
    return (a[0] + b[0], a[1] + b[1], a[2] + b[2])


def sub(a, b):
    return (a[0] - b[0], a[1] - b[1], a[2] - b[2])


def mul(a, k):
    return (a[0] * k, a[1] * k, a[2] * k)


def dot(a, b):
    return a[0] * b[0] + a[1] * b[1] + a[2] * b[2]


def cross(a, b):
    return (a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0])


def norm(a):
    l = math.sqrt(dot(a, a)) or 1.0
    return (a[0] / l, a[1] / l, a[2] / l)


def centroid(pts):
    n = float(len(pts))
    return (sum(p[0] for p in pts) / n, sum(p[1] for p in pts) / n, sum(p[2] for p in pts) / n)


def pw(pts_vals, x):
    """piecewise-linear interpolation over [(x, value), ...] ascending in x."""
    if x <= pts_vals[0][0]:
        return pts_vals[0][1]
    for (x0, v0), (x1, v1) in zip(pts_vals, pts_vals[1:]):
        if x <= x1:
            return lerp(v0, v1, (x - x0) / (x1 - x0))
    return pts_vals[-1][1]


# ----------------------------------------------------------------- mesh ----
class Mesh:
    def __init__(self, name):
        self.name = name
        self.verts = []
        self.weights = []   # per vertex: {bone: w}
        self.faces = []     # (vert idx tuple, uv tuple, material name)
        self.morphs = {}    # name -> {vert idx: (dx, dy, dz)}

    def add_vert(self, p, w):
        self.verts.append((p[0], p[1], p[2]))
        self.weights.append(w)
        return len(self.verts) - 1

    def set_delta(self, morph, vi, d):
        self.morphs.setdefault(morph, {})[vi] = d

    @property
    def tris(self):
        return sum(1 if len(f[0]) == 3 else 2 for f in self.faces)

    def material_names(self):
        seen = []
        for f in self.faces:
            if f[2] not in seen:
                seen.append(f[2])
        return seen


def _as_matfn(mat):
    return mat if callable(mat) else (lambda i, c: mat)


def ring(c, ux, uy, rx, ry, n):
    return [add(c, add(mul(ux, rx * math.cos(2 * math.pi * j / n)),
                       mul(uy, ry * math.sin(2 * math.pi * j / n)))) for j in range(n)]


def loft(mesh, rings, wf, mat, cap_start=None, cap_end=None):
    """Skin a list of equal-length rings. wf(point)->{bone: w}.
    mat: material name or fn(segment_index, face_centroid)->name.
    cap_start/cap_end: None | 'auto' | point (pole). Returns (first, last+1) vert idx.
    Winding is auto-oriented outward."""
    matfn = _as_matfn(mat)
    N, R = len(rings[0]), len(rings)
    first = len(mesh.verts)
    idx = [[mesh.add_vert(p, wf(p)) for p in rg] for rg in rings]
    cents = [centroid(rg) for rg in rings]

    quads = []
    score = 0.0
    for i in range(R - 1):
        for j in range(N):
            j2 = (j + 1) % N
            q = (idx[i][j], idx[i][j2], idx[i + 1][j2], idx[i + 1][j])
            quads.append((i, j, q))
            p0, p1, p3 = rings[i][j], rings[i][j2], rings[i + 1][j]
            n = cross(sub(p1, p0), sub(p3, p0))
            score += dot(n, sub(p0, cents[i]))
    flip = score < 0
    for i, j, q in quads:
        uv = ((j / N, i / max(1, R - 1)), ((j + 1) / N, i / max(1, R - 1)),
              ((j + 1) / N, (i + 1) / max(1, R - 1)), (j / N, (i + 1) / max(1, R - 1)))
        cen = centroid([mesh.verts[v] for v in q])
        m = matfn(i, cen)
        if flip:
            q, uv = q[::-1], uv[::-1]
        mesh.faces.append((q, uv, m))

    def cap(ring_i, pole, outward):
        rg = rings[ring_i]
        c = centroid(rg) if (pole is None or pole == 'auto') else pole
        ci = mesh.add_vert(c, wf(c))
        for j in range(N):
            j2 = (j + 1) % N
            a, b = rings[ring_i][j], rings[ring_i][j2]
            nrm = cross(sub(a, c), sub(b, c))
            tri = (ci, idx[ring_i][j], idx[ring_i][j2])
            uvs = ((0.5, 0.5),
                   (0.5 + 0.5 * math.cos(2 * math.pi * j / N), 0.5 + 0.5 * math.sin(2 * math.pi * j / N)),
                   (0.5 + 0.5 * math.cos(2 * math.pi * (j + 1) / N), 0.5 + 0.5 * math.sin(2 * math.pi * (j + 1) / N)))
            if dot(nrm, outward) < 0:
                tri, uvs = tri[::-1], uvs[::-1]
            mesh.faces.append((tri, uvs, matfn(0 if ring_i == 0 else R - 2, c)))

    if cap_start is not None:
        cap(0, cap_start, sub(cents[0], cents[1]))
    if cap_end is not None:
        cap(R - 1, cap_end, sub(cents[-1], cents[-2]))
    return first, len(mesh.verts)


def ellipsoid(mesh, c, radii, wf, mat, nA=10, nP=6, roll=0.0):
    rx, ry, rz = radii
    cr, sr = math.cos(roll), math.sin(roll)
    rings = []
    for i in range(1, nP):
        phi = math.pi * i / nP
        rg = []
        for j in range(nA):
            lam = 2 * math.pi * j / nA
            x, y, z = rx * math.sin(phi) * math.sin(lam), -ry * math.sin(phi) * math.cos(lam), rz * math.cos(phi)
            rg.append(add(c, (x * cr + z * sr, y, -x * sr + z * cr)))
        rings.append(rg)
    top = add(c, (rz * sr, 0, rz * cr))
    bot = add(c, (-rz * sr, 0, -rz * cr))
    return loft(mesh, rings, wf, mat, cap_start=top, cap_end=bot)


def seq_weights(s, bones, bounds, widths):
    """Sequential joint blend. bones[i] owns the span before bounds[i]."""
    out = {}
    prev = 1.0
    for i, b in enumerate(bones):
        if i < len(bounds):
            step = smooth(bounds[i] - widths[i], bounds[i] + widths[i], s)
        else:
            step = 0.0
        out[b] = out.get(b, 0.0) + prev * (1.0 - step)
        prev = step if i < len(bounds) else 0.0
        if i < len(bounds):
            prev = step
    return out


def finish_weights(w, maxinf=4):
    items = sorted(((b, v) for b, v in w.items() if v > 0.01), key=lambda kv: -kv[1])[:maxinf]
    tot = sum(v for _, v in items) or 1.0
    return {b: v / tot for b, v in items}


# ------------------------------------------------------------- materials ----
def material_table(spec):
    c = spec['colors']
    return {
        'skin': (c['skin'], 0.5),
        'shirt': (c['shirt'], 0.7),
        'accent': (c['accent'], 0.6),
        'trousers': (c['trousers'], 0.75),
        'skirt': (c['trousers'], 0.75),
        'belt': ('#1b1b1f', 0.5),
        'shoe': ('#14161c', 0.45),
        'sole': ('#0c0d11', 0.7),
        'sock': ('#e9edf2', 0.8),
        'hair': (c['hair'], 0.5),
        'eye_white': ('#f1f2f4', 0.3),
        'iris': (c.get('iris', '#2a1d15'), 0.25),
        'mouth': ('#8a4a44', 0.5),
    }


# ------------------------------------------------------------------ rig ----
BONE_NAMES = ['Root', 'Hips', 'Spine', 'Chest', 'Neck', 'Head',
              'UpperArm_L', 'LowerArm_L', 'Hand_L', 'UpperArm_R', 'LowerArm_R', 'Hand_R',
              'UpperLeg_L', 'LowerLeg_L', 'Foot_L', 'UpperLeg_R', 'LowerLeg_R', 'Foot_R']

ARM_ANGLE = math.radians(9.0)  # arms hang slightly out (A-pose-ish)


def rig(spec):
    """Returns {bone: (head, tail, parent)} for this character's proportions."""
    H = spec['height']
    s = H / H0
    b = spec['build']
    sx = 0.133 * s * b['shoulder']
    lx = 0.084 * s * b['hip']
    zS = 0.805 * H
    d = (math.sin(ARM_ANGLE), 0.0, -math.cos(ARM_ANGLE))
    up, lo, hd = 0.186 * H, 0.146 * H, 0.108 * H
    bones = {
        'Root': ((0, 0, 0), (0, 0, 0.08 * s), None),
        'Hips': ((0, 0, 0.54 * H), (0, 0, 0.585 * H), 'Root'),
        'Spine': ((0, 0, 0.585 * H), (0, 0, 0.69 * H), 'Hips'),
        'Chest': ((0, 0, 0.69 * H), (0, 0, 0.80 * H), 'Spine'),
        'Neck': ((0, 0, 0.80 * H), (0, 0, 0.86 * H), 'Chest'),
        'Head': ((0, 0, 0.86 * H), (0, 0, H), 'Neck'),
    }
    for side, sg in (('L', 1), ('R', -1)):
        S = (sg * sx, 0, zS)
        dd = (sg * d[0], 0, d[2])
        E = add(S, mul(dd, up))
        W = add(E, mul(dd, lo))
        T = add(W, mul(dd, hd * 0.55))
        bones['UpperArm_' + side] = (S, E, 'Chest')
        bones['LowerArm_' + side] = (E, W, 'UpperArm_' + side)
        bones['Hand_' + side] = (W, T, 'LowerArm_' + side)
        x = sg * lx
        bones['UpperLeg_' + side] = ((x, 0, 0.525 * H), (x, 0, 0.285 * H), 'Hips')
        bones['LowerLeg_' + side] = ((x, 0, 0.285 * H), (x, 0, 0.045 * H), 'UpperLeg_' + side)
        bones['Foot_' + side] = ((x, 0, 0.045 * H), (x, -0.15 * s, 0.02 * H), 'LowerLeg_' + side)
    return bones


# ------------------------------------------------------------- the build ----
def build(spec):
    """spec -> {'meshes': [Mesh...], 'bones': {...}, 'materials': {...}}"""
    H = spec['height']
    s = H / H0
    b = spec['build']
    skirt = spec.get('bottom') == 'skirt'
    bones = rig(spec)
    body = Mesh(spec['name'] + '_Body')
    headm = Mesh(spec['name'] + '_Head')
    hairm = Mesh(spec['name'] + '_Hair')

    def W(d):
        return finish_weights(d)

    # ---- weight functions ------------------------------------------------
    def w_torso(p):
        z = p[2]
        return W(seq_weights(z, ['Hips', 'Spine', 'Chest', 'Neck'],
                             [0.60 * H, 0.70 * H, 0.838 * H], [0.025 * H, 0.03 * H, 0.012 * H]))

    def w_pelvis(p):
        z, x = p[2], p[0]
        wl = smooth(0.545 * H, 0.47 * H, z)
        sl = clamp(0.5 + x / (0.08 * s), 0.0, 1.0)
        d = {'Hips': 1 - wl, 'UpperLeg_L': wl * sl, 'UpperLeg_R': wl * (1 - sl)}
        if z > 0.585 * H:
            d = w_torso(p)
        return W(d)

    def w_leg(side):
        def f(p):
            u = -p[2]
            return W(seq_weights(u, ['UpperLeg_' + side, 'LowerLeg_' + side, 'Foot_' + side],
                                 [-0.285 * H, -0.05 * H], [0.04 * H, 0.02 * H]))
        return f

    def w_arm(side):
        S, E, _ = bones['UpperArm_' + side]
        Wr = bones['LowerArm_' + side][1]
        ax = norm(sub(Wr, S))

        def f(p):
            sal = dot(sub(p, S), ax)
            d = seq_weights(sal, ['UpperArm_' + side, 'LowerArm_' + side, 'Hand_' + side],
                            [0.186 * H, 0.332 * H], [0.035 * s, 0.015 * s])
            wc = 0.5 * (1 - smooth(0.0, 0.09 * s, sal))
            d = {k: v * (1 - wc) for k, v in d.items()}
            d['Chest'] = wc
            return W(d)
        return f

    def w_head(p):
        return {'Head': 1.0}

    def w_neck(p):
        return W(seq_weights(p[2], ['Chest', 'Neck', 'Head'], [0.815 * H, 0.862 * H], [0.02 * H, 0.02 * H]))

    def w_foot(p):
        return {('Foot_L' if p[0] > 0 else 'Foot_R'): 1.0}

    def w_skirt(p):
        z, x = p[2], p[0]
        wl = 0.45 * smooth(0.5 * H, 0.3 * H, z)
        sl = clamp(0.5 + x / (0.08 * s), 0.0, 1.0)
        return W({'Hips': 1 - wl, 'UpperLeg_L': wl * sl, 'UpperLeg_R': wl * (1 - sl)})

    # ---- torso (shirt) -----------------------------------------------------
    NT = 20
    rows = [  # zf, rx, ry, kind
        (0.585, 0.126, 0.086, 'waist'), (0.640, 0.130, 0.088, 'waist'),
        (0.700, 0.142, 0.094, 'chest'), (0.745, 0.150, 0.100, 'chest'),
        (0.790, 0.153, 0.092, 'chest'), (0.815, 0.140, 0.082, 'shoulder'),
        (0.830, 0.098, 0.068, 'shoulder'), (0.842, 0.062, 0.057, 'neck')]
    mx = {'waist': b['waist'], 'chest': b['chest'], 'shoulder': b['shoulder'], 'neck': b['neck'], 'hip': b['hip']}
    rings = []
    for zf, rx, ry, k in rows:
        rings.append(ring((0, 0, zf * H), (1, 0, 0), (0, 1, 0), rx * s * mx[k], ry * s * b['depth'] * (1 + (0.04 if k == 'chest' and spec.get('bust') else 0)), NT))
    loft(body, rings, w_torso, 'shirt')

    # collar trim (accent)
    nk = b['neck']
    rings = [ring((0, 0, zf * H), (1, 0, 0), (0, 1, 0), rx * s * nk, ry * s * nk, NT)
             for zf, rx, ry in ((0.834, 0.066, 0.061), (0.846, 0.062, 0.058), (0.858, 0.058, 0.055))]
    loft(body, rings, w_torso, 'accent')

    # neck (skin)
    rings = [ring((0, 0.004 * s, zf * H), (1, 0, 0), (0, 1, 0), r * s * nk, r * s * nk * 0.95, 14)
             for zf, r in ((0.80, 0.056), (0.84, 0.051), (0.875, 0.048), (0.895, 0.046))]
    loft(body, rings, w_neck, 'skin')

    # ---- pelvis / skirt / belt ----------------------------------------------
    prow = [(0.600, 0.120, 0.082, 'waist'), (0.585, 0.130, 0.090, 'waist'), (0.555, 0.152, 0.104, 'hip'),
            (0.525, 0.165, 0.110, 'hip'), (0.495, 0.150, 0.105, 'hip'), (0.472, 0.105, 0.085, 'hip'),
            (0.458, 0.045, 0.05, 'hip'), (0.452, 0.010, 0.010, 'hip')]
    rings = [ring((0, 0, zf * H), (1, 0, 0), (0, 1, 0), rx * s * mx[k], ry * s * b['depth'], NT) for zf, rx, ry, k in prow]
    loft(body, rings, w_pelvis, 'skin' if skirt else 'trousers')

    if skirt:
        NS = 36
        srow = [(0.608, 0.128, 0.088), (0.575, 0.150, 0.106), (0.500, 0.185, 0.135), (0.400, 0.215, 0.160), (0.300, 0.235, 0.178)]
        rings = []
        for zf, rx, ry in srow:
            amp = 0.035 * smooth(0.55, 0.30, zf)
            pts = []
            for j in range(NS):
                th = 2 * math.pi * j / NS
                k = 1 + amp * math.cos(18 * th)
                pts.append((rx * s * b['hip'] * k * math.cos(th), ry * s * b['depth'] * k * math.sin(th), zf * H))
            rings.append(pts)
        loft(body, rings, w_skirt, 'skirt')
    else:
        rings = [ring((0, 0, zf * H), (1, 0, 0), (0, 1, 0), rx * s * mx['waist'], ry * s * b['depth'], NT)
                 for zf, rx, ry in ((0.603, 0.134, 0.093), (0.583, 0.136, 0.095))]
        loft(body, rings, w_torso, 'belt')

    # ---- legs, socks, shoes -------------------------------------------------
    lrow = [  # zf, cx, rx, ry
        (0.540, 0.084, 0.080, 0.084), (0.500, 0.084, 0.080, 0.085), (0.430, 0.083, 0.074, 0.078),
        (0.355, 0.081, 0.064, 0.066), (0.290, 0.080, 0.053, 0.057), (0.230, 0.079, 0.051, 0.055),
        (0.150, 0.078, 0.046, 0.049), (0.075, 0.077, 0.040, 0.044), (0.045, 0.077, 0.043, 0.047)]
    for side, sg in (('L', 1), ('R', -1)):
        rings = [ring((sg * cx * s * b['hip'], 0, zf * H), (1, 0, 0), (0, 1, 0),
                      rx * s * b['limb'], ry * s * b['limb'], 16) for zf, cx, rx, ry in lrow]
        loft(body, rings, w_leg(side), 'skin' if skirt else 'trousers')
        cx = sg * 0.077 * s * b['hip']
        if skirt:
            rings = [ring((sg * 0.078 * s * b['hip'], 0, zf * H), (1, 0, 0), (0, 1, 0), (r + 0.003) * s * b['limb'], (r + 0.004) * s * b['limb'], 16)
                     for zf, r in ((0.047, 0.044), (0.095, 0.043), (0.140, 0.047))]
            loft(body, rings, w_leg(side), 'sock')
        # shoe: cross-sections along Y; bottom 1.4 cm = sole
        shoe = [(0.072, 0.036, 0.058), (0.040, 0.043, 0.074), (0.000, 0.046, 0.080), (-0.050, 0.048, 0.062),
                (-0.100, 0.050, 0.051), (-0.150, 0.049, 0.043), (-0.200, 0.040, 0.033), (-0.225, 0.024, 0.022)]
        rings = []
        for y, hw, zt in shoe:
            c = (cx, y * s, zt * s / 2)
            rings.append(ring(c, (1, 0, 0), (0, 0, 1), hw * s * b['limb'], zt * s / 2, 14))
        loft(body, rings, w_foot,
             lambda i, c: 'sole' if c[2] < 0.014 * s else 'shoe',
             cap_start='auto', cap_end='auto')

    # ---- arms + hands ---------------------------------------------------------
    sleeve_te = (0.40 if spec.get('sleeve', 'short') == 'short' else 0.95) * 0.332 * H
    arm_r = [(0.0, 0.052), (0.08, 0.052), (0.15, 0.049), (0.22, 0.045), (0.30, 0.041),
             (0.36, 0.040), (0.45, 0.033), (0.538, 0.026)]
    for side, sg in (('L', 1), ('R', -1)):
        S, E, _ = bones['UpperArm_' + side]
        Wr = bones['LowerArm_' + side][1]
        ax = norm(sub(Wr, S))
        ux = norm(cross((0, 1, 0), ax))
        ux = mul(ux, -1 if dot(ux, (1, 0, 0)) < 0 else 1)
        uy = (0, 1, 0)
        L = math.sqrt(dot(sub(Wr, S), sub(Wr, S)))
        lk = b['limb']

        def r_at(t_m):  # radius at distance t_m (m, authored at H0 scale)
            return pw(arm_r, t_m)

        rings, mats = [], []
        # rounded shoulder dome
        for t, k in ((-0.040, 0.55), (-0.015, 0.88)):
            rr = (r_at(0.0) + 0.007) * k * s * lk
            rings.append(ring(add(S, mul(ax, t * s)), ux, uy, rr, rr, 14))
            mats.append('shirt')
        te = sleeve_te / s  # sleeve end in H0-metres
        ts = [t for t in (0.0, 0.08, 0.15, 0.22, 0.30, 0.36, 0.45) if t < te - 0.03]
        for t in ts:
            rr = (r_at(t) + 0.007) * s * lk
            rings.append(ring(add(S, mul(ax, t * s)), ux, uy, rr, rr, 14))
            mats.append('shirt')
        # cuff band + hem rim + skin start
        rr = (r_at(te - 0.025) + 0.007) * s * lk
        rings.append(ring(add(S, mul(ax, (te - 0.025) * s)), ux, uy, rr, rr, 14)); mats.append('shirt')
        rr = (r_at(te) + 0.007) * s * lk
        rings.append(ring(add(S, mul(ax, te * s)), ux, uy, rr, rr, 14)); mats.append('accent')
        rr = r_at(te) * s * lk
        rings.append(ring(add(S, mul(ax, te * s)), ux, uy, rr, rr, 14)); mats.append('accent')
        for t in (0.30, 0.36, 0.45, 0.538):
            if t > te + 0.01:
                rr = r_at(t) * s * lk
                rings.append(ring(add(S, mul(ax, t * s)), ux, uy, rr, rr, 14))
                mats.append('skin')
        wr = r_at(0.538)
        # long sleeve cuff sits at the wrist: hand starts right after
        loft(body, rings, w_arm(side), lambda i, c, mats=mats: mats[min(i + 1, len(mats) - 1)],
             cap_start='auto')
        # hand — thin along ax-x (palm faces thigh), wide along Y
        hrow = [(0.000, wr, wr), (0.030, 0.019, 0.036), (0.070, 0.018, 0.040),
                (0.110, 0.016, 0.038), (0.145, 0.012, 0.030), (0.170, 0.006, 0.016)]
        rings = [ring(add(Wr, mul(ax, t * s)), ux, uy, hx * s * lk, hy * s * lk, 12) for t, hx, hy in hrow]
        loft(body, rings, w_arm(side), 'skin', cap_end='auto')

    hs = spec['hair']
    style = hs['style']
    P = {
        'short': dict(f=0.50, k=-0.30, s=0.22, t=0.010, vol=0.006, fringe=0.20, fl=-0.7, fw=0.55, fr=0.006, wave=0.0),
        'buzz': dict(f=0.62, k=-0.15, s=0.30, t=0.004, vol=0.001, fringe=0.0, fl=0, fw=1, fr=0.0, wave=0.0),
        'wave': dict(f=0.42, k=-0.42, s=0.02, t=0.016, vol=0.012, fringe=0.12, fl=-0.3, fw=0.7, fr=0.010, wave=0.006),
        'ponytail': dict(f=0.55, k=-0.18, s=0.12, t=0.009, vol=0.004, fringe=0.0, fl=0, fw=1, fr=0.0, wave=0.0),
    }[style]
    P.update(hs.get('tune', {}))

    # ---- head -------------------------------------------------------------------
    hw = spec['head'].get('width', 1.0)
    jaw = spec['head'].get('jaw', 0.28)
    rx, ry, rz = 0.077 * s * hw, 0.098 * s, 0.107 * s * spec['head'].get('height', 1.0)
    ztop = H - (P['t'] + P['vol'] + 0.001) * s
    C = (0, 0.004 * s, ztop - rz)

    def hoff(dx, dy, dz):
        jk = smooth(0.2, -1.0, dz)
        taper = 1 - jaw * (jk ** 1.3)
        y = ry * dy
        if dy > 0 and dz < -0.3:
            y *= 0.88
        return (rx * dx * taper, y, rz * dz)

    def hdir(phi, lam):
        return (math.sin(phi) * math.sin(lam), -math.sin(phi) * math.cos(lam), math.cos(phi))

    def surf(dz, lam, push=0.0):
        phi = math.acos(clamp(dz, -1, 1))
        d = hdir(phi, lam)
        off = hoff(*d)
        n = norm((d[0] / rx, d[1] / ry, d[2] / rz))
        return add(add(C, off), mul(n, push)), n

    NA, NP = 32, 22
    rings = []
    for i in range(1, NP):
        phi = math.pi * i / NP
        rings.append([add(C, hoff(*hdir(phi, 2 * math.pi * j / NA))) for j in range(NA)])
    h0, h1 = loft(headm, rings, w_head, 'skin',
                  cap_start=add(C, hoff(0, 0, 1)), cap_end=add(C, hoff(0, 0, -1)))
    # jaw morph: lower-face verts drop
    for vi in range(h0, h1):
        p = headm.verts[vi]
        dz = (p[2] - C[2]) / rz
        a = smooth(-0.40, -0.85, dz)
        if a > 0:
            headm.set_delta('mouthOpen', vi, (0.0, 0.003 * s * a, -0.013 * s * a))

    # ears
    for sg in (1, -1):
        ellipsoid(headm, (sg * rx * 1.0, C[1] + 0.006 * s, C[2] + 0.004 * s), (0.006 * s, 0.012 * s, 0.019 * s), w_head, 'skin', 10, 6)
    # nose
    c, n = surf(-0.22, 0.0, 0.004 * s)
    ellipsoid(headm, c, (0.0105 * s, 0.012 * s, 0.016 * s), w_head, 'skin', 10, 6)
    # eyes
    eye_dz = 0.05 + spec['head'].get('eye_dz', 0.0)
    for sg in (1, -1):
        c, n = surf(eye_dz, sg * 0.40, -0.0035 * s)
        a0, a1 = ellipsoid(headm, c, (0.0125 * s, 0.009 * s, 0.0098 * s), w_head, 'eye_white', 12, 7)
        ic = add(c, (0, -0.0055 * s, 0))
        b0, b1 = ellipsoid(headm, ic, (0.0068 * s, 0.0046 * s, 0.0068 * s), w_head, 'iris', 10, 6)
        for vi in list(range(a0, a1)) + list(range(b0, b1)):  # blink: sink eyes under the lids
            headm.set_delta('blink', vi, (0.0, 0.0105 * s, 0.0))
        # brows
        bc, bn = surf(0.30 + spec['head'].get('brow_dz', 0.0), sg * 0.40, 0.0012 * s)
        ellipsoid(headm, bc, (0.0145 * s, 0.0040 * s, 0.0034 * s), w_head, 'hair', 10, 5, roll=sg * 0.14)
    # mouth (+ morph)
    mc, mn = surf(-0.52, 0.0, 0.0012 * s)
    m0, m1 = ellipsoid(headm, mc, (0.0175 * s, 0.0042 * s, 0.0042 * s), w_head, 'mouth', 12, 6)
    for vi in range(m0, m1):
        p = headm.verts[vi]
        dz = p[2] - mc[2]
        headm.set_delta('mouthOpen', vi, (0.0, 0.0, dz * 2.8 - 0.0085 * s))

    # ---- hair ------------------------------------------------------------------------
    m_ = (P['f'] + P['k']) / 2
    za, zb, zc_ = (m_ + P['s']) / 2, (P['f'] - P['k']) / 2, (m_ - P['s']) / 2
    NH, NR = 36, 12

    def wrap(a):
        return math.atan2(math.sin(a), math.cos(a))

    def hpt(frac, lam, tmod=0.0):
        zl = za + zb * math.cos(lam) + zc_ * math.cos(2 * lam)
        zl -= P['fringe'] * math.exp(-(wrap(lam - P['fl']) / P['fw']) ** 2)
        phimax = math.acos(clamp(zl, -0.95, 0.95))
        phi = phimax * frac
        d = hdir(phi, lam)
        base = add(C, hoff(*d))
        n = norm((d[0] / rx, d[1] / ry, d[2] / rz))
        t = (P['t'] + P['vol'] * (1 - frac) ** 1.5 + P['fr'] * math.exp(-(wrap(lam) / 0.7) ** 2) * frac) * s
        t += P['wave'] * s * math.sin(6 * lam + 5 * frac) * frac + tmod
        return add(base, mul(n, t))

    rings = [[hpt(i / NR, 2 * math.pi * j / NH) for j in range(NH)] for i in range(1, NR + 1)]
    rings.append([hpt(1.0, 2 * math.pi * j / NH, -0.004 * s) for j in range(NH)])
    top = add(add(C, hoff(0, 0, 1)), (0, 0, (P['t'] + P['vol']) * s))
    loft(hairm, rings, w_head, 'hair', cap_start=top)
    if style == 'ponytail':
        z0 = C[2] + 0.03 * s
        y0 = C[1] + ry * 0.92
        rr = []
        for k in range(9):
            u = k / 8.0
            c = (0.0, y0 + 0.055 * s * u, z0 - 0.27 * s * (u ** 1.15))
            r = lerp(0.034, 0.010, u ** 0.9) * s
            rr.append(ring(c, (1, 0, 0), (0, 1, 0), r, r, 10))
        loft(hairm, rr, w_head, 'hair', cap_start='auto', cap_end='auto')

    meshes = [body, headm, hairm]
    return {'meshes': meshes, 'bones': bones, 'materials': material_table(spec), 'spec': spec}


def stats(res):
    out = {}
    for m in res['meshes']:
        out[m.name] = {'verts': len(m.verts), 'tris': m.tris, 'materials': m.material_names(),
                       'morphs': sorted(m.morphs)}
    out['_total_tris'] = sum(m.tris for m in res['meshes'])
    zs = [v[2] for m in res['meshes'] for v in m.verts]
    out['_height'] = max(zs)
    out['_min_z'] = min(zs)
    return out
