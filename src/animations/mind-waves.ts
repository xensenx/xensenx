type BubbleMode = { k: number; amplitude: number; speed: number; phase: number; direction: number };
type Bubble = {
  x: number; y: number; radius: number; phase: number;
  driftX: number; driftY: number; periodX: number; periodY: number;
  strokeAlpha: number; fillAlpha: number; modes: BubbleMode[];
};
type BubbleMotion = {
  x: number; y: number; vx: number; vy: number;
  contour: number[]; contourVelocity: number[];
  nextContour: number[]; nextContourVelocity: number[];
};
type Point = { x: number; y: number };
const POINT_COUNT = 64;

const bubbleSettings: Omit<Bubble, 'x' | 'y' | 'radius'>[] = [
  { phase: 0.3, driftX: 18, driftY: 15, periodX: 20_000, periodY: 24_000, strokeAlpha: 0.43, fillAlpha: 0.13, modes: [
    { k: 2, amplitude: 0.04, speed: 0.00042, direction: 1, phase: 0.4 },
    { k: 3, amplitude: 0.022, speed: 0.00062, direction: -1, phase: 1.8 },
    { k: 4, amplitude: 0.01, speed: 0.00088, direction: 1, phase: 3.1 },
    { k: 5, amplitude: 0.0045, speed: 0.00118, direction: -1, phase: 4.5 },
  ] },
  { phase: 1.1, driftX: 14, driftY: 12, periodX: 18_000, periodY: 21_000, strokeAlpha: 0.39, fillAlpha: 0.115, modes: [
    { k: 2, amplitude: 0.045, speed: 0.00052, direction: -1, phase: 1.2 },
    { k: 3, amplitude: 0.023, speed: 0.00078, direction: 1, phase: 2.7 },
    { k: 4, amplitude: 0.011, speed: 0.0011, direction: -1, phase: 0.6 },
  ] },
  { phase: 2.6, driftX: 12, driftY: 13, periodX: 22_000, periodY: 18_000, strokeAlpha: 0.35, fillAlpha: 0.1, modes: [
    { k: 2, amplitude: 0.041, speed: 0.0006, direction: 1, phase: 3.5 },
    { k: 3, amplitude: 0.021, speed: 0.00092, direction: -1, phase: 0.9 },
    { k: 4, amplitude: 0.009, speed: 0.0013, direction: 1, phase: 4.2 },
  ] },
  { phase: 4.4, driftX: 9, driftY: 10, periodX: 16_000, periodY: 19_000, strokeAlpha: 0.31, fillAlpha: 0.085, modes: [
    { k: 2, amplitude: 0.046, speed: 0.0008, direction: -1, phase: 2.2 },
    { k: 3, amplitude: 0.024, speed: 0.0012, direction: 1, phase: 4.8 },
  ] },
  { phase: 5.7, driftX: 7, driftY: 7, periodX: 14_000, periodY: 16_000, strokeAlpha: 0.27, fillAlpha: 0.07, modes: [
    { k: 2, amplitude: 0.043, speed: 0.001, direction: 1, phase: 1.6 },
    { k: 3, amplitude: 0.02, speed: 0.00145, direction: -1, phase: 3.3 },
  ] },
];

const motes = [
  [0.44, 0.32, 1.3, 0.00028, 0.8, 16, 12], [0.68, 0.19, 1.1, 0.00034, 2.1, 12, 15],
  [0.82, 0.45, 1.6, 0.00024, 4.3, 18, 14], [0.52, 0.58, 1, 0.00038, 1.5, 14, 10],
  [0.36, 0.48, 1.4, 0.00026, 3.7, 20, 16], [0.74, 0.78, 1.2, 0.00031, 5.2, 15, 13],
  [0.6, 0.82, 1.5, 0.00022, 0.3, 17, 15], [0.86, 0.62, 0.9, 0.00042, 2.9, 11, 9],
] as const;

const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));
const colorWithAlpha = (color: string, alpha: number) => `rgba(${color}, ${clamp(alpha, 0, 1).toFixed(3)})`;

function traceBubble(ctx: CanvasRenderingContext2D, points: Point[]) {
  if (points.length < 3) return;
  ctx.beginPath();
  const first = points[0];
  const last = points[points.length - 1];
  ctx.moveTo((first.x + last.x) / 2, (first.y + last.y) / 2);
  for (let i = 0; i < points.length; i++) {
    const point = points[i];
    const next = points[(i + 1) % points.length];
    ctx.quadraticCurveTo(point.x, point.y, (point.x + next.x) / 2, (point.y + next.y) / 2);
  }
  ctx.closePath();
}

/** Restores the site's slow, glassy liquid bubbles on the home canvas. */
export function initMindWaves(canvas: HTMLCanvasElement, wrap: HTMLElement): () => void {
  const ctx = canvas.getContext('2d');
  if (!ctx) return () => undefined;

  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  let width = 0;
  let height = 0;
  let dpr = 1;
  let frame = 0;
  let running = false;
  let intersecting = true;
  let pointer = { x: -1000, y: -1000, currentX: -1000, currentY: -1000, strength: 0 };
  let lastFrame = 0;
  let lastScroll = window.scrollY;
  let scrollImpulse = 0;

  const resize = () => {
    const rect = wrap.getBoundingClientRect();
    width = rect.width;
    height = rect.height;
    dpr = Math.min(window.devicePixelRatio || 1, 1.6);
    canvas.width = Math.max(1, Math.round(width * dpr));
    canvas.height = Math.max(1, Math.round(height * dpr));
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  };

  const settings = [
    { x: 0.54, y: 0.43, radius: 0.137, min: 58, max: 86 },
    { x: 0.77, y: 0.25, radius: 0.081, min: 34, max: 50 },
    { x: 0.38, y: 0.69, radius: 0.062, min: 26, max: 38 },
    { x: 0.72, y: 0.67, radius: 0.037, min: 15, max: 24 },
    { x: 0.63, y: 0.15, radius: 0.020, min: 8, max: 12 },
  ];
  const motion: BubbleMotion[] = settings.map(() => ({
    x: 0,
    y: 0,
    vx: 0,
    vy: 0,
    contour: Array(POINT_COUNT).fill(0),
    contourVelocity: Array(POINT_COUNT).fill(0),
    nextContour: Array(POINT_COUNT).fill(0),
    nextContourVelocity: Array(POINT_COUNT).fill(0),
  }));

  const drawBubble = (bubble: (typeof bubbleSettings)[number], config: (typeof settings)[number], physics: BubbleMotion, time: number, delta: number) => {
    const minSide = Math.min(width, height);
    const radius = clamp(minSide * config.radius, config.min, config.max);
    const driftX = Math.sin(time / bubble.periodX + bubble.phase) * bubble.driftX;
    const driftY = Math.sin(time / bubble.periodY + bubble.phase * 1.7) * bubble.driftY;
    const baseX = config.x * width + driftX + physics.x;
    const baseY = config.y * height + driftY + physics.y;
    const dx = baseX - pointer.currentX;
    const dy = baseY - pointer.currentY;
    const distance = Math.hypot(dx, dy);
    const proximity = clamp(1 - distance / (radius * 3), 0, 1) * pointer.strength;
    const x = baseX - (distance ? dx / distance : 0) * proximity * 15;
    const y = baseY - (distance ? dy / distance : 0) * proximity * 12;
    const points: Point[] = [];
    const speed = Math.hypot(physics.vx, physics.vy);
    const flow = clamp(speed / 120, 0, 1);
    const flowAngle = Math.atan2(physics.vy, physics.vx);

    for (let i = 0; i < POINT_COUNT; i++) {
      const angle = (i / POINT_COUNT) * Math.PI * 2;
      const relativeAngle = angle - flowAngle;
      const currentContour = physics.contour[i];
      const previousContour = physics.contour[(i + POINT_COUNT - 1) % POINT_COUNT];
      const nextContour = physics.contour[(i + 1) % POINT_COUNT];
      const springTarget = radius * flow * (
        0.13 * Math.cos(relativeAngle * 2) +
        0.055 * Math.cos(relativeAngle) +
        0.025 * Math.sin(relativeAngle * 3 + time * 0.0012)
      );
      const neighborTension = (previousContour + nextContour - currentContour * 2) * 16;
      const acceleration = (springTarget - currentContour) * 42 + neighborTension - physics.contourVelocity[i] * 10;
      const contourVelocity = clamp(physics.contourVelocity[i] + acceleration * delta, -radius * 4, radius * 4);
      const contour = clamp(currentContour + contourVelocity * delta, -radius * 0.24, radius * 0.24);
      physics.nextContour[i] = contour;
      physics.nextContourVelocity[i] = contourVelocity;

      let wave = 0;
      for (const mode of bubble.modes) {
        wave += mode.amplitude * Math.sin(mode.k * angle + time * mode.speed * mode.direction + mode.phase);
      }
      const cursorShape = proximity * 0.025 * Math.cos(angle - Math.atan2(dy, dx));
      const r = radius * (1 + wave + cursorShape) + contour;
      points.push({ x: x + Math.cos(angle) * r, y: y + Math.sin(angle) * r });
    }
    const previousContour = physics.contour;
    physics.contour = physics.nextContour;
    physics.nextContour = previousContour;
    const previousContourVelocity = physics.contourVelocity;
    physics.contourVelocity = physics.nextContourVelocity;
    physics.nextContourVelocity = previousContourVelocity;

    const highlightColor = '91, 135, 181';
    const highlight = ctx.createRadialGradient(x - radius * 0.12, y - radius * 0.14, radius * 0.05, x - radius * 0.12, y - radius * 0.14, radius * 0.52);
    highlight.addColorStop(0, colorWithAlpha(highlightColor, bubble.fillAlpha));
    highlight.addColorStop(0.42, colorWithAlpha(highlightColor, bubble.fillAlpha * 0.48));
    highlight.addColorStop(1, colorWithAlpha(highlightColor, 0));
    ctx.save();
    traceBubble(ctx, points);
    ctx.clip();
    ctx.fillStyle = highlight;
    ctx.fillRect(x - radius, y - radius, radius * 2, radius * 2);
    ctx.restore();

    traceBubble(ctx, points);
    ctx.strokeStyle = colorWithAlpha('57, 105, 153', bubble.strokeAlpha * 0.86);
    ctx.lineWidth = radius > 60 ? 0.85 : 0.6;
    ctx.shadowBlur = 0;
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(points[36].x, points[36].y);
    for (let i = 37; i <= 49; i++) ctx.lineTo(points[i].x, points[i].y);
    ctx.strokeStyle = colorWithAlpha('108, 150, 192', bubble.strokeAlpha * 0.3);
    ctx.lineWidth = 0.75;
    ctx.stroke();
  };

  const draw = (time: number, delta: number) => {
    if (!ctx || !width || !height) return;
    ctx.clearRect(0, 0, width, height);
    const scrollKick = clamp(scrollImpulse, -48, 48);
    scrollImpulse = 0;
    motion.forEach((body, index) => {
      const response = 2.2 + index * 0.22;
      body.vy += scrollKick * response;
      body.vx += scrollKick * Math.sin(index * 1.7 + 0.6) * 0.3;
      const spring = 7 + index * 0.9;
      body.vx -= body.x * spring * delta;
      body.vy -= body.y * spring * delta;
      const drag = Math.exp(-(3.2 + index * 0.2) * delta);
      body.vx = clamp(body.vx * drag, -300, 300);
      body.vy = clamp(body.vy * drag, -300, 300);
      body.x = clamp(body.x + body.vx * delta, -24, 24);
      body.y = clamp(body.y + body.vy * delta, -48, 48);
    });
    pointer.strength += ((pointer.x > -500 ? 1 : 0) - pointer.strength) * (1 - Math.exp(-5 * delta));
    pointer.currentX += (pointer.x - pointer.currentX) * (1 - Math.exp(-8 * delta));
    pointer.currentY += (pointer.y - pointer.currentY) * (1 - Math.exp(-8 * delta));
    settings.forEach((config, index) => drawBubble(bubbleSettings[index], config, motion[index], time, delta));
    for (const [relX, relY, radius, speed, phase, orbitX, orbitY] of motes) {
      const x = width * relX + Math.cos(time * speed + phase) * orbitX;
      const y = height * relY + Math.sin(time * speed * 0.85 + phase) * orbitY;
      const alpha = 0.1 * (0.75 + Math.sin(time * 0.0009 + phase) * 0.25);
      const color = '88, 166, 255';
      ctx.beginPath();
      ctx.arc(x, y, radius * 2, 0, Math.PI * 2);
      ctx.fillStyle = colorWithAlpha(color, alpha * 0.25);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, Math.PI * 2);
      ctx.fillStyle = colorWithAlpha(color, alpha);
      ctx.fill();
    }
  };

  const loop = (timestamp: number) => {
    if (!running) return;
    const delta = lastFrame ? clamp((timestamp - lastFrame) / 1000, 0.001, 0.064) : 0.016;
    lastFrame = timestamp;
    draw(timestamp, delta);
    frame = requestAnimationFrame(loop);
  };
  const start = () => {
    if (running || !intersecting || document.hidden) return;
    if (reducedMotion) { draw(2500, 0.016); return; }
    running = true;
    lastFrame = 0;
    frame = requestAnimationFrame(loop);
  };
  const stop = () => { running = false; cancelAnimationFrame(frame); };
  const onPointerMove = (event: PointerEvent) => {
    const rect = wrap.getBoundingClientRect();
    pointer.x = event.clientX - rect.left;
    pointer.y = event.clientY - rect.top;
  };
  const onScroll = () => {
    const current = window.scrollY;
    scrollImpulse += current - lastScroll;
    lastScroll = current;
  };
  const onVisibility = () => document.hidden ? stop() : start();

  resize();
  start();
  window.addEventListener('resize', resize, { passive: true });
  window.addEventListener('pointermove', onPointerMove, { passive: true });
  window.addEventListener('scroll', onScroll, { passive: true });
  document.addEventListener('visibilitychange', onVisibility);
  const resizeObserver = typeof ResizeObserver === 'undefined' ? undefined : new ResizeObserver(resize);
  resizeObserver?.observe(wrap);
  const intersectionObserver = typeof IntersectionObserver === 'undefined' ? undefined : new IntersectionObserver(([entry]) => {
    intersecting = entry.isIntersecting;
    if (intersecting) start(); else stop();
  });
  intersectionObserver?.observe(wrap);

  return () => {
    stop();
    resizeObserver?.disconnect();
    intersectionObserver?.disconnect();
    window.removeEventListener('resize', resize);
    window.removeEventListener('pointermove', onPointerMove);
    window.removeEventListener('scroll', onScroll);
    document.removeEventListener('visibilitychange', onVisibility);
  };
}
