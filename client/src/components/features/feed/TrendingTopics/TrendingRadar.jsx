import { useEffect, useId, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';

const clamp = (v, min, max) => Math.max(min, Math.min(max, v));

const parseCssColor = value => {
  if (!value) return null;
  const raw = String(value).trim();
  if (raw === 'transparent') return { r: 0, g: 0, b: 0, a: 0 };

  const hex = raw.match(/^#([0-9a-f]{3,8})$/i);
  if (hex) {
    const h = hex[1];
    const expand = s => s.split('').map(ch => ch + ch).join('');
    const full = h.length === 3 || h.length === 4 ? expand(h) : h;
    const hasAlpha = full.length === 8;
    const r = parseInt(full.slice(0, 2), 16);
    const g = parseInt(full.slice(2, 4), 16);
    const b = parseInt(full.slice(4, 6), 16);
    const a = hasAlpha ? parseInt(full.slice(6, 8), 16) / 255 : 1;
    return { r, g, b, a };
  }

  const rgb = raw.match(
    /^rgba?\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)(?:\s*,\s*([\d.]+)\s*)?\)$/i
  );
  if (rgb) {
    const r = Number(rgb[1]);
    const g = Number(rgb[2]);
    const b = Number(rgb[3]);
    const a = rgb[4] === undefined ? 1 : Number(rgb[4]);
    if (![r, g, b, a].every(Number.isFinite)) return null;
    return { r, g, b, a };
  }

  return null;
};

const rgba = (c, aOverride) => {
  const a = aOverride === undefined ? c.a ?? 1 : aOverride;
  return `rgba(${Math.round(c.r)}, ${Math.round(c.g)}, ${Math.round(
    c.b
  )}, ${clamp(a, 0, 1)})`;
};

const mix = (c1, c2, t) => {
  const k = clamp(t, 0, 1);
  return {
    r: c1.r * (1 - k) + c2.r * k,
    g: c1.g * (1 - k) + c2.g * k,
    b: c1.b * (1 - k) + c2.b * k,
    a: 1,
  };
};

const parsePosts = value => {
  if (!value) return 0;
  const raw = String(value).trim().toUpperCase();
  const num = Number(raw.replace(/[^\d.]/g, ''));
  if (!Number.isFinite(num)) return 0;
  if (raw.includes('K')) return Math.round(num * 1000);
  if (raw.includes('M')) return Math.round(num * 1000 * 1000);
  return Math.round(num);
};

const normalizeTag = name => String(name || '').trim().replace(/^#/, '');

const hashString = str => {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
};

const makeRng = seed => {
  let t = seed >>> 0;
  return () => {
    t += 0x6d2b79f5;
    let x = Math.imul(t ^ (t >>> 15), 1 | t);
    x ^= x + Math.imul(x ^ (x >>> 7), 61 | x);
    return ((x ^ (x >>> 14)) >>> 0) / 4294967296;
  };
};

const polar = (cx, cy, r, a) => ({
  x: cx + Math.cos(a) * r,
  y: cy + Math.sin(a) * r,
});

const sectorPath = (cx, cy, r, a0, a1) => {
  const p0 = polar(cx, cy, r, a0);
  const p1 = polar(cx, cy, r, a1);
  const largeArc = Math.abs(a1 - a0) > Math.PI ? 1 : 0;
  return `M ${cx} ${cy} L ${p0.x.toFixed(3)} ${p0.y.toFixed(3)} A ${r} ${r} 0 ${largeArc} 1 ${p1.x.toFixed(
    3
  )} ${p1.y.toFixed(3)} Z`;
};

export default function TrendingRadar({ trendingTopics = [] }) {
  const navigate = useNavigate();
  const uid = useId().replace(/:/g, '');
  const svgRef = useRef(null);
  const [hoveredKey, setHoveredKey] = useState(null);
  const [tooltip, setTooltip] = useState({ xPct: 50, yPct: 50 });
  const [theme, setTheme] = useState(() => ({
    primary: { r: 255, g: 255, b: 255, a: 1 },
    content: { r: 255, g: 255, b: 255, a: 1 },
    surface2: { r: 23, g: 23, b: 23, a: 1 },
    border: { r: 39, g: 39, b: 42, a: 1 },
  }));

  useEffect(() => {
    const root = document.documentElement;
    const styles = getComputedStyle(root);
    const read = name => parseCssColor(styles.getPropertyValue(name));
    const primary = read('--color-primary');
    const content = read('--color-content');
    const surface2 = read('--color-surface-secondary');
    const border = read('--color-border');

    setTheme(prev => ({
      primary: primary ?? prev.primary,
      content: content ?? prev.content,
      surface2: surface2 ?? prev.surface2,
      border: border ?? prev.border,
    }));
  }, []);

  const data = useMemo(() => {
    const topics = trendingTopics
      .map(t => ({
        rawName: t.name,
        key: normalizeTag(t.name),
        postsLabel: t.posts,
        posts: parsePosts(t.posts),
        category: t.category,
      }))
      .filter(t => t.key);

    topics.sort((a, b) => b.posts - a.posts || a.key.localeCompare(b.key));
    return topics.slice(0, 14);
  }, [trendingTopics]);

  const points = useMemo(() => {
    const w = 100;
    const h = 100;
    const cx = 50;
    const cy = 50;
    const rMax = 41.5;

    if (!data.length) return { w, h, cx, cy, rMax, pts: [] };

    const seed = data.reduce((acc, t) => acc ^ hashString(t.key), 0) ^ 0x9e3779b9;
    const rng = makeRng(seed);
    const maxPosts = Math.max(1, ...data.map(d => d.posts || 0));

    // Two concentric bands + slight jitter; hottest stays closer to center.
    const rings = [0.86, 0.68, 0.52];
    const golden = 2.399963229728653; // golden angle
    const baseRot = rng() * Math.PI * 2;

    const pts = data.map((t, i) => {
      const hotness = clamp((t.posts || 0) / maxPosts, 0, 1);
      const ringIdx = hotness > 0.72 ? 2 : hotness > 0.42 ? 1 : 0;
      const ring = rings[ringIdx];
      const angle = baseRot + i * golden + (rng() - 0.5) * 0.18;
      const rr = rMax * ring + (rng() - 0.5) * 1.6;
      const p = polar(cx, cy, rr, angle);

      // Label sits slightly outside the point, aligned to quadrant.
      const labelR = clamp(rr + 7.5, 22, rMax + 10.5);
      const lp = polar(cx, cy, labelR, angle);
      const anchor = Math.cos(angle) > 0.35 ? 'start' : Math.cos(angle) < -0.35 ? 'end' : 'middle';
      const dy = Math.sin(angle) * 2.2;

      return {
        ...t,
        x: clamp(p.x, 8, 92),
        y: clamp(p.y, 8, 92),
        a: angle,
        hotness,
        labelX: clamp(lp.x, 4, 96),
        labelY: clamp(lp.y + dy, 6, 96),
        anchor,
        ringIdx,
      };
    });

    return { w, h, cx, cy, rMax, pts };
  }, [data]);

  const hovered = points.pts.find(p => p.key === hoveredKey) || null;

  const updateTooltipFromEvent = event => {
    const svg = svgRef.current;
    if (!svg) return;
    const rect = svg.getBoundingClientRect();
    const x = clamp(((event.clientX - rect.left) / rect.width) * 100, 2, 98);
    const y = clamp(((event.clientY - rect.top) / rect.height) * 100, 6, 98);
    setTooltip({ xPct: x, yPct: y });
  };

  return (
    <div className="w-full">
      <div className="relative w-full h-[220px] 2xl:h-[250px] rounded-3xl overflow-hidden bg-neutral-50/50 dark:bg-neutral-900/20">
        <style>{`
          @keyframes ybRadarSpin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
          @keyframes ybRadarPing { 0% { transform: scale(0.65); opacity: 0.0; } 12% { opacity: 0.22; } 100% { transform: scale(2.35); opacity: 0.0; } }
          @media (prefers-reduced-motion: reduce) {
            .yb-radar-sweep { animation: none !important; }
            .yb-radar-ping { animation: none !important; }
          }
        `}</style>

        <svg
          ref={svgRef}
          viewBox={`0 0 ${points.w} ${points.h}`}
          className="absolute inset-0 w-full h-full"
          role="img"
          aria-label="Trend radar"
          onPointerLeave={() => setHoveredKey(null)}
          onPointerMove={e => {
            if (hoveredKey) updateTooltipFromEvent(e);
          }}
        >
          <defs>
            <radialGradient id={`yb-radar-glow-${uid}`} cx="50%" cy="50%" r="62%">
              <stop offset="0%" stopColor={rgba(theme.primary, 0.12)} />
              <stop offset="55%" stopColor={rgba(theme.primary, 0.04)} />
              <stop offset="100%" stopColor={rgba(theme.primary, 0)} />
            </radialGradient>

            <radialGradient id={`yb-radar-sweep-${uid}`} cx="50%" cy="50%" r="70%">
              <stop offset="0%" stopColor={rgba(theme.primary, 0.0)} />
              <stop offset="55%" stopColor={rgba(theme.primary, 0.08)} />
              <stop offset="100%" stopColor={rgba(theme.primary, 0.0)} />
            </radialGradient>

            <mask id={`yb-radar-clip-${uid}`}>
              <rect x="0" y="0" width={points.w} height={points.h} fill="black" />
              <circle cx={points.cx} cy={points.cy} r={points.rMax} fill="white" />
            </mask>
          </defs>

          {/* Subtle panel glow */}
          <rect x="0" y="0" width={points.w} height={points.h} fill={`url(#yb-radar-glow-${uid})`} />

          {/* Radar frame */}
          <g mask={`url(#yb-radar-clip-${uid})`}>
            {/* Sweep wedge */}
            <g
              className="yb-radar-sweep"
              style={{
                transformOrigin: `${points.cx}px ${points.cy}px`,
                animation: 'ybRadarSpin 9.5s linear infinite',
                opacity: 0.9,
              }}
            >
              <path
                d={sectorPath(points.cx, points.cy, points.rMax + 0.1, -0.35, 0.35)}
                fill={`url(#yb-radar-sweep-${uid})`}
              />
            </g>

            {/* Concentric rings */}
            {[0.25, 0.5, 0.75, 1].map(k => (
              <circle
                key={k}
                cx={points.cx}
                cy={points.cy}
                r={points.rMax * k}
                fill="none"
                stroke={rgba(mix(theme.border, theme.content, 0.22), 0.75)}
                strokeWidth="0.6"
                vectorEffect="non-scaling-stroke"
              />
            ))}

            {/* Crosshair */}
            <line
              x1={points.cx - points.rMax}
              y1={points.cy}
              x2={points.cx + points.rMax}
              y2={points.cy}
              stroke={rgba(mix(theme.border, theme.content, 0.16), 0.65)}
              strokeWidth="0.6"
              vectorEffect="non-scaling-stroke"
            />
            <line
              x1={points.cx}
              y1={points.cy - points.rMax}
              x2={points.cx}
              y2={points.cy + points.rMax}
              stroke={rgba(mix(theme.border, theme.content, 0.16), 0.65)}
              strokeWidth="0.6"
              vectorEffect="non-scaling-stroke"
            />
          </g>

          {/* Outer ring */}
          <circle
            cx={points.cx}
            cy={points.cy}
            r={points.rMax}
            fill="none"
            stroke={rgba(mix(theme.border, theme.content, 0.34), 0.95)}
            strokeWidth="1.1"
            vectorEffect="non-scaling-stroke"
          />

          {/* Hashtag points */}
          <g>
            {points.pts.map((p, i) => {
              const isHovered = hoveredKey === p.key;
              const isHot = i === 0;
              const dotR = clamp(1.15 + p.hotness * 2.1 + (isHovered ? 0.55 : 0), 1.25, 4.2);
              const baseDot = mix(theme.content, theme.primary, 0.22);
              const hotDot = mix(theme.content, theme.primary, 0.62);
              const fill = rgba(isHot || isHovered ? hotDot : baseDot, isHot ? 0.96 : 0.82);
              const stroke = rgba(mix(theme.surface2, theme.border, 0.65), 0.85);

              return (
                <g
                  key={p.key}
                  onPointerEnter={e => {
                    setHoveredKey(p.key);
                    updateTooltipFromEvent(e);
                  }}
                  onPointerMove={updateTooltipFromEvent}
                  onPointerLeave={() => setHoveredKey(null)}
                  onPointerDown={e => {
                    e.preventDefault();
                    navigate(`/explore/tag/${p.key}`);
                  }}
                  style={{ cursor: 'pointer' }}
                >
                  {/* Ping for hottest */}
                  {isHot && (
                    <circle
                      className="yb-radar-ping"
                      cx={p.x}
                      cy={p.y}
                      r={dotR}
                      fill="none"
                      stroke={rgba(theme.primary, 0.25)}
                      strokeWidth="0.8"
                      style={{
                        transformOrigin: `${p.x}px ${p.y}px`,
                        animation: 'ybRadarPing 1.9s ease-out infinite',
                      }}
                    />
                  )}

                  <circle
                    cx={p.x}
                    cy={p.y}
                    r={dotR}
                    fill={fill}
                    stroke={stroke}
                    strokeWidth="0.7"
                    vectorEffect="non-scaling-stroke"
                    opacity={hoveredKey && !isHovered ? 0.75 : 1}
                  />

                  {/* Label */}
                  <text
                    x={p.labelX}
                    y={p.labelY}
                    textAnchor={p.anchor}
                    // Lighter, tighter typography (avoid "bold blob" look on light panels)
                    fontSize={clamp(
                      6.0 + p.hotness * 1.6 + (isHovered ? 0.25 : 0),
                      6.0,
                      8.6
                    )}
                    fontWeight={isHot ? 650 : isHovered ? 600 : 520}
                    fill={rgba(theme.content, isHot ? 0.86 : 0.72)}
                    style={{
                      pointerEvents: 'none',
                      letterSpacing: '-0.01em',
                      paintOrder: 'stroke',
                      stroke: rgba(theme.surface2, 0.55),
                      strokeWidth: isHovered ? 0.8 : 0.65,
                    }}
                    opacity={hoveredKey && !isHovered ? 0.55 : 1}
                  >
                    #{p.key}
                  </text>
                </g>
              );
            })}
          </g>
        </svg>

        {/* Tooltip */}
        {hovered && (
          <div
            className="absolute pointer-events-none px-3 py-2 rounded-2xl border border-neutral-200/60 dark:border-neutral-800/60 bg-white/90 dark:bg-neutral-950/80 backdrop-blur-md shadow-lg"
            style={{
              left: `${tooltip.xPct}%`,
              top: `${tooltip.yPct}%`,
              transform: 'translate(12px, -115%)',
              maxWidth: 220,
            }}
          >
            <div className="text-xs font-semibold text-black dark:text-white">
              #{hovered.key}
            </div>
            <div className="text-[11px] text-neutral-500 mt-0.5">
              {hovered.postsLabel} posts
            </div>
            {hovered.category && (
              <div className="text-[10px] text-neutral-400 mt-1">{hovered.category}</div>
            )}
            <div className="text-[10px] text-neutral-400 mt-1">Click to explore</div>
          </div>
        )}
      </div>

      <p className="mt-2 text-[11px] text-neutral-400">Tip: click any point to open that hashtag.</p>
    </div>
  );
}
