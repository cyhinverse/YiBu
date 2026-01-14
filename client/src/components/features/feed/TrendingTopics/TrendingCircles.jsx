import { useMemo, useEffect, useRef, useState } from 'react';

const COLORS = [
  '#60A5FA', // Blue
  '#A78BFA', // Purple
  '#F472B6', // Pink
  '#34D399', // Green
  '#FBBF24', // Yellow
  '#FB923C', // Orange
  '#22D3EE', // Cyan
  '#F87171', // Red
];

const TrendingCircles = ({ trendingTopics = [] }) => {
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const [hoveredSwarm, setHoveredSwarm] = useState(null);

  // State to persist swarm positions and particles across data updates
  const persistedSwarms = useRef(new Map());

  // Initialize Swarms and Particles
  const swarmData = useMemo(() => {
    return trendingTopics.map((topic, index) => {
      const name = topic.name.replace('#', '');
      const postsValue = parseInt(topic.posts.replace('K', '000')) || 1000;
      const particleCount = Math.min(
        40,
        Math.max(15, Math.floor(postsValue / 100))
      );

      const existing = persistedSwarms.current.get(name);
      const color = existing?.color || COLORS[index % COLORS.length];

      // Arrange in a circular layout around the center (50, 50)
      const angle = (index / trendingTopics.length) * Math.PI * 2;
      const dist = 32; // Distance from center as %
      const baseX = 50 + Math.cos(angle) * dist;
      const baseY = 50 + Math.sin(angle) * dist;

      // Scale particles array carefully
      let particles = existing?.particles || [];
      if (particles.length < particleCount) {
        const extra = Array.from({
          length: particleCount - particles.length,
        }).map(() => ({
          offsetX: (Math.random() - 0.5) * 50,
          offsetY: (Math.random() - 0.5) * 50,
          size: 1.5 + Math.random() * 2.5,
          speed: 0.004 + Math.random() * 0.008,
          phase: Math.random() * Math.PI * 2,
        }));
        particles = [...particles, ...extra];
      } else if (particles.length > particleCount) {
        particles = particles.slice(0, particleCount);
      }

      const swarm = {
        ...topic,
        name,
        color,
        baseX,
        baseY,
        particles,
        currentX: existing?.currentX ?? baseX,
        currentY: existing?.currentY ?? baseY,
        radius: 30 + (particleCount / 40) * 20,
      };

      persistedSwarms.current.set(name, swarm);
      return swarm;
    });
  }, [trendingTopics]);

  const labelsRef = useRef(new Map());

  useEffect(() => {
    if (!canvasRef.current || swarmData.length === 0) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    let animationFrameId;

    const resize = () => {
      const rect = containerRef.current.getBoundingClientRect();
      canvas.width = rect.width;
      canvas.height = rect.height;
    };

    window.addEventListener('resize', resize);
    resize();

    const draw = time => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      swarmData.forEach(swarm => {
        const centerX = (swarm.baseX / 100) * canvas.width;
        const centerY = (swarm.baseY / 100) * canvas.height;

        // Update swarm "drift"
        const driftX = Math.sin(time * 0.0004 + swarm.baseX) * 15;
        const driftY = Math.cos(time * 0.0005 + swarm.baseY) * 15;

        const finalX = centerX + driftX;
        const finalY = centerY + driftY;

        swarm.currentX = finalX;
        swarm.currentY = finalY;

        // Update Label position directly via DOM for performance
        const labelEl = labelsRef.current.get(swarm.name);
        if (labelEl) {
          labelEl.style.transform = `translate(${finalX}px, ${finalY}px) translate(-50%, -50%)`;
          // Fade in labels once positioned
          labelEl.style.opacity = '1';
        }

        // Draw Particles
        swarm.particles.forEach(p => {
          const wiggleX = Math.sin(time * p.speed + p.phase) * 15;
          const wiggleY = Math.cos(time * p.speed * 0.8 + p.phase) * 15;

          const px = finalX + p.offsetX + wiggleX;
          const py = finalY + p.offsetY + wiggleY;

          ctx.beginPath();
          ctx.arc(px, py, p.size, 0, Math.PI * 2);
          ctx.fillStyle = swarm.color;
          ctx.globalAlpha = 0.6;
          ctx.fill();
        });

        ctx.globalAlpha = 1.0;
      });

      animationFrameId = requestAnimationFrame(draw);
    };

    animationFrameId = requestAnimationFrame(draw);
    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', resize);
    };
  }, [swarmData]);

  const handleMouseMove = e => {
    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Look for hovered swarm
    let found = null;
    swarmData.forEach(swarm => {
      const dx = x - swarm.currentX;
      const dy = y - swarm.currentY;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < swarm.radius + 30) {
        found = swarm;
      }
    });
    setHoveredSwarm(found);
  };

  if (trendingTopics.length === 0) return null;

  return (
    <div
      ref={containerRef}
      className="h-[250px] w-full relative group/charts select-none overflow-hidden rounded-3xl bg-neutral-50/50 dark:bg-neutral-900/20"
      onMouseMove={handleMouseMove}
      onMouseLeave={() => setHoveredSwarm(null)}
    >
      <canvas ref={canvasRef} className="absolute inset-0 z-0" />

      {/* Persistent Labels - Absolute placed containers updated by Ref */}
      <div className="absolute inset-0 z-10 pointer-events-none">
        {swarmData.map(swarm => (
          <div
            key={swarm.name}
            ref={el => {
              if (el) labelsRef.current.set(swarm.name, el);
              else labelsRef.current.delete(swarm.name);
            }}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              opacity: 0, // Wait for first frame to position
              willChange: 'transform',
            }}
            className="flex flex-col items-center justify-center transition-opacity duration-300"
          >
            <span
              className={`text-[11px] font-bold px-2 py-0.5 rounded-full bg-white/80 dark:bg-neutral-900/80 backdrop-blur-sm shadow-sm border border-neutral-200/50 dark:border-neutral-800/50 transition-transform duration-300 ${
                hoveredSwarm?.name === swarm.name ? 'scale-110' : 'scale-100'
              }`}
              style={{ color: swarm.color, pointerEvents: 'auto' }}
            >
              #{swarm.name}
            </span>
            {hoveredSwarm?.name === swarm.name && (
              <span className="text-[10px] text-neutral-500 font-medium mt-0.5 animate-in fade-in slide-in-from-top-1 duration-200">
                {swarm.posts}
              </span>
            )}
          </div>
        ))}
      </div>

      {/* Decorative Orbs */}
      <div className="absolute inset-0 -z-10 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-primary/5 blur-[120px] rounded-full animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-secondary/5 blur-[120px] rounded-full animate-pulse" />
      </div>

      {trendingTopics.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center text-neutral-400 text-sm">
          Summoning the particles...
        </div>
      )}
    </div>
  );
};

export default TrendingCircles;
