// Formes dans leur trou : glisser (ou simplement toucher) chaque forme vers sa silhouette.
// Rendu DOM/SVG déplacé avec transform.

import { createSorter, moveItem } from '../core/input.js';
import { ripple, shuffle, clamp } from '../core/effects.js';

const COLORS = ['#F2C6C2', '#F6D5B8', '#F5E6A8', '#C5DDBF', '#BFD8E6', '#D4C8E6'];
const HOLE = '#E6D9C6';

const SHAPES = [
  { id: 'rond', word: 'Le rond', note: 3, draw: (c) => `<circle cx="50" cy="50" r="46" fill="${c}"/>` },
  { id: 'carre', word: 'Le carré', note: 5, draw: (c) => `<rect x="7" y="7" width="86" height="86" rx="20" fill="${c}"/>` },
  { id: 'triangle', word: 'Le triangle', note: 7, draw: (c) => `<path d="M50 12 L89 82 L11 82 Z" fill="${c}" stroke="${c}" stroke-width="14" stroke-linejoin="round"/>` },
];

const svg = (inner) => `<svg viewBox="0 0 100 100">${inner}</svg>`;

const ICON = `<svg viewBox="0 0 100 100"><circle cx="28" cy="32" r="17" fill="#C5DDBF"/><rect x="55" y="15" width="32" height="32" rx="8" fill="#F2C6C2"/><path d="M50 56 L70 86 L30 86 Z" fill="#F5E6A8" stroke="#F5E6A8" stroke-width="9" stroke-linejoin="round"/></svg>`;

function box(el, x, y, size) {
  el.style.width = `${size}px`;
  el.style.height = `${size}px`;
  el.style.transform = `translate3d(${x - size / 2}px, ${y - size / 2}px, 0)`;
}

class Shapes {
  init(root, services) {
    this.root = root;
    this.layout = services.layout;
    this.audio = services.audio;
    this.items = [];
    this.holes = [];
    this.scene = document.createElement('div');
    this.scene.className = 'scene';
    root.append(this.scene);

    createSorter(root, {
      items: () => this.items,
      onPick: (it) => this.audio.pick(it.shape.note),
      onPlace: (it) => this.placed(it),
      onEmpty: (x, y) => {
        ripple(this.scene, x, y);
        this.audio.tap();
      },
    });
    this.newRound();
  }

  start() {}
  stop() {}

  // Minuterie qui ne se déclenche plus une fois le jeu quitté.
  later(fn, ms) {
    setTimeout(() => { if (this.root.isConnected) fn(); }, ms);
  }

  newRound() {
    this.finished = false;
    this.scene.replaceChildren();
    this.scene.classList.add('hidden');
    const colors = shuffle(COLORS.slice());

    const holesByShape = SHAPES.map((shape) => {
      const el = document.createElement('div');
      el.className = 'hole';
      el.innerHTML = svg(shape.draw(HOLE));
      this.scene.append(el);
      return { el, shape, x: 0, y: 0 };
    });
    this.holes = shuffle(holesByShape.slice());

    this.items = shuffle([0, 1, 2]).map((k, i) => {
      const shape = SHAPES[k];
      const el = document.createElement('div');
      el.className = 'piece';
      el.dataset.shape = shape.id;
      el.innerHTML = svg(shape.draw(colors[i]));
      this.scene.append(el);
      return {
        el, shape, hole: holesByShape[k], size: 0, x: 0, y: 0, reach: 0, magnet: 0,
        home: { x: 0, y: 0 }, target: { x: 0, y: 0 }, done: false, busy: false, pointer: null,
      };
    });

    this.resize();
    void this.scene.offsetWidth;
    this.scene.classList.remove('hidden');
  }

  resize() {
    const r = this.layout.playRect();
    const wide = r.w >= r.h;
    // Paysage : silhouettes en haut, formes en bas. Portrait : deux colonnes.
    const cols = wide ? 3 : 2;
    const rows = wide ? 2 : 3;
    const cw = r.w / cols;
    const ch = r.h / rows;
    const size = clamp(Math.min(cw, ch) * 0.66, 96, 190);
    const slot = (line, i) => (wide
      ? { x: r.x + cw * (i + 0.5), y: r.y + ch * (line + 0.5) }
      : { x: r.x + cw * (line + 0.5), y: r.y + ch * (i + 0.5) });

    this.holes.forEach((h, i) => {
      const p = slot(0, i);
      h.x = p.x;
      h.y = p.y;
      box(h.el, p.x, p.y, size * 1.08);
    });

    this.items.forEach((it, i) => {
      const p = slot(1, i);
      it.size = size;
      it.el.style.width = `${size}px`;
      it.el.style.height = `${size}px`;
      it.reach = size * 0.9;
      it.home.x = p.x;
      it.home.y = p.y;
      it.target.x = it.hole.x;
      it.target.y = it.hole.y;
      // Aimant généreux, mais pas au point d'attirer depuis sa place de départ.
      it.magnet = Math.min(size * 1.5, Math.hypot(p.x - it.hole.x, p.y - it.hole.y) * 0.75);
      if (it.pointer !== null) return;
      if (it.done) moveItem(it, it.target.x, it.target.y, 1, 0);
      else moveItem(it, p.x, p.y, 1, 0);
    });
  }

  placed(it) {
    it.el.classList.add('placed');
    this.audio.place(it.shape.note);
    this.audio.say(`forme-${it.shape.id}`, it.shape.word);
    if (!this.finished && this.items.every((i) => i.done)) {
      this.finished = true;
      this.later(() => this.celebrate(), 900);
    }
  }

  celebrate() {
    this.audio.chime();
    this.items.forEach((it, i) => {
      it.el.firstElementChild.style.animationDelay = `${i * 0.15}s`;
      it.el.classList.add('party');
    });
    this.later(() => {
      this.scene.classList.add('hidden');
      this.later(() => this.newRound(), 750);
    }, 2000);
  }
}

export default {
  id: 'formes',
  icon: ICON,
  create: () => new Shapes(),
};
