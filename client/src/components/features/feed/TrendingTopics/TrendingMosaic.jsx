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
  // Deterministic 32-bit hash (FNV-1a-ish)
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
};

const makeRng = seed => {
  // Mulberry32
  let t = seed >>> 0;
  return () => {
    t += 0x6d2b79f5;
    let x = Math.imul(t ^ (t >>> 15), 1 | t);
    x ^= x + Math.imul(x ^ (x >>> 7), 61 | x);
    return ((x ^ (x >>> 14)) >>> 0) / 4294967296;
  };
};

const clipPolygonHalfPlane = (poly, a, b, c) => {
  // Keep points where a*x + b*y <= c
  if (!poly.length) return [];
  const out = [];
  const eps = 1e-9;
  const inside = p => a * p.x + b * p.y <= c + eps;
  const intersect = (p1, p2) => {
    const d1 = a * p1.x + b * p1.y - c;
    const d2 = a * p2.x + b * p2.y - c;
    const t = d1 / (d1 - d2);
    return { x: p1.x + (p2.x - p1.x) * t, y: p1.y + (p2.y - p1.y) * t };
  };

  for (let i = 0; i < poly.length; i++) {
    const cur = poly[i];
    const prev = poly[(i - 1 + poly.length) % poly.length];
    const curIn = inside(cur);
    const prevIn = inside(prev);

    if (curIn && prevIn) {
      out.push(cur);
      continue;
    }

    if (prevIn && !curIn) {
      out.push(intersect(prev, cur));
      continue;
    }

    if (!prevIn && curIn) {
      out.push(intersect(prev, cur));
      out.push(cur);
      continue;
    }
  }

  // Deduplicate near-identical consecutive points
  const deduped = [];
  for (const p of out) {
    const last = deduped[deduped.length - 1];
    if (!last || Math.hypot(p.x - last.x, p.y - last.y) > 1e-4) deduped.push(p);
  }
  if (deduped.length >= 2) {
    const first = deduped[0];
    const last = deduped[deduped.length - 1];
    if (Math.hypot(first.x - last.x, first.y - last.y) < 1e-4) deduped.pop();
  }
  return deduped;
};

const polygonCentroid = poly => {
  // Standard polygon centroid (area-weighted). Falls back to average.
  if (!poly.length) return { x: 0, y: 0 };
  let a = 0;
  let cx = 0;
  let cy = 0;
  for (let i = 0; i < poly.length; i++) {
    const p = poly[i];
    const q = poly[(i + 1) % poly.length];
    const cross = p.x * q.y - q.x * p.y;
    a += cross;
    cx += (p.x + q.x) * cross;
    cy += (p.y + q.y) * cross;
  }
  if (Math.abs(a) < 1e-6) {
    const avg = poly.reduce(
      (acc, p) => ({ x: acc.x + p.x, y: acc.y + p.y }),
      { x: 0, y: 0 }
    );
    return { x: avg.x / poly.length, y: avg.y / poly.length };
  }
  a *= 0.5;
  return { x: cx / (6 * a), y: cy / (6 * a) };
};

const polygonArea = poly => {
  if (!poly.length) return 0;
  let a = 0;
  for (let i = 0; i < poly.length; i++) {
    const p = poly[i];
    const q = poly[(i + 1) % poly.length];
    a += p.x * q.y - q.x * p.y;
  }
  return Math.abs(a) * 0.5;
};

const pointInPoly = (pt, poly) => {
  // Ray casting
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const xi = poly[i].x;
    const yi = poly[i].y;
    const xj = poly[j].x;
    const yj = poly[j].y;
    const intersect =
      yi > pt.y !== yj > pt.y &&
      pt.x < ((xj - xi) * (pt.y - yi)) / (yj - yi + 1e-12) + xi;
    if (intersect) inside = !inside;
  }
  return inside;
};

const toPath = poly => {
  if (!poly.length) return '';
  return `M ${poly.map(p => `${p.x.toFixed(3)} ${p.y.toFixed(3)}`).join(' L ')} Z`;
};

export default function TrendingMosaic({ trendingTopics = [] }) {
  const navigate = useNavigate();
  const uid = useId().replace(/:/g, '');
  const svgRef = useRef(null);
  const [hoveredKey, setHoveredKey] = useState(null);
  const [hoverPos, setHoverPos] = useState({ x: 0, y: 0 });
  const [theme, setTheme] = useState(() => ({
    primary: { r: 255, g: 255, b: 255, a: 1 },
    content: { r: 255, g: 255, b: 255, a: 1 },
    surface2: { r: 23, g: 23, b: 23, a: 1 },
    border: { r: 39, g: 39, b: 42, a: 1 },
  }));

  useEffect(() => {
    // Read CSS variables so the mosaic matches your design system colors.
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

  const normalized = useMemo(() => {
    const topics = trendingTopics
      .map(t => ({
        rawName: t.name,
        key: normalizeTag(t.name),
        postsLabel: t.posts,
        posts: parsePosts(t.posts),
      }))
      .filter(t => t.key);

    // Stable order: hottest first
    topics.sort((a, b) => b.posts - a.posts || a.key.localeCompare(b.key));
    // More cells makes it feel like a "map".
    return topics.slice(0, 18);
  }, [trendingTopics]);

  const geometry = useMemo(() => {
    const w = 100;
    const h = 62;
    const margin = 3.5;
    const bbox = [
      { x: 0, y: 0 },
      { x: w, y: 0 },
      { x: w, y: h },
      { x: 0, y: h },
    ];

    if (!normalized.length) return { w, h, cells: [] };

    const seed = normalized.reduce((acc, t) => acc ^ hashString(t.key), 0);
    const rng = makeRng(seed);

    // Place points like a classic Voronoi "map":
    // the hottest cell centered, others pushed toward the edges.
    const cx = w * 0.5;
    const cy = h * 0.5;
    const points = normalized.map((t, i) => {
      if (i === 0) {
        return {
          ...t,
          x: cx + (rng() - 0.5) * 2.2,
          y: cy + (rng() - 0.5) * 2.2,
        };
      }

      const idx = i - 1;
      const angle = idx * 2.399963229728653; // golden angle
      const ring = clamp(
        0.68 + (idx / Math.max(1, normalized.length - 2)) * 0.26,
        0.68,
        0.92
      );
      const jitterX = (rng() - 0.5) * 6.5;
      const jitterY = (rng() - 0.5) * 5.2;

      const x = cx + Math.cos(angle) * ring * (w * 0.48) + jitterX;
      const y = cy + Math.sin(angle) * ring * (h * 0.48) + jitterY;

      return {
        ...t,
        x: clamp(x, margin, w - margin),
        y: clamp(y, margin, h - margin),
      };
    });

    const cells = points.map((p, idx) => {
      let poly = bbox;
      for (let j = 0; j < points.length; j++) {
        if (j === idx) continue;
        const q = points[j];
        const a = q.x - p.x;
        const b = q.y - p.y;
        const c = (q.x * q.x + q.y * q.y - (p.x * p.x + p.y * p.y)) / 2;
        poly = clipPolygonHalfPlane(poly, a, b, c);
        if (poly.length === 0) break;
      }
      return {
        ...p,
        poly,
        centroid: polygonCentroid(poly),
      };
    });

    return { w, h, cells };
  }, [normalized]);

  const hovered = geometry.cells.find(c => c.key === hoveredKey) || null;

  const handlePointerMove = event => {
    const svg = svgRef.current;
    if (!svg) return;

    const rect = svg.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width) * geometry.w;
    const y = ((event.clientY - rect.top) / rect.height) * geometry.h;

    setHoverPos({ x, y });

    // Find topmost (smallest) cell containing pointer
    let found = null;
    for (let i = 0; i < geometry.cells.length; i++) {
      const cell = geometry.cells[i];
      if (pointInPoly({ x, y }, cell.poly)) {
        found = cell.key;
        break;
      }
    }
    setHoveredKey(found);
  };

  return (
    <div className="w-full">
      <div className="relative w-full h-[220px] 2xl:h-[250px] rounded-3xl overflow-hidden bg-neutral-50/50 dark:bg-neutral-900/20">
        <svg
          ref={svgRef}
          viewBox={`0 0 ${geometry.w} ${geometry.h}`}
          className="absolute inset-0 w-full h-full"
          onPointerMove={handlePointerMove}
          onPointerLeave={() => setHoveredKey(null)}
          onPointerDown={event => {
            // Click-to-navigate
            if (!hoveredKey) return;
            event.preventDefault();
            navigate(`/explore/tag/${hoveredKey}`);
          }}
          role="img"
          aria-label="Trending hashtag mosaic"
          style={{ touchAction: 'none' }}
        >
          <defs>
            <filter id={`yb-grain-${uid}`} x="-20%" y="-20%" width="140%" height="140%">
              {/* IMPORTANT: Blend grain WITH SourceGraphic (not replace it). */}
              <feTurbulence
                type="fractalNoise"
                baseFrequency="0.85"
                numOctaves="2"
                stitchTiles="stitch"
                result="noise"
              />
              <feColorMatrix in="noise" type="saturate" values="0" result="mono" />
              <feComponentTransfer in="mono" result="grain">
                <feFuncA type="table" tableValues="0 0.07" />
              </feComponentTransfer>
              <feBlend in="SourceGraphic" in2="grain" mode="soft-light" />
            </filter>
            <filter id={`yb-map-${uid}`} x="-20%" y="-20%" width="140%" height="140%">
              <feTurbulence
                type="fractalNoise"
                baseFrequency="0.03"
                numOctaves="2"
                seed="7"
                stitchTiles="stitch"
              />
              <feColorMatrix type="saturate" values="0" />
              <feComponentTransfer>
                <feFuncA type="table" tableValues="0 0.14" />
              </feComponentTransfer>
              <feGaussianBlur stdDeviation="0.22" />
            </filter>
            <linearGradient id={`yb-sheen-${uid}`} x1="0" y1="0" x2="1" y2="1">
              <stop offset="0" stopColor="rgba(255,255,255,0.06)" />
              <stop offset="0.55" stopColor="rgba(255,255,255,0)" />
              <stop offset="1" stopColor="rgba(255,255,255,0.04)" />
            </linearGradient>
          </defs>

          {/* Faint "map" texture layer */}
          <rect
            x="0"
            y="0"
            width={geometry.w}
            height={geometry.h}
            fill={rgba(theme.content, 1)}
            opacity="0.07"
            filter={`url(#yb-map-${uid})`}
          />

          {/* Background sheen */}
          <rect
            x="0"
            y="0"
            width={geometry.w}
            height={geometry.h}
            fill={`url(#yb-sheen-${uid})`}
            opacity="0.9"
          />

          {/* Cells */}
          <g shapeRendering="geometricPrecision" filter={`url(#yb-grain-${uid})`}>
            {geometry.cells.map((cell, index) => {
              const isHot = index === 0;
              const isHovered = hoveredKey === cell.key;
              const density = clamp(0.06 + index * 0.03, 0.06, 0.34);

              // Keep it monochrome; use primary as a subtle edge/highlight only.
              const baseFill = mix(theme.surface2, theme.content, density * 0.18);
              const hotFill = mix(theme.surface2, theme.content, 0.16);
              const hoverFill = mix(theme.surface2, theme.primary, 0.22);
              const fill = rgba(isHovered ? hoverFill : isHot ? hotFill : baseFill);

              // Stronger borders like a Voronoi "map"
              const baseStroke = rgba(mix(theme.border, theme.content, 0.34), 0.98);
              const hoverStroke = rgba(mix(theme.border, theme.primary, 0.7), 1);
              const stroke = isHovered ? hoverStroke : baseStroke;

              return (
                <path
                  key={cell.key}
                  d={toPath(cell.poly)}
                  fill={fill}
                  stroke={stroke}
                  strokeWidth={isHovered ? 2.05 : 1.55}
                  vectorEffect="non-scaling-stroke"
                  style={{
                    cursor: 'pointer',
                    transition: 'fill 180ms ease, stroke 180ms ease, opacity 180ms ease',
                    opacity: hoveredKey && !isHovered ? 0.85 : 1,
                  }}
                />
              );
            })}
          </g>

          {/* Labels: show all (classic Voronoi map style) */}
          <g>
            {geometry.cells.map((cell, index) => {
              const isHovered = hoveredKey === cell.key;
              const label = `#${cell.key}`;
              const area = polygonArea(cell.poly);
              const fontSize = clamp(
                (Math.sqrt(area) * 0.55 + (index === 0 ? 1.1 : 0)) * (isHovered ? 1.04 : 1),
                6.2,
                13.5
              );
              return (
                <g
                  key={`${cell.key}-label`}
                  transform={`translate(${cell.centroid.x} ${cell.centroid.y})`}
                  style={{ pointerEvents: 'none' }}
                  opacity={isHovered ? 1 : 0.92}
                >
                  <text
                    x="0"
                    y="-2.2"
                    textAnchor="middle"
                    fontSize={fontSize}
                    fontWeight={index === 0 ? 800 : 700}
                    fill={rgba(theme.content, 0.92)}
                    style={{
                      letterSpacing: '-0.02em',
                      paintOrder: 'stroke',
                      stroke: rgba(theme.surface2, 0.9),
                      strokeWidth: 1.15,
                    }}
                  >
                    {label}
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
              left: `${(hoverPos.x / geometry.w) * 100}%`,
              top: `${(hoverPos.y / geometry.h) * 100}%`,
              transform: 'translate(12px, -110%)',
              maxWidth: 220,
            }}
          >
            <div className="text-xs font-semibold text-black dark:text-white">
              #{hovered.key}
            </div>
            <div className="text-[11px] text-neutral-500 mt-0.5">
              {hovered.postsLabel} posts
            </div>
            <div className="text-[10px] text-neutral-400 mt-1">
              Click to explore
            </div>
          </div>
        )}
      </div>

      <p className="mt-2 text-[11px] text-neutral-400">
        Tip: click any region to open that hashtag.
      </p>
    </div>
  );
}
