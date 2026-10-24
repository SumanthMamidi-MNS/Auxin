'use client';

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

    // Grid configuration
    const cols = 28;
    const rows = 18;
    let time = 0;

    const render = () => {
      time += 0.015;
      ctx.clearRect(0, 0, width, height);

      const cellW = width / cols;
      const cellH = height / rows;

      // Sonar rings from center
      const centerX = width * 0.5;
      const centerY = height * 0.55;
      const maxRadius = Math.max(width, height) * 0.7;
      const ringInterval = 140;
      const ringOffset = (time * 25) % ringInterval;

      ctx.save();
      for (let r = ringOffset; r < maxRadius; r += ringInterval) {
        const alpha = Math.max(0, 1 - r / maxRadius) * 0.18;
        ctx.strokeStyle = `rgba(34, 197, 94, ${alpha})`;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.ellipse(centerX, centerY, r, r * 0.45, 0, 0, Math.PI * 2);
        ctx.stroke();
      }
      ctx.restore();

      // Topographic Mesh Lines
      ctx.lineWidth = 0.8;

      // Horizontal undulation lines
      for (let j = 0; j <= rows; j++) {
        ctx.beginPath();
        for (let i = 0; i <= cols; i++) {
          const x = i * cellW;
          const baseY = j * cellH;

          // Wave equation based on distance to center & cursor
          const distToCenter = Math.hypot(x - centerX, baseY - centerY);
          const wave = Math.sin(distToCenter * 0.015 - time * 1.5) * 12;

          let cursorPush = 0;
          if (isHovering) {
            const distToMouse = Math.hypot(x - mouseX, baseY - mouseY);
            if (distToMouse < 180) {
              cursorPush = (1 - distToMouse / 180) * 20;
            }
          }

          const y = baseY + wave - cursorPush;

          if (i === 0) {
            ctx.moveTo(x, y);
          } else {
            ctx.lineTo(x, y);
          }
        }
        ctx.strokeStyle = `rgba(34, 197, 94, ${0.04 + (j / rows) * 0.08})`;
        ctx.stroke();
      }

      // Vertical connecting lines
      for (let i = 0; i <= cols; i += 2) {
        ctx.beginPath();
        for (let j = 0; j <= rows; j++) {
          const x = i * cellW;
          const baseY = j * cellH;
          const distToCenter = Math.hypot(x - centerX, baseY - centerY);
          const wave = Math.sin(distToCenter * 0.015 - time * 1.5) * 12;
          const y = baseY + wave;

          if (j === 0) {
            ctx.moveTo(x, y);
          } else {
            ctx.lineTo(x, y);
          }
        }
        ctx.strokeStyle = 'rgba(34, 197, 94, 0.04)';
        ctx.stroke();
      }

      // Draw pulsating farm node beacons
      const farmNodes = [
        { col: 6, row: 8, label: 'Sohna Organic Orchards' },
        { col: 14, row: 10, label: 'Auxin Hub (0.0 km)' },
        { col: 21, row: 6, label: 'Aravalli Hydroponics' },
        { col: 18, row: 14, label: 'Badshahpur Greenhouses' },
      ];

      for (const node of farmNodes) {
        const nx = node.col * cellW;
        const baseY = node.row * cellH;
        const dist = Math.hypot(nx - centerX, baseY - centerY);
        const ny = baseY + Math.sin(dist * 0.015 - time * 1.5) * 12;

        const pulse = (Math.sin(time * 3 + node.col) + 1) * 0.5;

        // Glow ring
        ctx.fillStyle = `rgba(34, 197, 94, ${0.15 + pulse * 0.25})`;
        ctx.beginPath();
        ctx.arc(nx, ny, 6 + pulse * 6, 0, Math.PI * 2);
        ctx.fill();

        // Node center
        ctx.fillStyle = '#4ADE80';
        ctx.beginPath();
        ctx.arc(nx, ny, 2.5, 0, Math.PI * 2);
        ctx.fill();
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
      className="absolute inset-0 w-full h-full pointer-events-auto opacity-75 z-0"
    />
  );
}
