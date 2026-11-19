type Point = { x: number; y: number };
type Node = { x: number; y: number; radius: number; phase: number };
type Drop = { fromA: boolean; progress: number; speed: number; radius: number };
type Ripple = { x: number; y: number; radius: number; alpha: number };

const colorWithAlpha = (color: string, alpha: number) => `rgba(${color}, ${Math.max(0, Math.min(1, alpha)).toFixed(3)})`;

/** Draws the original paired water nodes and their drifting liquid thread. */
export function initContactFlow(host: HTMLElement, canvas: HTMLCanvasElement): () => void {
  const ctx = canvas.getContext('2d');
  if (!ctx) return () => undefined;

  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const nodeA: Node = { x: 0, y: 0, radius: 30, phase: Math.random() * Math.PI * 2 };
  const nodeB: Node = { x: 0, y: 0, radius: 22, phase: Math.random() * Math.PI * 2 };
  const drops: Drop[] = [];
  const ripples: Ripple[] = [];
  let width = 0;
  let height = 0;
  let dpr = 1;
  let frame = 0;
  let running = false;
  let intersecting = true;
  let lastFrame = 0;
  let nextDrop = 900;
  let nextDropFromA = true;

  const positionNodes = () => {
    nodeA.x = width * 0.74; nodeA.y = height * 0.4;
    nodeB.x = width * 0.96; nodeB.y = height * 0.62;
  };
  const resize = () => {
    const rect = host.getBoundingClientRect();
    width = rect.width;
    height = rect.height;
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.max(1, Math.round(width * dpr));
    canvas.height = Math.max(1, Math.round(height * dpr));
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    positionNodes();
  };
  const nodePosition = (node: Node, time: number): Point => ({
    x: node.x + Math.sin(time * 0.00023 + node.phase) * 9,
    y: node.y + Math.sin(time * 0.00031 + node.phase * 1.7) * 13,
  });
  const threadPoint = (progress: number, time: number, tension: number): Point => {
    const a = nodePosition(nodeA, time);
    const b = nodePosition(nodeB, time);
    const x = a.x + (b.x - a.x) * progress;
    const y = a.y + (b.y - a.y) * progress;
    const bow = Math.sin(progress * Math.PI) * (10 + (1 - tension) * 40);
    const shimmer = Math.sin(time * 0.0009 + progress * 9) * 2.2;
    return { x, y: y + bow + shimmer };
  };
  const drawNode = (point: Point, radius: number, time: number, color: string) => {
    const breathe = 1 + 0.06 * Math.sin(time * 0.0012 + point.x * 0.01);
    const haze = ctx.createRadialGradient(point.x, point.y, 0, point.x, point.y, radius * 3.1);
    haze.addColorStop(0, colorWithAlpha(color, 0.11));
    haze.addColorStop(0.6, colorWithAlpha(color, 0.035));
    haze.addColorStop(1, colorWithAlpha(color, 0));
    ctx.beginPath(); ctx.arc(point.x, point.y, radius * 3.1, 0, Math.PI * 2);
    ctx.fillStyle = haze; ctx.fill();

    const ball = ctx.createRadialGradient(point.x - radius * 0.35, point.y - radius * 0.35, radius * 0.1, point.x, point.y, radius * breathe);
    ball.addColorStop(0, colorWithAlpha(color, 0.78));
    ball.addColorStop(0.45, colorWithAlpha(color, 0.2));
    ball.addColorStop(1, colorWithAlpha(color, 0.025));
    ctx.beginPath(); ctx.arc(point.x, point.y, radius * breathe, 0, Math.PI * 2);
    ctx.fillStyle = ball; ctx.fill();
    ctx.strokeStyle = colorWithAlpha(color, 0.38); ctx.lineWidth = 1; ctx.stroke();
    ctx.beginPath(); ctx.arc(point.x - radius * 0.38, point.y - radius * 0.38, radius * 0.12, 0, Math.PI * 2);
    ctx.fillStyle = colorWithAlpha(color, 0.86); ctx.fill();
  };

  const draw = (time: number, delta: number) => {
    if (!width || !height) return;
    const color = '88, 166, 255';
    ctx.clearRect(0, 0, width, height);
    const pointA = nodePosition(nodeA, time);
    const pointB = nodePosition(nodeB, time);
    const tension = (0.5 + 0.5 * Math.sin(time * 0.00008)) * 0.62 + (0.5 + 0.5 * Math.sin(time * 0.00023 + 2)) * 0.38;

    if (time > nextDrop && drops.length < 4 && !document.hidden) {
      drops.push({ fromA: nextDropFromA, progress: 0, speed: 0.00016 + Math.random() * 0.00011, radius: 1.6 + Math.random() * 1.4 });
      nextDropFromA = !nextDropFromA;
      nextDrop = time + 2600 + Math.random() * 3400;
    }

    ctx.lineCap = 'round';
    let previous = threadPoint(0, time, tension);
    for (let i = 1; i <= 34; i++) {
      const progress = i / 34;
      const point = threadPoint(progress, time, tension);
      const envelope = Math.sin(progress * Math.PI);
      const alpha = (0.3 + 0.32 * tension) * envelope + 0.06;
      const gradient = ctx.createLinearGradient(previous.x, previous.y, point.x, point.y);
      gradient.addColorStop(0, colorWithAlpha(color, alpha * 0.7));
      gradient.addColorStop(0.5, colorWithAlpha(color, Math.min(0.9, alpha + 0.15)));
      gradient.addColorStop(1, colorWithAlpha(color, alpha * 0.7));
      ctx.strokeStyle = gradient;
      ctx.lineWidth = (0.8 + 1.1 * tension) * envelope + 0.35;
      ctx.beginPath(); ctx.moveTo(previous.x, previous.y); ctx.lineTo(point.x, point.y); ctx.stroke();
      previous = point;
    }

    for (let i = drops.length - 1; i >= 0; i--) {
      const drop = drops[i];
      drop.progress += drop.speed * delta * 1000;
      if (drop.progress >= 1) {
        const end = drop.fromA ? pointB : pointA;
        ripples.push({ x: end.x, y: end.y, radius: 2, alpha: 0.35 });
        drops.splice(i, 1);
        continue;
      }
      const pathProgress = drop.fromA ? drop.progress : 1 - drop.progress;
      const point = threadPoint(pathProgress, time, tension);
      ctx.beginPath(); ctx.arc(point.x, point.y, drop.radius, 0, Math.PI * 2);
      ctx.fillStyle = colorWithAlpha(color, 0.88); ctx.fill();
      const tailProgress = drop.fromA
        ? Math.max(0, drop.progress - 0.06)
        : 1 - Math.max(0, drop.progress - 0.06);
      const tail = threadPoint(tailProgress, time, tension);
      ctx.beginPath(); ctx.moveTo(tail.x, tail.y); ctx.lineTo(point.x, point.y);
      ctx.strokeStyle = colorWithAlpha(color, 0.3); ctx.lineWidth = 1; ctx.stroke();
    }

    for (let i = ripples.length - 1; i >= 0; i--) {
      const ripple = ripples[i];
      ripple.radius += 0.55 * (delta * 60);
      ripple.alpha *= Math.pow(0.96, delta * 60);
      if (ripple.alpha < 0.01) { ripples.splice(i, 1); continue; }
      ctx.beginPath(); ctx.arc(ripple.x, ripple.y, ripple.radius, 0, Math.PI * 2);
      ctx.strokeStyle = colorWithAlpha(color, ripple.alpha); ctx.lineWidth = 1; ctx.stroke();
    }

    drawNode(pointA, nodeA.radius, time, color);
    drawNode(pointB, nodeB.radius, time, color);
  };

  const loop = (timestamp: number) => {
    if (!running) return;
    const delta = lastFrame ? Math.min((timestamp - lastFrame) / 1000, 0.05) : 0.016;
    lastFrame = timestamp;
    draw(timestamp, delta);
    frame = requestAnimationFrame(loop);
  };
  const start = () => {
    if (running || !intersecting || document.hidden || window.innerWidth < 1000) return;
    if (reducedMotion) { draw(2500, 0.016); return; }
    running = true;
    lastFrame = 0;
    frame = requestAnimationFrame(loop);
  };
  const stop = () => { running = false; cancelAnimationFrame(frame); };
  const onVisibility = () => document.hidden ? stop() : start();
  const onResize = () => { resize(); if (window.innerWidth < 1000) stop(); else start(); };

  resize();
  start();
  window.addEventListener('resize', onResize, { passive: true });
  document.addEventListener('visibilitychange', onVisibility);
  const resizeObserver = typeof ResizeObserver === 'undefined' ? undefined : new ResizeObserver(resize);
  resizeObserver?.observe(host);
  const intersectionObserver = typeof IntersectionObserver === 'undefined' ? undefined : new IntersectionObserver(([entry]) => {
    intersecting = entry.isIntersecting;
    if (intersecting) start(); else stop();
  }, { threshold: 0.01 });
  intersectionObserver?.observe(host);

  return () => {
    stop();
    resizeObserver?.disconnect();
    intersectionObserver?.disconnect();
    window.removeEventListener('resize', onResize);
    document.removeEventListener('visibilitychange', onVisibility);
  };
}
