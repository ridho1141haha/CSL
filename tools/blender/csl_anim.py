"""CSL animation clips — PURE PYTHON (no bpy).

Clips are procedural functions of time, sampled at 30 fps into per-bone rotations.
csl_blender.add_animations() writes them as Blender actions (NLA tracks) so the
GLB exporter emits them as named clips. The same FK is used here to pose the
geometry for Blender-free previews/QA.

Rotation convention (degrees, authored in CHARACTER axes, rest pose = zero):
  pitch : the bone's TIP moves forward (+)           (arms/legs: swing forward)
  roll  : the bone's TIP moves to the character's LEFT (+)
  yaw   : turn to the character's LEFT (+)
Foot pitch: toes up (+).   Arm abduction is passed as 'abd' (outward +) per side.
Rotations compose down the hierarchy:  D_bone = D_parent * R_bone.
In Blender:  pose_bone basis = Q^-1 R Q  with Q = bone.matrix_local.to_3x3().
"""
import math
import csl_geometry as G

FPS = 30
UPB = {'Root', 'Hips', 'Spine', 'Chest', 'Neck', 'Head'}
SIDES = (('L', 1), ('R', -1))


# ----------------------------------------------------------------- math ----
def rad(d):
    return d * math.pi / 180.0


def mm(a, b):
    return tuple(tuple(sum(a[i][k] * b[k][j] for k in range(3)) for j in range(3)) for i in range(3))


def mv(m, v):
    return (m[0][0] * v[0] + m[0][1] * v[1] + m[0][2] * v[2],
            m[1][0] * v[0] + m[1][1] * v[1] + m[1][2] * v[2],
            m[2][0] * v[0] + m[2][1] * v[1] + m[2][2] * v[2])


def Rx(a):
    c, s = math.cos(a), math.sin(a)
    return ((1, 0, 0), (0, c, -s), (0, s, c))


def Ry(a):
    c, s = math.cos(a), math.sin(a)
    return ((c, 0, s), (0, 1, 0), (-s, 0, c))


def Rz(a):
    c, s = math.cos(a), math.sin(a)
    return ((c, -s, 0), (s, c, 0), (0, 0, 1))


def bone_rot(b, pitch, roll, yaw):
    sg = 1.0 if b in UPB else -1.0
    return mm(Rz(rad(yaw)), mm(Ry(rad(sg * roll)), Rx(rad(sg * pitch))))


def S(t, T, k=1, ph=0.0):
    return math.sin(2 * math.pi * k * t / T + ph)


def C(t, T, k=1, ph=0.0):
    return math.cos(2 * math.pi * k * t / T + ph)


def ease(x):
    return G.smooth(0.0, 1.0, x)


def env(t, a, b, c, d):
    """0 before a, rises to 1 at b, holds until c, falls to 0 at d."""
    return G.smooth(a, b, t) * (1 - G.smooth(c, d, t))


# ----------------------------------------------------------------- pose ----
class Pose:
    def __init__(self):
        self.r = {}
        self.air = 0.0

    def add(self, b, p=0.0, r=0.0, y=0.0):
        v = self.r.setdefault(b, [0.0, 0.0, 0.0])
        v[0] += p
        v[1] += r
        v[2] += y
        return self

    def arm(self, side, pitch=0.0, abd=0.0, elbow=0.0, twist=0.0, fyaw=0.0):
        sg = 1 if side == 'L' else -1
        self.add('UpperArm_' + side, pitch, sg * abd, sg * twist)
        self.add('LowerArm_' + side, elbow, 0.0, sg * fyaw)
        return self

    def leg(self, side, thigh=0.0, bend=0.0, abd=0.0, foot=0.0):
        """bend > 0 flexes the knee (shin swings backward). Foot kept level by default."""
        sg = 1 if side == 'L' else -1
        self.add('UpperLeg_' + side, thigh, sg * abd)
        self.add('LowerLeg_' + side, -bend)
        self.add('Foot_' + side, -(thigh - bend) + foot)
        return self

    def legs(self, thigh=0.0, bend=0.0, abd=0.0):
        self.leg('L', thigh, bend, abd)
        self.leg('R', thigh, bend, abd)
        return self


def blend(a, b, w):
    out = Pose()
    for k in set(a.r) | set(b.r):
        va, vb = a.r.get(k, [0, 0, 0]), b.r.get(k, [0, 0, 0])
        out.r[k] = [va[i] + (vb[i] - va[i]) * w for i in range(3)]
    out.air = a.air + (b.air - a.air) * w
    return out


class Ctx:
    """Per-character numbers the clips need (leg lengths, hip height)."""

    def __init__(self, spec):
        self.spec = spec
        self.bones = G.rig(spec)
        self.H = spec['height']
        self.s = self.H / G.H0
        hip = self.bones['UpperLeg_L'][0]
        knee = self.bones['LowerLeg_L'][0]
        ank = self.bones['Foot_L'][0]
        self.hipz, self.ankz = hip[2], ank[2]
        self.L1 = math.dist(knee, hip)
        self.L2 = math.dist(ank, knee)

    def squat(self, hipz_m, thigh_deg):
        """Leg angles that put the hips at hipz_m with feet flat on the floor."""
        th = rad(thigh_deg)
        kz = hipz_m - self.L1 * math.cos(th)
        c2 = G.clamp((kz - self.ankz) / self.L2, -1.0, 1.0)
        bend = thigh_deg + math.degrees(math.acos(c2))
        return thigh_deg, bend


# ---------------------------------------------------------- base poses ----
def idle_base(t, T, x, amp=1.0, speed=1):
    P = Pose()
    k = speed
    P.add('Spine', 0.8 * amp * S(t, T, k))
    P.add('Chest', 1.3 * amp * S(t, T, k, 0.6))
    P.add('Head', -0.7 * amp * S(t, T, k, 0.6), 0, 4.0 * amp * S(t, T, 1))
    P.add('Hips', 0, 1.1 * amp * S(t, T, 1), 0)
    P.add('Spine', 0, -0.8 * amp * S(t, T, 1), 0)
    P.arm('L', 2 + 1.2 * amp * S(t, T, k, 0.8), 5, 7)
    P.arm('R', 2 + 1.2 * amp * S(t, T, k, 2.2), 5, 7)
    P.legs(0, 2)
    return P


def sit_base(x):
    P = Pose()
    th, bend = x.squat(0.535 * x.s, 75)
    P.legs(th, bend, abd=3)
    P.add('Hips', -4)           # tuck pelvis slightly: relaxed seated posture
    P.add('Spine', 6)
    P.add('Chest', 4)
    P.add('Head', -6)
    P.arm('L', 18, 6, 62)
    P.arm('R', 18, 6, 62)
    return P


def crouch_base(x):
    P = Pose()
    th, bend = x.squat(0.40 * x.s, 95)
    P.legs(th, bend, abd=8)
    P.add('Spine', 28)
    P.add('Chest', 14)
    P.add('Head', -30)
    P.arm('L', 55, 6, 30)
    P.arm('R', 62, 6, 25)
    return P


# ------------------------------------------------------------- the clips ----
def c_idle(t, x):
    return idle_base(t, 4.0, x)


def c_walk(t, x):
    T = 26 / 30.0
    P = Pose()
    for side, off in (('L', 0.0), ('R', math.pi)):
        ph = 2 * math.pi * t / T + off
        sw = math.sin(ph)
        th = 31 * sw
        bend = 5 + 46 * max(0.0, math.cos(ph)) ** 1.4
        P.leg(side, th, bend, foot=-16 * max(0.0, -math.sin(ph + 0.35)))
        # opposite arm swing
        P.arm(side, -18 * sw, 4, 12 + 14 * max(0.0, -sw))
    ph = 2 * math.pi * t / T
    P.add('Hips', 0, 0, -5 * math.sin(ph))
    P.add('Chest', 2.5, 0, 7 * math.sin(ph))
    P.add('Head', -2, 0, -2 * math.sin(ph))
    P.add('Hips', 0, 1.5 * math.cos(ph), 0)
    P.add('Spine', 0, -1.5 * math.cos(ph), 0)
    return P


def c_run(t, x):
    T = 16 / 30.0
    P = Pose()
    for side, off in (('L', 0.0), ('R', math.pi)):
        ph = 2 * math.pi * t / T + off
        sw = math.sin(ph)
        th = 54 * sw
        bend = 10 + 90 * max(0.0, math.cos(ph)) ** 1.2
        P.leg(side, th, bend, foot=-22 * max(0.0, -math.sin(ph + 0.3)))
        P.arm(side, -42 * sw, 8, 88 + 6 * max(0.0, -sw))
    ph = 2 * math.pi * t / T
    P.add('Hips', 0, 0, -8 * math.sin(ph))
    P.add('Chest', 11, 0, 10 * math.sin(ph))
    P.add('Head', -7, 0, -3 * math.sin(ph))
    P.air = 0.035 * x.s * math.cos(ph) ** 2
    return P


def c_sit_idle(t, x):
    P = sit_base(x)
    T = 4.0
    P.add('Chest', 1.0 * S(t, T, 1, 0.6))
    P.add('Head', 0, 0, 5 * S(t, T, 1))
    P.add('UpperArm_L', 1.0 * S(t, T, 1, 0.8))
    return P


def c_sit_write(t, x):
    T = 2.0
    P = sit_base(x)
    P.add('Spine', 8)
    P.add('Chest', 6)
    P.add('Head', 16 + 1.5 * S(t, T, 1))        # eyes on the page (head tips down relative to spine)
    P.arm('R', 22, 8, 52)
    P.add('LowerArm_R', 0, 0, 6 * S(t, T, 2))    # small writing motion
    P.arm('L', 26, 10, 66)
    return P


def c_sit_lean(t, x):
    T = 3.0
    P = sit_base(x)
    P.add('Spine', 10 + 1 * S(t, T, 1))
    P.add('Chest', 7)
    P.add('Head', -3)
    P.arm('L', 30, 4, 80)
    P.arm('R', 30, 4, 80)
    return P


def c_talk(t, x):
    T = 3.0
    P = idle_base(t, 4.0, x, 0.8)
    P.add('Head', 3.0 * max(0.0, S(t, T, 2)), 0, 5 * S(t, T, 1, 0.4))
    P.add('Chest', 1.2 * S(t, T, 2, 1.0))
    P.arm('R', 14 + 8 * S(t, T, 2, 0.3), 6, 28 + 10 * S(t, T, 3, 1.0))
    return P


def c_listen_nod(t, x):
    T = 1.2
    P = idle_base(t, 4.0, x, 0.6)
    P.add('Head', 9 * max(0.0, S(t, T, 2)))
    P.add('Neck', 3 * max(0.0, S(t, T, 2)))
    return P


def c_gesture_palm(t, x):
    T = 1.6
    e = env(t, 0.0, 0.35, 1.0, T)
    P = idle_base(t, 4.0, x, 0.6)
    P.arm('R', 38 * e, 10 * e, 78 * e, fyaw=-25 * e)
    P.add('Chest', 0, 0, 4 * e)
    P.add('Head', -2 * e, 0, -4 * e)
    return P


def c_gesture_emphasis(t, x):
    T = 1.2
    e = env(t, 0.0, 0.3, 0.6, T)
    P = idle_base(t, 4.0, x, 0.6)
    P.arm('R', 62 * e, 4 * e, 38 * e)
    P.add('Chest', 5 * e, 0, 6 * e)
    P.add('Head', 4 * e)
    return P


def c_gesture_chest(t, x):
    T = 2.0
    e = env(t, 0.0, 0.4, 1.5, T)
    P = idle_base(t, 4.0, x, 0.6)
    P.arm('L', 42 * e, -6 * e, 118 * e, fyaw=20 * e)
    P.add('Head', 8 * e)
    P.add('Spine', 3 * e)
    return P


def c_look_around(t, x):
    T = 4.0
    P = idle_base(t, 4.0, x, 0.8)
    yaw = 55 * (S(t, T, 1) ** 1) * 1.0
    P.add('Head', 0, 0, yaw * 0.75)
    P.add('Neck', 0, 0, yaw * 0.25)
    P.add('Chest', 0, 0, yaw * 0.15)
    return P


def _idle_mood(t, x, T, spine, chest, head, roll, arm_abd, elbow, arm_pitch, speed=1, tremble=0.0, legs_abd=0):
    P = idle_base(t, T, x, 1.0, speed)
    P.add('Spine', spine)
    P.add('Chest', chest)
    P.add('Head', head, roll)
    P.arm('L', arm_pitch, arm_abd, elbow)
    P.arm('R', arm_pitch, arm_abd, elbow)
    P.add('Hips', 0, 0, 0)
    if tremble:
        P.add('UpperArm_L', tremble * S(t, T, 9))
        P.add('UpperArm_R', tremble * S(t, T, 9, 1.3))
    if legs_abd:
        P.leg('L', 0, 1, abd=legs_abd)
        P.leg('R', 0, 1, abd=legs_abd)
    return P


def c_idle_worried(t, x):
    P = _idle_mood(t, x, 3.0, 7, 5, 12, 0, 6, 50, 18, speed=2)
    P.arm('L', 22, -2, 70)
    P.arm('R', 22, -2, 70)
    return P


def c_idle_tense(t, x):
    P = _idle_mood(t, x, 3.0, 3, 2, 6, 0, 14, 36, 8, speed=2, tremble=1.2)
    P.add('Chest', 0, 0, 0)
    P.legs(4, 12, abd=4)
    return P


def c_idle_firm(t, x):
    return _idle_mood(t, x, 4.0, -2, -3, -3, 0, 8, 10, 2)


def c_idle_dark(t, x):
    P = _idle_mood(t, x, 5.0, -3, -4, -6, 4, 15, 22, 4, legs_abd=7)
    P.add('Hips', 0, 0, 3)
    P.add('Chest', 0, 0, -3)
    return P


def c_idle_warm(t, x):
    return _idle_mood(t, x, 4.0, 3, 2, 3, 5, 6, 14, 5)


def c_hold_phone(t, x):
    T = 4.0
    P = idle_base(t, T, x, 0.6)
    P.arm('R', 58, 2, 98)
    P.add('Head', 12)
    P.add('Spine', 3)
    return P


def c_hold_book(t, x):
    T = 4.0
    P = idle_base(t, T, x, 0.6)
    P.arm('R', 42, 6, 86)
    P.arm('L', 42, 6, 86)
    P.add('Head', 12)
    P.add('Spine', 3)
    return P


def c_hold_stack(t, x):
    T = 4.0
    P = idle_base(t, T, x, 0.6)
    P.arm('R', 46, 4, 58)
    P.arm('L', 46, 4, 58)
    P.add('Spine', -2)
    return P


def c_hold_light(t, x):
    T = 4.0
    P = idle_base(t, T, x, 0.6)
    P.arm('R', 24, 5, 72)
    return P


def c_crouch_idle(t, x):
    T = 3.0
    P = crouch_base(x)
    P.add('Chest', 1.2 * S(t, T, 1))
    return P


def c_pick_up(t, x):
    T = 2.0
    e = env(t, 0.0, 0.7, 1.3, T)
    reach = env(t, 0.5, 0.9, 1.1, 1.4)
    P = blend(idle_base(t, 4.0, x, 0.5), crouch_base(x), e)
    P.add('UpperArm_R', 20 * reach)
    P.add('LowerArm_R', -15 * reach)
    return P


def c_sit_down(t, x):
    T = 1.2
    e = ease(t / T)
    P = blend(idle_base(0, 4.0, x, 0.5), sit_base(x), e)
    P.add('Spine', 14 * math.sin(math.pi * e))
    P.add('Head', -8 * math.sin(math.pi * e))
    return P


def c_stand_up(t, x):
    T = 1.2
    e = ease(t / T)
    P = blend(sit_base(x), idle_base(0, 4.0, x, 0.5), e)
    P.add('Spine', 20 * math.sin(math.pi * e))
    P.add('Head', -10 * math.sin(math.pi * e))
    return P


def c_attack(t, x):
    T = 0.8
    wind = env(t, 0.0, 0.25, 0.27, 0.30)
    hit = env(t, 0.25, 0.38, 0.42, 0.70)
    P = idle_base(0, 4.0, x, 0.0)
    P.arm('L', 70, -6, 105)                       # guard hand
    P.arm('R', -30 * wind + 88 * hit, 0, 95 * wind + 12 * hit)
    P.add('Chest', 4 * hit, 0, -18 * wind + 30 * hit)
    P.add('Hips', 0, 0, -8 * wind + 12 * hit)
    P.add('Spine', 6 * hit)
    P.add('Head', -4 * hit, 0, -6 * hit)
    th, bend = 14 * hit, 24 * hit
    P.leg('L', th, bend)
    P.leg('R', -10 * hit, 10 * hit)
    return P


def c_block(t, x):
    T = 1.2
    P = idle_base(0, 4.0, x, 0.0)
    P.arm('L', 98, -14, 108)
    P.arm('R', 98, -14, 108)
    P.add('Spine', 8)
    P.add('Head', 4 + 0.8 * S(t, T, 1))
    P.legs(16, 32 + 2 * S(t, T, 1), abd=6)
    return P


def c_hurt(t, x):
    T = 0.6
    e = math.sin(math.pi * G.clamp(t / T, 0, 1)) ** 0.8
    P = idle_base(0, 4.0, x, 0.0)
    P.add('Chest', -17 * e, 0, 6 * e)
    P.add('Spine', -4 * e)
    P.add('Head', -13 * e, 4 * e)
    P.arm('L', -14 * e, 24 * e, 22 * e)
    P.arm('R', -10 * e, 28 * e, 26 * e)
    P.legs(8 * e, 14 * e)
    return P


def c_knocked_down(t, x):
    T = 1.2
    p = ease(t / 0.85) if t < 0.85 else 1.0
    P = Pose()
    P.add('Hips', -88 * p)
    P.add('Spine', 4 * p)
    P.add('Head', -4 * p)
    P.arm('L', -8 * p, 42 * p, 18 * p)
    P.arm('R', -10 * p, 46 * p, 22 * p)
    P.leg('L', 6 * p, 12 * p, abd=10 * p)
    P.leg('R', 2 * p, 22 * p, abd=14 * p)
    return P


def c_jump(t, x):
    T = 0.9
    crouch = env(t, 0.0, 0.2, 0.2, 0.28) + env(t, 0.62, 0.74, 0.76, 0.9) * 0.7
    air_u = G.clamp((t - 0.26) / 0.4, 0.0, 1.0)
    airborne = 1.0 if 0.26 <= t <= 0.66 else 0.0
    P = Pose()
    th, bend = x.squat(0.60 * x.s, 62)
    P.legs(th * crouch, bend * crouch)
    P.legs(28 * airborne, 55 * airborne)
    P.arm('L', -35 * crouch + 150 * airborne, 12, 8)
    P.arm('R', -35 * crouch + 150 * airborne, 12, 8)
    P.add('Spine', 18 * crouch)
    P.add('Head', -10 * crouch)
    P.air = 0.42 * x.s * 4 * air_u * (1 - air_u) * airborne
    return P


# name -> (fn, duration seconds, loop, ground-lock mode)
CLIPS = {
    # locomotion
    'Idle': (c_idle, 4.0, True, 'feet'),
    'Walk': (c_walk, 26 / 30.0, True, 'feet'),
    'Run': (c_run, 16 / 30.0, True, 'feet'),
    'Jump': (c_jump, 0.9, False, 'feet'),
    # postures
    'Sit_Idle': (c_sit_idle, 4.0, True, 'feet'),
    'Sit_Write': (c_sit_write, 2.0, True, 'feet'),
    'Sit_Lean_Forward': (c_sit_lean, 3.0, True, 'feet'),
    'Sit_Down': (c_sit_down, 1.2, False, 'feet'),
    'Stand_Up': (c_stand_up, 1.2, False, 'feet'),
    'Crouch_Idle': (c_crouch_idle, 3.0, True, 'feet'),
    'Pick_Up': (c_pick_up, 2.0, False, 'feet'),
    # dialogue
    'Talk': (c_talk, 3.0, True, 'feet'),
    'Listen_Nod': (c_listen_nod, 1.2, True, 'feet'),
    'Gesture_Palm': (c_gesture_palm, 1.6, False, 'feet'),
    'Gesture_Emphasis': (c_gesture_emphasis, 1.2, False, 'feet'),
    'Gesture_Chest': (c_gesture_chest, 2.0, False, 'feet'),
    'Look_Around': (c_look_around, 4.0, True, 'feet'),
    # emotion idles (Emotion type in src/types)
    'Idle_Worried': (c_idle_worried, 3.0, True, 'feet'),
    'Idle_Tense': (c_idle_tense, 3.0, True, 'feet'),
    'Idle_Firm': (c_idle_firm, 4.0, True, 'feet'),
    'Idle_Dark': (c_idle_dark, 5.0, True, 'feet'),
    'Idle_Warm': (c_idle_warm, 4.0, True, 'feet'),
    # held props (HoldKind)
    'Hold_Phone': (c_hold_phone, 4.0, True, 'feet'),
    'Hold_Book': (c_hold_book, 4.0, True, 'feet'),
    'Hold_Stack': (c_hold_stack, 4.0, True, 'feet'),
    'Hold_Light': (c_hold_light, 4.0, True, 'feet'),   # pencil / eraser / bottle
    # combat
    'Attack_Punch': (c_attack, 0.8, False, 'feet'),
    'Block': (c_block, 1.2, True, 'feet'),
    'Hurt': (c_hurt, 0.6, False, 'feet'),
    'Knocked_Down': (c_knocked_down, 1.2, False, 'all'),
}
REVERSED = {'Get_Up': ('Knocked_Down', 1.2)}


# ------------------------------------------------------------------- FK ----
def fk(bones, pose, hips_t=(0.0, 0.0, 0.0)):
    D, J = {}, {}
    for bn in G.BONE_NAMES:  # parents always precede children
        head, _, par = bones[bn]
        R = bone_rot(bn, *pose.r.get(bn, (0.0, 0.0, 0.0)))
        if par is None:
            D[bn], J[bn] = R, head
        else:
            D[bn] = mm(D[par], R)
            J[bn] = G.add(J[par], mv(D[par], G.sub(head, bones[par][0])))
        if bn == 'Hips':
            J[bn] = G.add(J[bn], hips_t)
    return D, J


def skin_point(bones, D, J, p, w):
    out = (0.0, 0.0, 0.0)
    for b, wt in w.items():
        q = G.add(J[b], mv(D[b], G.sub(p, bones[b][0])))
        out = G.add(out, G.mul(q, wt))
    return out


def foot_points(x):
    s = x.s
    pts = []
    for side, sg in SIDES:
        cx = x.bones['Foot_' + side][0][0]
        pts.append(('Foot_' + side, (cx, 0.072 * s, 0.0)))
        pts.append(('Foot_' + side, (cx, -0.225 * s, 0.0)))
        pts.append(('Foot_' + side, (cx, -0.15 * s, 0.0)))
        pts.append(('Foot_' + side, (cx + 0.04 * s * sg, -0.05 * s, 0.0)))
        pts.append(('Foot_' + side, (cx - 0.04 * s * sg, -0.05 * s, 0.0)))
    return pts


def ground_dz(x, pose, mode, sample_pts=None):
    D, J = fk(x.bones, pose)
    if mode == 'feet':
        zs = [G.add(J[b], mv(D[b], G.sub(p, x.bones[b][0])))[2] for b, p in foot_points(x)]
        return -min(zs)
    if mode == 'all':
        zs = [skin_point(x.bones, D, J, p, w)[2] for p, w in sample_pts]
        return -min(zs)
    return 0.0


def sample_clip(x, name, sample_pts=None):
    """-> list of frames: {'R': {bone: 3x3}, 'hips_t': (dx, dy, dz)}  (frame 0 .. N inclusive)"""
    rev = False
    if name in REVERSED:
        name, _ = REVERSED[name]
        rev = True
    fn, dur, loop, lock = CLIPS[name]
    n = int(round(dur * FPS))
    out = []
    for i in range(n + 1):
        t = i / FPS
        P = fn(t, x)
        dz = ground_dz(x, P, lock, sample_pts) + P.air
        out.append({'R': {b: bone_rot(b, *P.r[b]) for b in P.r}, 'pose': P, 'hips_t': (0.0, 0.0, dz)})
    if rev:
        out = out[::-1]
    return out


def stance_speed(x, frames):
    """Ground speed (m/s) the clip is authored for: mean backward velocity of the planted foot.
    Use  timeScale = actualSpeed / clip.speed  in the adapter so feet do not slide."""
    vs = []
    zs_all = []
    for f in frames:
        D, J = fk(x.bones, f['pose'], f['hips_t'])
        row = {}
        for side in ('L', 'R'):
            b = 'Foot_' + side
            low = min(G.add(J[b], mv(D[b], G.sub(p, x.bones[b][0])))[2]
                      for bb, p in foot_points(x) if bb == b)
            row[side] = (J[b][1], low)
        zs_all.append(row)
    dt = 1.0 / FPS
    for i in range(1, len(zs_all)):
        for side in ('L', 'R'):
            y0, z0 = zs_all[i - 1][side]
            y1, z1 = zs_all[i][side]
            v = (y1 - y0) / dt
            if z0 < 0.012 and z1 < 0.012 and v > 0.2:   # planted AND moving backward
                vs.append(v)
    vs.sort()
    return round(vs[len(vs) // 2], 2) if vs else 0.0


def all_clip_names():
    return list(CLIPS) + list(REVERSED)


def clip_info(name):
    if name in REVERSED:
        src = REVERSED[name][0]
        return {'duration': CLIPS[src][1], 'loop': False}
    return {'duration': CLIPS[name][1], 'loop': CLIPS[name][2]}


def posed_meshes(res, x, frame):
    """Skin the geometry with a sampled frame (for Blender-free QA/preview)."""
    D, J = fk(x.bones, frame['pose'], frame['hips_t'])
    out = []
    for m in res['meshes']:
        pm = G.Mesh(m.name)
        pm.verts = [skin_point(x.bones, D, J, v, w) for v, w in zip(m.verts, m.weights)]
        pm.weights, pm.faces = m.weights, m.faces
        out.append(pm)
    return {**res, 'meshes': out}
