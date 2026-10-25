'use client';

/**
 * auxin-landing/src/components/hero/TopoMeshCanvas.tsx
 * ============================================================================
 * AUXIN V3.5 — ORGANIC CARTOGRAPHY TOPOGRAPHIC MESH CANVAS
 * 
 * Elegant golden & forest undulation contours on warm cream background:
 * - Subtle 60 FPS organic wave physics
 * - Interactive mouse repulsion ripple
 * - Radial harvest rings with soft falloff
 * ============================================================================
 */

import React, { useEffect, useRef } from 'react';

export function TopoMeshCanvas() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = canvas.parentElement?.clientWidth || window.innerWidth);
    let height = (canvas.height = canvas.parentElement?.clientHeight || 650);

    const handleResize = () => {
      if (!canvas || !canvas.parentElement) return;
      width = canvas.width = canvas.parentElement.clientWidth;
      height = canvas.height = canvas.parentElement.clientHeight;
    };
    window.addEventListener('resize', handleResize);

    let mouseX = width / 2;
    let mouseY = height / 2;
    let isHovering = false;

    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      mouseX = e.clientX - rect.left;
      mouseY = e.clientY - rect.top;
      isHovering = true;
    };

    const handleMouseLeave = () => {
      isHovering = false;
    };

    canvas.addEventListener('mousemove', handleMouseMove);
    canvas.addEventListener('mouseleave', handleMouseLeave);

    const cols = 26;
    const rows = 16;
    let time = 0;

    const render = () => {
      time += 0.012;
      ctx.clearRect(0, 0, width, height);

      const cellW = width / cols;
      const cellH = height / rows;

      const centerX = width * 0.55;
      const centerY = height * 0.5;
      const maxRadius = Math.max(width, height) * 0.65;
      const ringInterval = 130;
      const ringOffset = (time * 20) % ringInterval;

      // Concentric harvest ripples in subtle gold
      ctx.save();
      for (let r = ringOffset; r < maxRadius; r += ringInterval) {
        const alpha = Math.max(0, 1 - r / maxRadius) * 0.08;
        ctx.strokeStyle = `rgba(212, 175, 55, ${alpha})`;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.ellipse(centerX, centerY, r, r * 0.45, 0, 0, Math.PI * 2);
        ctx.stroke();
      }
      ctx.restore();

      // Horizontal undulation lines in warm pine & earth
      ctx.lineWidth = 0.8;
      for (let j = 0; j <= rows; j++) {
        ctx.beginPath();
        for (let i = 0; i <= cols; i++) {
          const x = i * cellW;
          const baseY = j * cellH;

          const distToCenter = Math.hypot(x - centerX, baseY - centerY);
          const wave = Math.sin(distToCenter * 0.012 - time * 1.2) * 10;

          let cursorPush = 0;
          if (isHovering) {
            const distToMouse = Math.hypot(x - mouseX, baseY - mouseY);
            if (distToMouse < 160) {
              cursorPush = (1 - distToMouse / 160) * 16;
            }
          }

          const y = baseY + wave - cursorPush;

          if (i === 0) {
            ctx.moveTo(x, y);
          } else {
            ctx.lineTo(x, y);
          }
        }
        // Subtle forest pine contours
        const alpha = 0.03 + (j / rows) * 0.05;
        ctx.strokeStyle = `rgba(27, 67, 50, ${alpha})`;
        ctx.stroke();
      }

      // Vertical connecting contours
      for (let i = 0; i <= cols; i += 3) {
        ctx.beginPath();
        for (let j = 0; j <= rows; j++) {
          const x = i * cellW;
          const baseY = j * cellH;
          const distToCenter = Math.hypot(x - centerX, baseY - centerY);
          const wave = Math.sin(distToCenter * 0.012 - time * 1.2) * 10;
          const y = baseY + wave;

          if (j === 0) {
            ctx.moveTo(x, y);
          } else {
            ctx.lineTo(x, y);
          }
        }
        ctx.strokeStyle = `rgba(212, 175, 55, 0.025)`;
        ctx.stroke();
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', handleResize);
      canvas.removeEventListener('mousemove', handleMouseMove);
      canvas.removeEventListener('mouseleave', handleMouseLeave);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full pointer-events-auto opacity-70 z-0"
    />
  );
}
