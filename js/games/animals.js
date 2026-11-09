// Animaux et leurs sons : un tap fait bouger l'animal et dit son cri.
// Rendu DOM/SVG.

import { createPointerField, nearest, ready } from '../core/input.js';
import { ripple, replay } from '../core/effects.js';

const EYE = '#7D6B61';
const eyes = (y, dx = 13, r = 4.5) => `<circle cx="${50 - dx}" cy="${y}" r="${r}" fill="${EYE}"/><circle cx="${50 + dx}" cy="${y}" r="${r}" fill="${EYE}"/>`;
const ear = (d, c, w = 8) => `<path d="${d}" fill="${c}" stroke="${c}" stroke-width="${w}" stroke-linejoin="round"/>`;

const CAT = `<svg viewBox="0 0 100 100">${ear('M17 44 L21 12 L45 28 Z', '#EFC6A2')}${ear('M83 44 L79 12 L55 28 Z', '#EFC6A2')}${ear('M24 30 L26 19 L35 26 Z', '#F2C6C2', 4)}${ear('M76 30 L74 19 L65 26 Z', '#F2C6C2', 4)}<circle cx="50" cy="56" r="36" fill="#F6D5B8"/>${eyes(52)}${ear('M46 62 H54 L50 67 Z', '#E3A39D', 3)}<ellipse cx="29" cy="65" rx="6" ry="4" fill="#F2C6C2"/><ellipse cx="71" cy="65" rx="6" ry="4" fill="#F2C6C2"/></svg>`;

const DOG = `<svg viewBox="0 0 100 100"><circle cx="50" cy="52" r="34" fill="#EBD8BC"/><ellipse cx="19" cy="50" rx="11" ry="22" fill="#CDB394" transform="rotate(18 19 50)"/><ellipse cx="81" cy="50" rx="11" ry="22" fill="#CDB394" transform="rotate(-18 81 50)"/><ellipse cx="50" cy="68" rx="17" ry="13" fill="#F6EBDA"/>${eyes(47, 12)}<ellipse cx="50" cy="62" rx="6.5" ry="4.5" fill="#8F7B70"/><path d="M50 66 v5" stroke="#8F7B70" stroke-width="2.5" stroke-linecap="round"/></svg>`;

const COW = `<svg viewBox="0 0 100 100"><path d="M31 22 Q26 10 34 7" stroke="#F0DC8E" stroke-width="6" stroke-linecap="round" fill="none"/><path d="M69 22 Q74 10 66 7" stroke="#F0DC8E" stroke-width="6" stroke-linecap="round" fill="none"/><ellipse cx="14" cy="38" rx="12" ry="6" fill="#D9CEE5" transform="rotate(-20 14 38)"/><ellipse cx="86" cy="38" rx="12" ry="6" fill="#D9CEE5" transform="rotate(20 86 38)"/><ellipse cx="50" cy="48" rx="32" ry="34" fill="#E7E1EE"/><circle cx="35" cy="30" r="9" fill="#CFC3E0"/><circle cx="67" cy="40" r="6" fill="#CFC3E0"/><ellipse cx="50" cy="72" rx="24" ry="15" fill="#F2C6C2"/><ellipse cx="42" cy="72" rx="3" ry="4" fill="#D79B95"/><ellipse cx="58" cy="72" rx="3" ry="4" fill="#D79B95"/>${eyes(48, 12)}</svg>`;

const DUCK = `<svg viewBox="0 0 100 100"><path d="M50 15 q-3 -11 7 -11" stroke="#F0DC8E" stroke-width="5" fill="none" stroke-linecap="round"/><circle cx="50" cy="50" r="35" fill="#F5E6A8"/><ellipse cx="50" cy="68" rx="20" ry="9" fill="#F3BE94"/><ellipse cx="50" cy="63" rx="18" ry="6" fill="#F6CBA6"/>${eyes(45)}<ellipse cx="27" cy="58" rx="5" ry="3.5" fill="#F2C6C2"/><ellipse cx="73" cy="58" rx="5" ry="3.5" fill="#F2C6C2"/></svg>`;

const SHEEP = `<svg viewBox="0 0 100 100"><g fill="#E3DCEB"><circle cx="50" cy="20" r="14"/><circle cx="30" cy="27" r="13"/><circle cx="70" cy="27" r="13"/><circle cx="21" cy="45" r="12"/><circle cx="79" cy="45" r="12"/><circle cx="25" cy="64" r="12"/><circle cx="75" cy="64" r="12"/><circle cx="50" cy="78" r="13"/><circle cx="50" cy="50" r="30"/></g><ellipse cx="29" cy="46" rx="10" ry="5" fill="#CBB8A8" transform="rotate(-25 29 46)"/><ellipse cx="71" cy="46" rx="10" ry="5" fill="#CBB8A8" transform="rotate(25 71 46)"/><ellipse cx="50" cy="55" rx="18" ry="22" fill="#D9C6B6"/>${eyes(51, 7, 3.8)}<ellipse cx="50" cy="66" rx="5" ry="3" fill="#B89F8E"/></svg>`;

const PIG = `<svg viewBox="0 0 100 100">${ear('M22 34 L20 12 L40 22 Z', '#EBB0AB')}${ear('M78 34 L80 12 L60 22 Z', '#EBB0AB')}<circle cx="50" cy="52" r="35" fill="#F2C6C2"/><ellipse cx="50" cy="63" rx="15" ry="11" fill="#E9AEA9"/><ellipse cx="45" cy="63" rx="3" ry="4.5" fill="#C98F8A"/><ellipse cx="55" cy="63" rx="3" ry="4.5" fill="#C98F8A"/>${eyes(45)}</svg>`;

const ANIMALS = [
  { id: 'chat', phrase: 'Le chat fait miaou !', note: 5, svg: CAT },
  { id: 'chien', phrase: 'Le chien fait ouaf ouaf !', note: 3, svg: DOG },
  { id: 'vache', phrase: 'La vache fait meuh !', note: 0, svg: COW },
  { id: 'canard', phrase: 'Le canard fait coin coin !', note: 7, svg: DUCK },
  { id: 'mouton', phrase: 'Le mouton fait bêê !', note: 4, svg: SHEEP },
  { id: 'cochon', phrase: 'Le cochon fait groin groin !', note: 2, svg: PIG },
];
const SAY_AGAIN_MS = 1400; // même animal retouché : on ne coupe pas la phrase en cours

class Animals {
  init(root, services) {
    this.root = root;
    this.layout = services.layout;
    this.audio = services.audio;
    this.empty = {};
    this.lastSaid = null;
    this.lastSaidAt = 0;

    this.grid = document.createElement('div');
    this.grid.className = 'animals';
    root.append(this.grid);
    this.items = ANIMALS.map((animal, i) => {
      const cell = document.createElement('div');
      cell.className = 'cell';
      const el = document.createElement('div');
      el.className = 'animal';
      el.dataset.animal = animal.id;
      el.style.animationDelay = `${-i * 1.1}s`;
      el.innerHTML = animal.svg;
      cell.append(el);
      this.grid.append(cell);
      return { animal, el, x: 0, y: 0, reach: 0, lastHit: 0 };
    });

    createPointerField(root, { down: (p) => this.tap(p.x, p.y) });
    this.resize();
  }

  start() {}
  stop() {}

  resize() {
    const r = this.layout.playRect();
    const st = this.grid.style;
    st.left = `${r.x}px`;
    st.top = `${r.y}px`;
    st.width = `${r.w}px`;
    st.height = `${r.h}px`;
    this.grid.classList.toggle('wide', r.w > r.h);
  }

  measure() {
    const base = this.root.getBoundingClientRect();
    this.items.forEach((it) => {
      const c = it.el.parentElement.getBoundingClientRect();
      it.x = c.left - base.left + c.width / 2;
      it.y = c.top - base.top + c.height / 2;
      it.reach = Math.min(c.width, c.height) * 0.75;
    });
  }

  tap(x, y) {
    const now = performance.now();
    this.measure();
    const it = nearest(x, y, this.items);
    if (!it) {
      if (!ready(this.empty, now)) return;
      ripple(this.root, x, y);
      this.audio.tap();
      return;
    }
    if (!ready(it, now)) return;
    replay(it.el, 'wiggle');
    this.audio.note(it.animal.note);
    if (this.lastSaid !== it || now - this.lastSaidAt > SAY_AGAIN_MS) {
      this.lastSaid = it;
      this.lastSaidAt = now;
      this.audio.say(`animal-${it.animal.id}`, it.animal.phrase);
    }
  }
}

export default {
  id: 'animaux',
  icon: `<svg viewBox="0 0 100 100"><g transform="translate(5 5) scale(.9)">${CAT.slice(CAT.indexOf('>') + 1, -6)}</g></svg>`,
  create: () => new Animals(),
};
