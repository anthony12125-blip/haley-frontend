'use client';

import { useEffect, useRef, useState } from 'react';

interface Star {
  x: number;
  y: number;
  z: number;
  size: number;
}

interface Comet {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
}

export default function MagicWindow() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    const resizeCanvas = () => {
      const scale = isMobile ? 0.7 : 1;
      canvas.width = window.innerWidth * scale;
      canvas.height = window.innerHeight * scale;
      canvas.style.width = '100%';
      canvas.style.height = '100%';
    };
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // Create stars at 3 different depths
    const stars: Star[] = [];
    for (let i = 0; i < 150; i++) {
      stars.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        z: Math.random() * 3, // 0-3 for depth
        size: Math.random() * 1.5 + 0.5,
      });
    }

    // Create comets
    const comets: Comet[] = [];
    const spawnComet = () => {
      if (Math.random() < 0.02 && comets.length < 3) {
        comets.push({
          x: Math.random() * canvas.width,
          y: -50,
          vx: (Math.random() - 0.5) * 2,
          vy: Math.random() * 3 + 2,
          life: 0,
          maxLife: Math.random() * 100 + 100,
        });
      }
    };

    // Fog offset for drift
    let fogOffset = 0;

    // Animation loop
    let animationId: number;
    let lastTime = performance.now();

    const animate = (currentTime: number) => {
      const deltaTime = currentTime - lastTime;
      lastTime = currentTime;

      // Cap FPS to 60
      if (deltaTime < 16) {
        animationId = requestAnimationFrame(animate);
        return;
      }

      // Clear canvas
      ctx.fillStyle = '#000000';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Draw gradient purple-blue background
      const gradient = ctx.createRadialGradient(
        canvas.width / 2,
        canvas.height / 2,
        0,
        canvas.width / 2,
        canvas.height / 2,
        canvas.width
      );
      gradient.addColorStop(0, 'rgba(139, 92, 246, 0.15)');
      gradient.addColorStop(0.5, 'rgba(167, 139, 250, 0.08)');
      gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Draw stars with parallax (3 depths)
      stars.forEach((star) => {
        const parallaxFactor = 1 + star.z * 0.3;
        const twinkle = 0.5 + Math.sin(currentTime * 0.001 + star.x) * 0.5;
        
        ctx.beginPath();
        ctx.arc(star.x * parallaxFactor, star.y * parallaxFactor, star.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(192, 132, 252, ${twinkle * 0.8})`;
        ctx.fill();
      });

      // Draw and update comets
      spawnComet();
      comets.forEach((comet, index) => {
        comet.x += comet.vx;
        comet.y += comet.vy;
        comet.life++;

        if (comet.life > comet.maxLife || comet.y > canvas.height + 50) {
          comets.splice(index, 1);
          return;
        }

        const alpha = 1 - comet.life / comet.maxLife;
        
        // Draw comet trail
        ctx.beginPath();
        ctx.strokeStyle = `rgba(240, 171, 252, ${alpha * 0.6})`;
        ctx.lineWidth = 3;
        ctx.moveTo(comet.x, comet.y);
        ctx.lineTo(comet.x - comet.vx * 10, comet.y - comet.vy * 10);
        ctx.stroke();

        // Draw comet head
        ctx.beginPath();
        ctx.arc(comet.x, comet.y, 4, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
        ctx.fill();
      });

      // Draw drifting fog layer
      fogOffset += 0.1;
      const fogGradient = ctx.createLinearGradient(fogOffset % canvas.width, 0, canvas.width + fogOffset % canvas.width, 0);
      fogGradient.addColorStop(0, 'rgba(167, 139, 250, 0)');
      fogGradient.addColorStop(0.5, 'rgba(167, 139, 250, 0.03)');
      fogGradient.addColorStop(1, 'rgba(167, 139, 250, 0)');
      ctx.fillStyle = fogGradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Idle shimmer
      const shimmer = 0.5 + Math.sin(currentTime * 0.001) * 0.3;
      ctx.fillStyle = `rgba(192, 132, 252, ${shimmer * 0.02})`;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      animationId = requestAnimationFrame(animate);
    };

    animate(performance.now());

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      cancelAnimationFrame(animationId);
    };
  }, [isMobile]);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 w-full h-full"
      style={{ zIndex: -1 }}
    />
  );
}
