'use client';

import React, { useRef, useEffect, useCallback } from 'react';

// =============================================================================
// TYPES
// =============================================================================

export interface OverlayElement {
  id: string;
  type: 'circle' | 'arrow' | 'box' | 'text' | 'pulse' | 'path' | 'click_indicator';
  x: number;
  y: number;
  width?: number;
  height?: number;
  end_x?: number;
  end_y?: number;
  color: string;
  label?: string;
  animation?: string;
  duration_ms?: number;
}

interface NavigatorCanvasProps {
  overlays: OverlayElement[];
  videoWidth: number;
  videoHeight: number;
  containerRef: React.RefObject<HTMLDivElement>;
}

// =============================================================================
// COMPONENT
// =============================================================================

export default function NavigatorCanvas({
  overlays,
  videoWidth,
  videoHeight,
  containerRef
}: NavigatorCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameRef = useRef<number>();

  const getScaleFactor = useCallback(() => {
    if (!containerRef.current) return { scaleX: 1, scaleY: 1, offsetX: 0, offsetY: 0 };

    const container = containerRef.current;
    const containerWidth = container.clientWidth;
    const containerHeight = container.clientHeight;

    const videoAspect = videoWidth / videoHeight;
    const containerAspect = containerWidth / containerHeight;

    let displayWidth, displayHeight, offsetX, offsetY;

    if (containerAspect > videoAspect) {
      displayHeight = containerHeight;
      displayWidth = displayHeight * videoAspect;
      offsetX = (containerWidth - displayWidth) / 2;
      offsetY = 0;
    } else {
      displayWidth = containerWidth;
      displayHeight = displayWidth / videoAspect;
      offsetX = 0;
      offsetY = (containerHeight - displayHeight) / 2;
    }

    return { scaleX: displayWidth / videoWidth, scaleY: displayHeight / videoHeight, offsetX, offsetY };
  }, [videoWidth, videoHeight, containerRef]);

  const draw = useCallback((timestamp: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    if (containerRef.current) {
      canvas.width = containerRef.current.clientWidth;
      canvas.height = containerRef.current.clientHeight;
    }

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const { scaleX, scaleY, offsetX, offsetY } = getScaleFactor();

    overlays.forEach(overlay => {
      const x = overlay.x * scaleX + offsetX;
      const y = overlay.y * scaleY + offsetY;

      ctx.save();
      ctx.strokeStyle = overlay.color;
      ctx.fillStyle = overlay.color;
      ctx.lineWidth = 3;

      let pulseScale = 1;
      if (overlay.animation === 'pulse') {
        pulseScale = 1 + Math.sin(timestamp / 200) * 0.1;
      }

      switch (overlay.type) {
        case 'circle': {
          const radius = ((overlay.width || 30) * scaleX * pulseScale) / 2;
          ctx.beginPath();
          ctx.arc(x + radius, y + radius, radius, 0, Math.PI * 2);
          ctx.stroke();
          ctx.globalAlpha = 0.2;
          ctx.fill();
          ctx.globalAlpha = 1;
          break;
        }

        case 'box': {
          const width = (overlay.width || 100) * scaleX * pulseScale;
          const height = (overlay.height || 50) * scaleY * pulseScale;
          const pulseOffset = ((pulseScale - 1) / 2);
          const drawX = x - width * pulseOffset;
          const drawY = y - height * pulseOffset;
          ctx.strokeRect(drawX, drawY, width, height);
          ctx.globalAlpha = 0.15;
          ctx.fillRect(drawX, drawY, width, height);
          ctx.globalAlpha = 1;
          break;
        }

        case 'arrow': {
          if (overlay.end_x !== undefined && overlay.end_y !== undefined) {
            const endX = overlay.end_x * scaleX + offsetX;
            const endY = overlay.end_y * scaleY + offsetY;
            ctx.beginPath();
            ctx.moveTo(x, y);
            ctx.lineTo(endX, endY);
            ctx.stroke();

            const angle = Math.atan2(endY - y, endX - x);
            const headLength = 15 * pulseScale;
            ctx.beginPath();
            ctx.moveTo(endX, endY);
            ctx.lineTo(endX - headLength * Math.cos(angle - Math.PI / 6), endY - headLength * Math.sin(angle - Math.PI / 6));
            ctx.moveTo(endX, endY);
            ctx.lineTo(endX - headLength * Math.cos(angle + Math.PI / 6), endY - headLength * Math.sin(angle + Math.PI / 6));
            ctx.stroke();
          }
          break;
        }

        case 'text': {
          if (overlay.label) {
            ctx.font = '16px Arial, sans-serif';
            ctx.textBaseline = 'top';
            const metrics = ctx.measureText(overlay.label);
            const padding = 8;
            ctx.fillStyle = 'rgba(0, 0, 0, 0.75)';
            ctx.fillRect(x - padding, y - padding / 2, metrics.width + padding * 2, 24);
            ctx.fillStyle = overlay.color;
            ctx.fillText(overlay.label, x, y);
          }
          break;
        }

        case 'click_indicator': {
          const maxRadius = 30 * scaleX;
          const animProgress = (timestamp % 1000) / 1000;
          const radius = maxRadius * animProgress;
          ctx.globalAlpha = 1 - animProgress;
          ctx.beginPath();
          ctx.arc(x, y, radius, 0, Math.PI * 2);
          ctx.stroke();
          ctx.globalAlpha = 1;
          ctx.beginPath();
          ctx.arc(x, y, 5, 0, Math.PI * 2);
          ctx.fill();
          break;
        }

        case 'pulse': {
          const radius = ((overlay.width || 40) * scaleX * pulseScale) / 2;
          ctx.globalAlpha = 0.5 + Math.sin(timestamp / 200) * 0.3;
          ctx.beginPath();
          ctx.arc(x, y, radius, 0, Math.PI * 2);
          ctx.stroke();
          ctx.globalAlpha = 1;
          ctx.beginPath();
          ctx.arc(x, y, 8, 0, Math.PI * 2);
          ctx.fill();
          break;
        }

        case 'path': {
          if (overlay.end_x !== undefined && overlay.end_y !== undefined) {
            const endX = overlay.end_x * scaleX + offsetX;
            const endY = overlay.end_y * scaleY + offsetY;
            ctx.setLineDash([5, 5]);
            ctx.beginPath();
            ctx.moveTo(x, y);
            ctx.lineTo(endX, endY);
            ctx.stroke();
            ctx.setLineDash([]);
          }
          break;
        }
      }

      ctx.restore();
    });

    animationFrameRef.current = requestAnimationFrame(draw);
  }, [overlays, getScaleFactor, containerRef]);

  useEffect(() => {
    animationFrameRef.current = requestAnimationFrame(draw);
    return () => {
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    };
  }, [draw]);

  return <canvas ref={canvasRef} className="absolute inset-0 pointer-events-none z-10" />;
}
