// Trier les couleurs : poser chaque balle dans le panier de sa couleur.
// Même logique tolérante que les formes (aimant, retour doux, tap = placement auto).

import { createSorter, moveItem } from '../core/input.js';
import { ripple, replay, shuffle, clamp } from '../core/effects.js';

// Pastels un peu plus soutenus que le reste pour bien distinguer les couleurs.
const COLORS = [
  { id: 'rose', word: 'Rose', fill: '#EDB3AE', rim: '#DFA09A', note: 2 },
  { id: 'jaune', word: 'Jaune', fill: '#F0DC8E', rim: '#E0CA78', note: 4 },
  { id: 'vert', word: 'Vert', fill: '#AFD0A6', rim: '#9BBF91', note: 6 },
  { id: 'bleu', word: 'Bleu', fill: '#A7C9DE', rim: '#92B8CF', note: 8 },
];
const BALLS = 3;
const IN_SCALE = 0.62;           // taille d'une balle posée dans le panier
const SLOTS = [0, -0.25, 0.25];  // positions dans le panier (fraction de la largeur)
const RIM_Y = 16 / 70;           // hauteur du bord du panier dans son dessin

const ballSvg = (c) => `<svg viewBox="0 0 100 100"><circle cx="50" cy="50" r="46" fill="${c.fill}"/><circle cx="35" cy="34" r="10" fill="#FCF8F2" opacity=".55"/></svg>`;
const backSvg = (c) => `<svg viewBox="0 0 100 70"><ellipse cx="50" cy="16" rx="46" ry="12" fill="${c.rim}"/></svg>`;
const frontSvg = (c) => `<svg viewBox="0 0 100 70"><path d="M4 16 Q50 30 96 16 Q94 68 50 68 Q6 68 4 16 Z" fill="${c.fill}"/></svg>`;

const ICON = `<svg viewBox="0 0 100 100"><circle cx="50" cy="22" r="12" fill="#AFD0A6"/><ellipse cx="50" cy="60" rx="38" ry="9" fill="#92B8CF"/><circle cx="37" cy="55" r="12" fill="#EDB3AE"/><circle cx="62" cy="53" r="12" fill="#F0DC8E"/><path d="M12 60 Q50 70 88 60 Q85 92 50 92 Q15 92 12 60 Z" fill="#A7C9DE"/></svg>`;

function box(el, x, y, w, h) {
  el.style.width = `${w}px`;
  el.style.height = `${h}px`;
  el.style.transform = `translate3d(${x - w / 2}px, ${y - h / 2}px, 0)`;
}

class Colors {
  init(root, services) {
    this.root = root;
    this.layout = services.layout;
    this.audio = services.audio;
    this.items = [];
    this.baskets = [];
    this.scene = document.createElement('div');
    this.scene.className = 'scene';
    root.append(this.scene);

    createSorter(root, {
      items: () => this.items,
      onPick: (it) => this.picked(it),
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

  later(fn, ms) {
    setTimeout(() => { if (this.root.isConnected) fn(); }, ms);
  }

  newRound() {
    this.finished = false;
    this.scene.replaceChildren();
    this.scene.classList.add('hidden');

    // 2 paniers sur téléphone, 3 sur tablette ; toujours 3 balles.
    const n = this.layout.size().short >= 600 ? 3 : 2;
    const picks = shuffle(COLORS.slice()).slice(0, n);
    const ballColors = n === 3 ? picks.slice() : [picks[0], picks[1], picks[Math.random() < 0.5 ? 0 : 1]];

    this.baskets = picks.map((color) => {
      const back = document.createElement('div');
      back.className = 'basket-back';
      back.innerHTML = backSvg(color);
      const front = document.createElement('div');
      front.className = 'basket-front';
      front.dataset.color = color.id;
      front.innerHTML = frontSvg(color);
      this.scene.append(back, front);
      return { color, back, front, x: 0, y: 0, w: 0, h: 0 };
    });

    this.items = shuffle(ballColors).map((color) => {
      const el = document.createElement('div');
      el.className = 'ball';
      el.dataset.color = color.id;
      el.innerHTML = ballSvg(color);
      this.scene.append(el);
      return {
        el, color, basket: this.baskets.find((b) => b.color === color), slot: 0,
        size: 0, x: 0, y: 0, reach: 0, magnet: 0, targetScale: IN_SCALE,
        home: { x: 0, y: 0 }, target: { x: 0, y: 0 }, done: false, busy: false, pointer: null,
      };
    });
    this.items.forEach((it) => { it.target = this.slotPos(it.basket, 0); });

    this.resize();
    void this.scene.offsetWidth;
    this.scene.classList.remove('hidden');
  }

  resize() {
    const r = this.layout.playRect();
    const n = this.baskets.length;
    const ball = clamp(Math.min(r.w / BALLS, r.h / 2) * 0.6, 96, 160);
    const bw = clamp(Math.min((r.w / n) * 0.82, (r.h * 0.42) / 0.7), 130, 300);
    const bh = bw * 0.7;

    this.baskets.forEach((b, i) => {
      b.x = r.x + (r.w * (i + 0.5)) / n;
      b.y = r.y + r.h * 0.74;
      b.w = bw;
      b.h = bh;
      box(b.back, b.x, b.y, bw, bh);
      box(b.front, b.x, b.y, bw, bh);
    });

    this.items.forEach((it, i) => {
      it.size = ball;
      it.el.style.width = `${ball}px`;
      it.el.style.height = `${ball}px`;
      it.reach = ball * 0.9;
      it.home.x = r.x + (r.w * (i + 0.5)) / BALLS;
      it.home.y = r.y + r.h * 0.26;
      const b = it.basket;
      it.magnet = Math.min(Math.max(bw * 0.75, ball * 1.4), Math.hypot(it.home.x - b.x, it.home.y - b.y) * 0.75);
      if (it.pointer !== null) return;
      it.target = this.slotPos(b, it.slot);
      if (it.done) moveItem(it, it.target.x, it.target.y, IN_SCALE, 0);
      else moveItem(it, it.home.x, it.home.y, 1, 0);
    });
  }

  slotPos(b, slot) {
    return { x: b.x + SLOTS[slot] * b.w, y: b.y - b.h / 2 + b.h * RIM_Y + b.h * 0.06 };
  }

  // Quand on attrape une balle, on lui réserve une place libre dans son panier.
  picked(it) {
    const used = this.items
      .filter((o) => o !== it && o.basket === it.basket && (o.done || o.pointer !== null))
      .map((o) => o.slot);
    const free = [0, 1, 2].find((s) => !used.includes(s));
    it.slot = free === undefined ? 0 : free;
    it.target = this.slotPos(it.basket, it.slot);
    this.audio.pick(it.color.note);
  }

  placed(it) {
    it.el.classList.add('in', 'placed');
    replay(it.basket.front, 'wiggle');
    replay(it.basket.back, 'wiggle');
    this.audio.place(it.color.note);
    this.audio.say(`couleur-${it.color.id}`, it.color.word);
    if (!this.finished && this.items.every((i) => i.done)) {
      this.finished = true;
      this.later(() => this.celebrate(), 1000);
    }
  }

  celebrate() {
    this.audio.chime();
    this.baskets.forEach((b) => {
      replay(b.front, 'wiggle');
      replay(b.back, 'wiggle');
    });
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
  id: 'couleurs',
  icon: ICON,
  create: () => new Colors(),
};
