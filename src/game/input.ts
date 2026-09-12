// Input abstraction (GDD §68): held-key state + just-pressed action queue,
// pointer lock and wheel. Gameplay systems read actions; UI keeps its own
// keyboard shortcuts via window events.
//
// BUG-3.2 fix: separate `run` (held) from `dodge` (tap, edge-detected on
// keyup within DODGE_TAP_WINDOW). Previously both fired on every Shift press,
// making it impossible to run without also dodging.

export type GameAction =
  | 'forward'
  | 'back'
  | 'left'
  | 'right'
  | 'jump'
  | 'run'
  | 'attack_light'
  | 'attack_heavy'
  | 'block'
  | 'dodge'
  | 'interact';

// Keys that map directly to held/pressed actions (no tap-vs-hold ambiguity).
const KEY_TO_ACTIONS: Record<string, GameAction[]> = {
  KeyW: ['forward'],
  ArrowUp: ['forward'],
  KeyS: ['back'],
  ArrowDown: ['back'],
  KeyA: ['left'],
  ArrowLeft: ['left'],
  KeyD: ['right'],
  ArrowRight: ['right'],
  Space: ['jump'],
  KeyE: ['interact'],
  KeyQ: ['attack_heavy'],
};

// Keys eligible for tap detection. Shift = run when held, dodge when tapped.
const TAP_KEYS = new Set(['ShiftLeft', 'ShiftRight']);
const DODGE_TAP_WINDOW = 0.25; // seconds — release within this window = tap

class Input {
  held = new Set<GameAction>();
  pressed = new Set<GameAction>();
  mouse = { left: false, right: false };
  leftPressed = false;
  rightPressed = false;
  wheel = 0;
  attached = false;
  pointerLocked = false;

  // ---- touch state (v0.5.0) — written by TouchControls UI, read by gameplay
  // axes: y>0 = forward, x>0 = right, magnitude ≤ 1 (joystick deflection)
  touch = {
    axes: { x: 0, y: 0 },
    run: false,        // joystick pushed to the rim
    block: false,      // BLOCK button held (combat)
    look: { dx: 0, dy: 0 }, // look-drag accumulator (px), consumed by CameraRig
  };

  // ---- touch injectors (called from DOM pointer events) ----
  setAxes(x: number, y: number) {
    this.touch.axes.x = x;
    this.touch.axes.y = y;
  }
  injectPress(a: GameAction) {
    this.pressed.add(a);
    this.held.add(a);
    // auto-release next endFrame via touchHeld cleanup below
    this.touchAutoRelease.add(a);
  }
  injectHeld(a: GameAction, down: boolean) {
    if (down) {
      if (!this.held.has(a)) this.pressed.add(a);
      this.held.add(a);
    } else {
      this.held.delete(a);
    }
  }
  injectLeftTap() {
    this.leftPressed = true;
    this.pressed.add('attack_light');
  }
  /** consume accumulated look delta (px). CameraRig calls once per frame. */
  consumeLook() {
    const l = this.touch.look;
    const out = { dx: l.dx, dy: l.dy };
    l.dx = 0;
    l.dy = 0;
    return out;
  }
  private touchAutoRelease = new Set<GameAction>();

  // tap detection state
  private shiftDownAt = 0;
  private shiftPendingDodge = false; // true when dodge action should fire on next endFrame

  private onKeyDown = (e: KeyboardEvent) => {
    if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) return;

    if (TAP_KEYS.has(e.code)) {
      if (!this.held.has('run')) {
        // first press: start running, record timestamp
        this.shiftDownAt = performance.now() / 1000;
      }
      this.held.add('run');
      if (e.code === 'Space' || e.code.startsWith('Arrow')) e.preventDefault();
      return;
    }

    const actions = KEY_TO_ACTIONS[e.code];
    if (actions) {
      for (const a of actions) {
        if (!this.held.has(a)) this.pressed.add(a);
        this.held.add(a);
      }
      if (e.code === 'Space' || e.code.startsWith('Arrow')) e.preventDefault();
    }
  };

  private onKeyUp = (e: KeyboardEvent) => {
    if (TAP_KEYS.has(e.code)) {
      // releasing Shift: if it was held briefly, treat as dodge tap
      const heldFor = performance.now() / 1000 - this.shiftDownAt;
      if (heldFor <= DODGE_TAP_WINDOW) {
        this.shiftPendingDodge = true;
        this.pressed.add('dodge');
      }
      // only release run if no other Shift is still down
      const otherShift = e.code === 'ShiftLeft' ? 'ShiftRight' : 'ShiftLeft';
      if (!this.heldKeys.has(otherShift)) {
        this.held.delete('run');
      }
      return;
    }
    const actions = KEY_TO_ACTIONS[e.code];
    if (actions) for (const a of actions) this.held.delete(a);
  };

  // track raw key codes so we can detect modifier-key aliases correctly
  private heldKeys = new Set<string>();

  private onMouseDown = (e: MouseEvent) => {
    if (e.button === 0 && !this.mouse.left) this.leftPressed = true;
    if (e.button === 2 && !this.mouse.right) this.rightPressed = true;
    this.mouse.left = this.mouse.left || e.button === 0;
    this.mouse.right = this.mouse.right || e.button === 2;
  };

  private onMouseUp = (e: MouseEvent) => {
    if (e.button === 0) this.mouse.left = false;
    if (e.button === 2) this.mouse.right = false;
  };

  private onWheel = (e: WheelEvent) => {
    this.wheel += e.deltaY;
  };

  private onLockChange = () => {
    this.pointerLocked = document.pointerLockElement != null;
    if (!this.pointerLocked) {
      this.held.clear();
      this.heldKeys.clear();
      this.mouse.left = false;
      this.mouse.right = false;
    }
  };

  attach() {
    if (this.attached) return;
    this.attached = true;
    window.addEventListener('keydown', this.onKeyDown);
    window.addEventListener('keyup', this.onKeyUp);
    window.addEventListener('mousedown', this.onMouseDown);
    window.addEventListener('mouseup', this.onMouseUp);
    window.addEventListener('wheel', this.onWheel, { passive: true });
    window.addEventListener('contextmenu', (e) => e.preventDefault());
    document.addEventListener('pointerlockchange', this.onLockChange);
    // also track raw keydown/keyup for tap-key aliasing
    window.addEventListener('keydown', (e) => this.heldKeys.add(e.code));
    window.addEventListener('keyup', (e) => this.heldKeys.delete(e.code));
  }

  detach() {
    if (!this.attached) return;
    this.attached = false;
    window.removeEventListener('keydown', this.onKeyDown);
    window.removeEventListener('keyup', this.onKeyUp);
    window.removeEventListener('mousedown', this.onMouseDown);
    window.removeEventListener('mouseup', this.onMouseUp);
    window.removeEventListener('wheel', this.onWheel);
    document.removeEventListener('pointerlockchange', this.onLockChange);
  }

  justPressed(a: GameAction) {
    return this.pressed.has(a);
  }

  // Called once per frame by the input janitor AFTER every gameplay system has
  // consumed its input. NOTE: `wheel` is deliberately NOT cleared here — it is
  // an explicit-consume accumulator (CameraRig.consumeWheel) and the camera
  // rig's frame runs after this janitor.
  endFrame() {
    this.pressed.clear();
    this.leftPressed = false;
    this.rightPressed = false;
    this.shiftPendingDodge = false;
    // one-shot touch actions auto-release after systems had a chance to read
    for (const a of this.touchAutoRelease) this.held.delete(a);
    this.touchAutoRelease.clear();
  }

  /** isDown with touch fallback — movement/run read both sources. */
  isDown(a: GameAction) {
    if (this.held.has(a)) return true;
    switch (a) {
      case 'forward': return this.touch.axes.y > 0.3;
      case 'back': return this.touch.axes.y < -0.3;
      case 'left': return this.touch.axes.x < -0.3;
      case 'right': return this.touch.axes.x > 0.3;
      case 'run': return this.touch.run;
      default: return false;
    }
  }

  consumeWheel() {
    const w = this.wheel;
    this.wheel = 0;
    return w;
  }

  requestLock() {
    if (document.pointerLockElement == null) document.body.requestPointerLock?.();
  }

  releaseLock() {
    if (document.pointerLockElement != null) document.exitPointerLock?.();
  }
}

export const input = new Input();
