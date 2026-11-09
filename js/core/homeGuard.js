// Coin caché : un appui maintenu 2 s fait apparaître le bouton maison pendant 5 s.
// Un appui court ou répété ne fait rien.

const HOLD_MS = 2000;
const RING_DELAY_MS = 400;
const BUTTON_MS = 5000;
const MOVE_TOLERANCE = 40;
const CIRC = 2 * Math.PI * 30;

export const HOUSE_SVG = `<svg viewBox="0 0 100 100"><path d="M50 18 L84 48 H74 V82 H26 V48 H16 Z" fill="#BCA996" stroke="#BCA996" stroke-width="8" stroke-linejoin="round"/><rect x="43" y="58" width="14" height="24" rx="5" fill="#EFE5D6"/></svg>`;

// Anneau discret qui se remplit pendant l'appui long.
export function createRing() {
  const el = document.createElement('div');
  el.className = 'ring';
  el.innerHTML = `<svg viewBox="0 0 72 72"><circle class="ring-track" cx="36" cy="36" r="30"/><circle class="ring-fill" cx="36" cy="36" r="30" stroke-dasharray="${CIRC}" stroke-dashoffset="${CIRC}"/></svg>`;
  const fill = el.querySelector('.ring-fill');
  return {
    el,
    set(f) { fill.style.strokeDashoffset = String(CIRC * (1 - Math.max(0, Math.min(1, f)))); },
    show() { el.classList.add('visible'); },
    hide() { el.classList.remove('visible'); },
  };
}

// Appui long générique (coin maison, écran de pause).
export function attachLongPress(el, { ring, onStart, onDone, duration = HOLD_MS, ringDelay = RING_DELAY_MS }) {
  let id = null;
  let t0 = 0;
  let sx = 0;
  let sy = 0;
  let raf = 0;
  let timer = 0;

  function finish(ok) {
    cancelAnimationFrame(raf);
    clearTimeout(timer);
    raf = 0;
    id = null;
    ring.hide();
    if (ok) onDone();
  }

  // L'anneau suit l'image ; la fin de l'appui dépend d'un minuteur exact.
  function frame() {
    const dt = performance.now() - t0;
    if (dt >= ringDelay) {
      ring.show();
      ring.set((dt - ringDelay) / (duration - ringDelay));
    }
    raf = requestAnimationFrame(frame);
  }

  el.addEventListener('pointerdown', (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (id !== null) return; // un seul doigt à la fois
    id = e.pointerId;
    sx = e.clientX;
    sy = e.clientY;
    t0 = performance.now();
    ring.set(0);
    try { el.setPointerCapture(id); } catch (_) { /* rien */ }
    if (onStart) onStart(e);
    raf = requestAnimationFrame(frame);
    timer = setTimeout(() => finish(true), duration);
  });
  el.addEventListener('pointermove', (e) => {
    if (e.pointerId === id && Math.hypot(e.clientX - sx, e.clientY - sy) > MOVE_TOLERANCE) finish(false);
  });
  const end = (e) => { if (e.pointerId === id) finish(false); };
  el.addEventListener('pointerup', end);
  el.addEventListener('pointercancel', end);
  el.addEventListener('lostpointercapture', end);
}

export function createHomeGuard(parent, { onHome }) {
  const zone = document.createElement('div');
  zone.className = 'corner';
  const ring = createRing();
  zone.append(ring.el);

  const button = document.createElement('div');
  button.className = 'home';
  button.innerHTML = HOUSE_SVG;
  parent.append(zone, button);

  let hideTimer = 0;
  let downId = null;

  function showButton() {
    button.classList.add('visible');
    clearTimeout(hideTimer);
    hideTimer = setTimeout(hideButton, BUTTON_MS);
  }

  function hideButton() {
    clearTimeout(hideTimer);
    button.classList.remove('visible');
    downId = null;
  }

  attachLongPress(zone, { ring, onDone: showButton });

  button.addEventListener('pointerdown', (e) => {
    e.preventDefault();
    e.stopPropagation();
    downId = e.pointerId;
  });
  button.addEventListener('pointerup', (e) => {
    if (e.pointerId !== downId || !button.classList.contains('visible')) return;
    hideButton();
    onHome();
  });

  return {
    enable() { zone.classList.add('active'); },
    disable() {
      zone.classList.remove('active');
      hideButton();
    },
  };
}
