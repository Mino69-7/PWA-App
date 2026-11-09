// Bulles à toucher : des bulles pastel montent lentement, un tap les fait éclater.
// Rendu Canvas 2D, objets pré-alloués (aucune allocation dans la boucle).

import { createPointerField, nearest, ready } from '../core/input.js';

const COLORS = ['#F2C6C2', '#F6D5B8', '#F5E6A8', '#C5DDBF', '#BFD8E6', '#D4C8E6'];
const NOTES = [3, 4, 5, 6, 7, 8]; // une note de la gamme par couleur
const SHINE = '#FCF8F2';
const RIPPLE = '#E6DACB';
const POP_MS = 750;
const RIPPLE_MS = 900;
const RESPAWN_MS = 600;
const GROW_MS = 800;
const MAX_BUBBLES = 6;
const DROPS = 7;
const TAU = Math.PI * 2;
const DROP_COS = [];
const DROP_SIN = [];
for (let j = 0; j < DROPS; j++) {
  DROP_COS.push(Math.cos((j * TAU) / DROPS));
  DROP_SIN.push(Math.sin((j * TAU) / DROPS));
}

const easeOut = (k) => 1 - (1 - k) * (1 - k) * (1 - k);

const ICON = `<svg viewBox="0 0 100 100"><circle cx="40" cy="58" r="26" fill="#BFD8E6"/><circle cx="31" cy="49" r="6" fill="#FCF8F2" opacity=".7"/><circle cx="70" cy="32" r="16" fill="#F2C6C2"/><circle cx="65" cy="27" r="4" fill="#FCF8F2" opacity=".7"/><circle cx="73" cy="73" r="10" fill="#D4C8E6"/></svg>`;

class Bubbles {
  init(root, services) {
    this.root = root;
    this.layout = services.layout;
    this.audio = services.audio;
    this.running = false;
    this.raf = 0;
    this.last = 0;
    this.empty = {};

    this.canvas = document.createElement('canvas');
    this.canvas.className = 'fill';
    root.append(this.canvas);

    this.bubbles = [];
    for (let i = 0; i < MAX_BUBBLES; i++) {
      this.bubbles.push({ x: 0, y: 0, baseX: 0, r: 0, scale: 1, reach: 0, color: 0, phase: 0, secs: 15, speed: 0, active: false, respawnAt: 0, born: 0, lastHit: 0 });
    }
    this.pops = [];
    for (let i = 0; i < 8; i++) this.pops.push({ on: false, x: 0, y: 0, r: 0, t0: 0, color: 0 });
    this.ripples = [];
    for (let i = 0; i < 6; i++) this.ripples.push({ on: false, x: 0, y: 0, t0: 0 });

    this.loop = this.loop.bind(this);
    this.isActive = (b) => b.active;
    createPointerField(root, { down: (p) => this.tap(p.x, p.y) });

    this.resize();
    const now = performance.now();
    for (let i = 0; i < this.count; i++) this.spawn(this.bubbles[i], now, true);
  }

  resize() {
    const s = this.layout.size();
    this.ctx = this.layout.fitCanvas(this.canvas);
    this.w = s.w;
    this.h = s.h;
    // Diamètre ≥ 96 px, environ 22 % du petit côté.
    this.r = Math.max(48, Math.min(110, s.short * 0.11));
    this.count = s.short >= 600 ? 5 : 4;
    const now = performance.now();
    for (let i = 0; i < MAX_BUBBLES; i++) {
      const b = this.bubbles[i];
      if (i >= this.count) {
        b.active = false;
        b.respawnAt = 0;
      } else if (b.active) {
        b.r = this.r * b.scale;
        b.reach = b.r * 1.6 + 16;
        b.baseX = Math.min(Math.max(b.baseX, b.r + 8), this.w - b.r - 8);
        b.speed = this.h / b.secs;
      } else if (!b.respawnAt) {
        b.respawnAt = now;
      }
    }
  }

  start() {
    if (this.running) return;
    this.running = true;
    this.last = performance.now();
    this.raf = requestAnimationFrame(this.loop);
  }

  stop() {
    this.running = false;
    cancelAnimationFrame(this.raf);
  }

  spawn(b, now, spread) {
    b.scale = 0.85 + Math.random() * 0.3;
    b.r = this.r * b.scale;
    b.reach = b.r * 1.6 + 16; // zone tactile bien plus large que la bulle
    b.color = this.pickColor(b);
    b.y = spread ? this.h * (0.2 + Math.random() * 0.7) : this.h * (0.55 + Math.random() * 0.35);
    b.baseX = this.pickX(b);
    b.x = b.baseX;
    b.secs = 13 + Math.random() * 5;
    b.speed = this.h / b.secs;
    b.phase = Math.random() * TAU;
    b.active = true;
    b.respawnAt = 0;
    b.born = now;
  }

  pickColor(self) {
    let c = 0;
    for (let tries = 0; tries < 12; tries++) {
      c = Math.floor(Math.random() * COLORS.length);
      let used = false;
      for (let i = 0; i < MAX_BUBBLES; i++) {
        const o = this.bubbles[i];
        if (o !== self && o.active && o.color === c) used = true;
      }
      if (!used) break;
    }
    return c;
  }

  // Choisit, parmi quelques positions au hasard, la plus éloignée des autres bulles.
  pickX(self) {
    const min = self.r + 12;
    const max = Math.max(min, this.w - self.r - 12);
    let best = min;
    let bestGap = -1;
    for (let tries = 0; tries < 10; tries++) {
      const x = min + Math.random() * (max - min);
      let gap = Infinity;
      for (let i = 0; i < MAX_BUBBLES; i++) {
        const o = this.bubbles[i];
        if (o === self || !o.active) continue;
        gap = Math.min(gap, Math.hypot(o.x - x, o.y - self.y) - o.r);
      }
      if (gap > bestGap) {
        bestGap = gap;
        best = x;
      }
    }
    return best;
  }

  tap(x, y) {
    const now = performance.now();
    const b = nearest(x, y, this.bubbles, this.isActive);
    if (b) {
      if (ready(b, now)) this.pop(b, now);
      return;
    }
    // Tap dans le vide : jamais d'échec, une ondulation et une note douce.
    if (!ready(this.empty, now)) return;
    const rp = this.slot(this.ripples);
    rp.on = true;
    rp.x = x;
    rp.y = y;
    rp.t0 = now;
    this.audio.tap();
  }

  pop(b, now) {
    b.active = false;
    b.respawnAt = now + RESPAWN_MS;
    const p = this.slot(this.pops);
    p.on = true;
    p.x = b.x;
    p.y = b.y;
    p.r = b.r;
    p.t0 = now;
    p.color = b.color;
    this.audio.plop(NOTES[b.color]);
  }

  // Emplacement libre d'un pool (ou le plus ancien).
  slot(pool) {
    let oldest = pool[0];
    for (let i = 0; i < pool.length; i++) {
      if (!pool[i].on) return pool[i];
      if (pool[i].t0 < oldest.t0) oldest = pool[i];
    }
    return oldest;
  }

  loop(t) {
    if (!this.running) return;
    const now = performance.now();
    const dt = Math.min(0.05, (now - this.last) / 1000);
    this.last = now;
    this.update(now, dt);
    this.draw(now);
    this.raf = requestAnimationFrame(this.loop);
  }

  update(now, dt) {
    for (let i = 0; i < MAX_BUBBLES; i++) {
      const b = this.bubbles[i];
      if (!b.active) {
        if (i < this.count && b.respawnAt && now >= b.respawnAt) this.spawn(b, now, false);
        continue;
      }
      b.y -= b.speed * dt;
      b.x = b.baseX + Math.sin(b.phase + now * 0.0008) * b.r * 0.2;
      if (b.y < -b.r * 1.2) this.spawn(b, now, false);
    }
  }

  circle(x, y, r) {
    const c = this.ctx;
    c.beginPath();
    c.arc(x, y, r, 0, TAU);
    c.fill();
  }

  draw(now) {
    const c = this.ctx;
    c.clearRect(0, 0, this.w, this.h);

    c.fillStyle = RIPPLE;
    for (let i = 0; i < this.ripples.length; i++) {
      const rp = this.ripples[i];
      if (!rp.on) continue;
      const k = (now - rp.t0) / RIPPLE_MS;
      if (k >= 1) {
        rp.on = false;
        continue;
      }
      c.globalAlpha = 0.5 * (1 - k);
      this.circle(rp.x, rp.y, 14 + 76 * easeOut(k));
    }

    for (let i = 0; i < MAX_BUBBLES; i++) {
      const b = this.bubbles[i];
      if (!b.active) continue;
      const g = easeOut(Math.min(1, (now - b.born) / GROW_MS));
      const rr = b.r * (0.4 + 0.6 * g) * (1 + 0.025 * Math.sin(now * 0.0021 + b.phase));
      c.globalAlpha = g;
      c.fillStyle = COLORS[b.color];
      this.circle(b.x, b.y, rr);
      c.globalAlpha = 0.6 * g;
      c.fillStyle = SHINE;
      this.circle(b.x - rr * 0.33, b.y - rr * 0.35, rr * 0.22);
    }

    for (let i = 0; i < this.pops.length; i++) {
      const p = this.pops[i];
      if (!p.on) continue;
      const k = (now - p.t0) / POP_MS;
      if (k >= 1) {
        p.on = false;
        continue;
      }
      const e = easeOut(k);
      c.fillStyle = COLORS[p.color];
      c.globalAlpha = 0.35 * (1 - k);
      this.circle(p.x, p.y, p.r * (1 + 0.45 * e));
      c.globalAlpha = 0.9 * (1 - k);
      const dist = p.r * (0.5 + 0.9 * e);
      const dr = p.r * 0.14 * (1 - 0.6 * k);
      for (let j = 0; j < DROPS; j++) this.circle(p.x + DROP_COS[j] * dist, p.y + DROP_SIN[j] * dist, dr);
    }
    c.globalAlpha = 1;
  }
}

export default {
  id: 'bulles',
  icon: ICON,
  create: () => new Bubbles(),
};
