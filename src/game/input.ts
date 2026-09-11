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

  isDown(a: GameAction) {
    return this.held.has(a);
  }

  justPressed(a: GameAction) {
    return this.pressed.has(a);
  }

  // Called once per frame after systems consumed their input.
  endFrame() {
    this.pressed.clear();
    this.leftPressed = false;
    this.rightPressed = false;
    this.wheel = 0;
    this.shiftPendingDodge = false;
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
