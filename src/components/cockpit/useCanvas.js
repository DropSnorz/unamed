import { onBeforeUnmount, onMounted } from 'vue';

/**
 * Drives a canvas with requestAnimationFrame, keeping it sharp on HiDPI screens.
 * `draw(ctx, width, height, dt, time)` receives CSS pixel dimensions, the frame
 * delta and the elapsed time, in seconds. `resize(width, height)` is optional.
 */
export function useCanvas(canvasRef, draw, resize) {
  let frame = 0;
  let last = 0;
  let width = 0;
  let height = 0;
  let observer = null;

  function fit() {
    const canvas = canvasRef.value;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    width = Math.max(1, Math.round(rect.width));
    height = Math.max(1, Math.round(rect.height));
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    canvas.getContext('2d').setTransform(dpr, 0, 0, dpr, 0, 0);
    resize?.(width, height);
  }

  function loop(now) {
    const dt = last ? Math.min(0.1, (now - last) / 1000) : 0;
    last = now;
    const canvas = canvasRef.value;
    if (canvas && width && height) draw(canvas.getContext('2d'), width, height, dt, now / 1000);
    frame = requestAnimationFrame(loop);
  }

  onMounted(() => {
    observer = new ResizeObserver(fit);
    observer.observe(canvasRef.value);
    fit();
    frame = requestAnimationFrame(loop);
  });

  onBeforeUnmount(() => {
    cancelAnimationFrame(frame);
    observer?.disconnect();
  });
}
