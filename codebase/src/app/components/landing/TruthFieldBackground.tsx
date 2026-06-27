"use client";

import { useEffect, useRef } from "react";

type TruthFieldBackgroundProps = {
  className?: string;
  intensity?: "quiet" | "standard";
};

export function TruthFieldBackground({
  className = "",
  intensity = "standard",
}: TruthFieldBackgroundProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }

    const context = canvas.getContext("2d", { alpha: true });
    if (!context) {
      return;
    }

    const reducedMotionQuery = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    );
    let frameId = 0;
    let width = 0;
    let height = 0;
    let pointerX = 0.68;
    let pointerY = 0.36;

    const syncSize = () => {
      const rect = canvas.getBoundingClientRect();
      const pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
      width = Math.max(Math.floor(rect.width), 1);
      height = Math.max(Math.floor(rect.height), 1);
      canvas.width = Math.floor(width * pixelRatio);
      canvas.height = Math.floor(height * pixelRatio);
      context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
    };

    const draw = (time = 0) => {
      const still = reducedMotionQuery.matches;
      const t = still ? 0.18 : time * 0.00012;
      const fieldStrength = intensity === "quiet" ? 0.58 : 1;

      context.clearRect(0, 0, width, height);

      const wash = context.createLinearGradient(0, 0, width, height);
      wash.addColorStop(0, "rgba(255,255,255,0.96)");
      wash.addColorStop(0.5, "rgba(247,249,251,0.86)");
      wash.addColorStop(1, "rgba(255,240,232,0.72)");
      context.fillStyle = wash;
      context.fillRect(0, 0, width, height);

      const gridSize = Math.max(34, Math.min(width, height) / 13);
      context.lineWidth = 1;
      context.strokeStyle = "rgba(25, 28, 30, 0.055)";

      for (let x = -gridSize; x < width + gridSize; x += gridSize) {
        const drift = Math.sin(x * 0.012 + t * 2.3) * 7 * fieldStrength;
        context.beginPath();
        context.moveTo(x + drift, 0);
        context.lineTo(x - drift * 0.6, height);
        context.stroke();
      }

      for (let y = -gridSize; y < height + gridSize; y += gridSize) {
        const drift = Math.cos(y * 0.01 - t * 2.1) * 6 * fieldStrength;
        context.beginPath();
        context.moveTo(0, y + drift);
        context.lineTo(width, y - drift * 0.7);
        context.stroke();
      }

      const lanes = [
        { y: 0.22, phase: 0, color: "rgba(255, 106, 0, 0.32)" },
        { y: 0.4, phase: 1.7, color: "rgba(0, 98, 161, 0.16)" },
        { y: 0.58, phase: 3.3, color: "rgba(160, 65, 0, 0.2)" },
        { y: 0.72, phase: 4.9, color: "rgba(8, 122, 83, 0.14)" },
      ];

      lanes.forEach((lane, laneIndex) => {
        context.beginPath();
        for (let x = -20; x <= width + 20; x += 12) {
          const normalizedX = x / Math.max(width, 1);
          const pulse =
            Math.sin(normalizedX * 8 + lane.phase + t * 16) *
              18 *
              fieldStrength +
            Math.cos(normalizedX * 17 - lane.phase + t * 11) *
              6 *
              fieldStrength;
          const pointerPull =
            Math.max(0, 1 - Math.abs(normalizedX - pointerX) * 3.1) *
            Math.sin(pointerY * 4 + lane.phase) *
            10 *
            fieldStrength;
          const y = height * lane.y + pulse + pointerPull;

          if (x === -20) {
            context.moveTo(x, y);
          } else {
            context.lineTo(x, y);
          }
        }

        context.lineWidth = laneIndex === 0 ? 1.6 : 1.2;
        context.strokeStyle = lane.color;
        context.stroke();
      });

      for (let index = 0; index < 34; index += 1) {
        const baseX = ((index * 97 + t * 2600) % (width + 120)) - 60;
        const baseY =
          height *
          (0.18 + ((Math.sin(index * 1.9) + 1) / 2) * 0.64);
        const wave = Math.sin(baseX * 0.014 + index + t * 18) * 18;
        const radius = index % 7 === 0 ? 2.4 : 1.5;

        context.beginPath();
        context.arc(baseX, baseY + wave, radius, 0, Math.PI * 2);
        context.fillStyle =
          index % 7 === 0
            ? "rgba(255, 106, 0, 0.42)"
            : "rgba(86, 94, 116, 0.22)";
        context.fill();
      }

      const focus = context.createRadialGradient(
        width * pointerX,
        height * pointerY,
        0,
        width * pointerX,
        height * pointerY,
        Math.max(width, height) * 0.52,
      );
      focus.addColorStop(0, "rgba(255, 106, 0, 0.18)");
      focus.addColorStop(0.38, "rgba(255, 182, 147, 0.08)");
      focus.addColorStop(1, "rgba(255, 255, 255, 0)");
      context.fillStyle = focus;
      context.fillRect(0, 0, width, height);

      if (!still) {
        frameId = window.requestAnimationFrame(draw);
      }
    };

    const handlePointerMove = (event: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      pointerX = (event.clientX - rect.left) / Math.max(rect.width, 1);
      pointerY = (event.clientY - rect.top) / Math.max(rect.height, 1);
    };

    const handleMotionPreferenceChange = () => {
      window.cancelAnimationFrame(frameId);
      draw();
    };

    const resizeObserver = new ResizeObserver(() => {
      syncSize();
      draw();
    });

    syncSize();
    resizeObserver.observe(canvas);
    window.addEventListener("pointermove", handlePointerMove);
    reducedMotionQuery.addEventListener("change", handleMotionPreferenceChange);
    draw();

    return () => {
      window.cancelAnimationFrame(frameId);
      resizeObserver.disconnect();
      window.removeEventListener("pointermove", handlePointerMove);
      reducedMotionQuery.removeEventListener(
        "change",
        handleMotionPreferenceChange,
      );
    };
  }, [intensity]);

  return (
    <div
      aria-hidden="true"
      className={`pointer-events-none absolute inset-0 overflow-hidden ${className}`}
    >
      <canvas ref={canvasRef} className="h-full w-full" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_20%,rgba(255,255,255,0.28),transparent_42%),linear-gradient(180deg,rgba(247,249,251,0.1),#f7f9fb_94%)]" />
      <div className="absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-[#f7f9fb] to-transparent" />
    </div>
  );
}
