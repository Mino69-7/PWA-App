// Petits effets visuels partagés (DOM).

// Ondulation douce à l'endroit touché : la réaction quand on tape « à côté ».
export function ripple(host, x, y, color = '#E8DDCF', size = 150) {
  const d = document.createElement('div');
  d.className = 'ripple';
  d.style.cssText = `left:${x - size / 2}px;top:${y - size / 2}px;width:${size}px;height:${size}px;background:${color}`;
  d.addEventListener('animationend', () => d.remove(), { once: true });
  host.append(d);
  setTimeout(() => d.remove(), 1500);
}

// Relance une animation CSS de classe même si elle est déjà présente.
export function replay(el, className) {
  el.classList.remove(className);
  void el.offsetWidth;
  el.classList.add(className);
}

export function shuffle(list) {
  for (let i = list.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [list[i], list[j]] = [list[j], list[i]];
  }
  return list;
}

export function clamp(v, min, max) {
  return Math.max(min, Math.min(max, v));
}
