"""Character specs. Heights / skin / hair colours / pants come from
src/data/npcs.ts (single source of truth — keep in sync). Ren is new."""

def B(shoulder=1.0, chest=1.0, waist=1.0, hip=1.0, depth=1.0, neck=1.0, limb=1.0):
    return dict(shoulder=shoulder, chest=chest, waist=waist, hip=hip, depth=depth, neck=neck, limb=limb)

WHITE = '#e9ecf1'

SPECS = {
    'ren': dict(name='Ren', file='ren', height=1.70,
        build=B(1.0, 1.0, 0.98, 1.0, 1.0, 1.0, 1.0),
        head=dict(width=1.0, jaw=0.30),
        colors=dict(skin='#ecbf99', hair='#14141a', shirt=WHITE, accent='#38bdf8', trousers='#4b5563'),
        hair=dict(style='short', tune=dict(fringe=0.24, fl=-0.55, vol=0.008)),
        bottom='trousers', sleeve='short'),
    'aris': dict(name='Aris', file='aris', height=1.62,
        build=B(0.91, 0.92, 0.92, 0.94, 0.92, 0.94, 0.90),
        head=dict(width=1.05, jaw=0.22, height=0.98),
        colors=dict(skin='#f0c39d', hair='#241c16', shirt=WHITE, accent='#3b82f6', trousers='#334155'),
        hair=dict(style='short', tune=dict(fringe=0.14, fl=0.5, vol=0.006)),
        bottom='trousers', sleeve='short'),
    'siti': dict(name='Siti', file='siti', height=1.58,
        build=B(0.86, 0.90, 0.84, 1.00, 0.90, 0.88, 0.86),
        head=dict(width=0.97, jaw=0.30),
        colors=dict(skin='#e8b98e', hair='#17110c', shirt=WHITE, accent='#10b981', trousers='#1f2937'),
        hair=dict(style='ponytail', tune=dict()),
        bottom='skirt', sleeve='short', bust=True),
    'bimo': dict(name='Bimo', file='bimo', height=1.78,
        build=B(1.20, 1.20, 1.26, 1.10, 1.18, 1.28, 1.22),
        head=dict(width=1.08, jaw=0.18, height=1.0),
        colors=dict(skin='#d9a878', hair='#0f0d0b', shirt=WHITE, accent='#ef4444', trousers='#18181b'),
        hair=dict(style='wave', tune=dict()),
        bottom='trousers', sleeve='short'),
    'pak_budi': dict(name='PakBudi', file='pak_budi', height=1.70,
        build=B(1.02, 1.05, 1.12, 1.04, 1.06, 1.08, 1.04),
        head=dict(width=1.02, jaw=0.26, height=1.02),
        colors=dict(skin='#e6b283', hair='#3a3a3a', shirt='#dfe9f2', accent='#0ea5e9', trousers='#1f2937'),
        hair=dict(style='buzz', tune=dict()),
        bottom='trousers', sleeve='long', badge=False),
}
