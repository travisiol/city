"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { clsx } from "clsx";
import {
  coastVectors,
  population,
  graticule,
  cityCentres,
  cityWeights,
  cities,
  type City,
} from "@/lib/cities";
import { CROWDED_OWNERS } from "@/lib/preview";
import { useWorld } from "@/lib/worldState";

/*
 * The world as a globe, at night.
 *
 * Every point on it — city centres, coastlines, graticule — was turned into
 * a unit vector once at module load, so a frame here is a rotation, a
 * back-hemisphere cull and an orthographic projection, with no trigonometry
 * per point. That is what makes 999 clickable cities on a spinning sphere
 * cheap enough to run at 60fps.
 *
 * Nothing of the ground is filled. After dark the land is as black as the
 * sea, so there is no landmass to paint — which is fortunate, because
 * filling a polygon on a rotating sphere tears at the limb. The continents
 * are legible because the cities are standing on them, and every dot is
 * sized so its AREA carries the population rather than its width.
 *
 * Two lights, and the difference between them is the whole system. A city
 * with no market burns cold, the blue-white of the street lighting that is
 * actually replacing sodium everywhere. One that trades burns amber, in
 * proportion to its activity. Amber appears nowhere else on this sphere.
 */

export type { City };
export { cities };

interface Frame {
  cx: number;
  cy: number;
  radius: number;
  cosYaw: number;
  sinYaw: number;
  cosPitch: number;
  sinPitch: number;
}

/*
 * A fixed starfield behind the globe. Positions are seeded so they never
 * flicker between frames, and held in normalised coordinates so a resize
 * rescales them instead of reshuffling the sky.
 */
const STARS = (() => {
  let state = 0x9e3779b9;
  const random = () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  return Array.from({ length: 220 }, () => ({
    x: random(),
    y: random(),
    r: 0.4 + random() * 1.1,
    a: 0.12 + random() * 0.5,
  }));
})();

/** Rotate a unit vector by yaw then pitch. Returns screen x, y and depth. */
function project(
  vx: number,
  vy: number,
  vz: number,
  f: Frame,
): { x: number; y: number; z: number } {
  const x1 = vx * f.cosYaw + vz * f.sinYaw;
  const z1 = -vx * f.sinYaw + vz * f.cosYaw;
  const y2 = vy * f.cosPitch - z1 * f.sinPitch;
  const z2 = vy * f.sinPitch + z1 * f.cosPitch;
  return { x: f.cx + x1 * f.radius, y: f.cy - y2 * f.radius, z: z2 };
}

export function Globe({
  selectedId,
  onSelect,
  className,
  /**
   * Where the sphere sits, as fractions of the canvas. The globe is moved
   * out from under whatever is open rather than dimmed: text over a
   * line-drawn sphere is unreadable, and fading the globe would spoil the
   * one thing on the page worth looking at.
   */
  bias = 0.5,
  biasY = 0.5,
}: {
  selectedId: number | null;
  onSelect: (city: City | null) => void;
  className?: string;
  bias?: number;
  biasY?: number;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [hovered, setHovered] = useState<City | null>(null);
  const { marketFor, peakActivity, totals } = useWorld();

  // Rotation lives in refs, not state: it changes every frame and must not
  // drag React through a re-render each time.
  const yaw = useRef(-0.35);
  const pitch = useRef(0.32);
  const frameRef = useRef<Frame | null>(null);

  // Hover and selection are read by the draw loop, never depended on by the
  // effect that owns it. Depending on them would tear down the animation
  // frame, the observers and every listener on each pointer move.
  const hoveredRef = useRef<City | null>(null);
  const selectedRef = useRef<number | null>(null);
  useEffect(() => {
    hoveredRef.current = hovered;
    selectedRef.current = selectedId;
  }, [hovered, selectedId, marketFor, peakActivity]);

  const biasRef = useRef(bias);
  const biasYRef = useRef(biasY);
  useEffect(() => {
    biasRef.current = bias;
    biasYRef.current = biasY;
  }, [bias, biasY]);

  const cityAt = useCallback((px: number, py: number): City | null => {
    const f = frameRef.current;
    if (!f) return null;
    // A city is hit if the pointer lands near its dot. The dots vary in
    // size but the target does not: a generous fixed reach means the 999th
    // city is no harder to click than the first, which matters when the
    // small ones are the ones nobody is looking for.
    const reach = Math.max(11, f.radius * 0.035);
    let best: City | null = null;
    let bestDist = reach * reach;
    for (let i = 0; i < cities.length; i += 1) {
      const p = project(
        cityCentres[i * 3],
        cityCentres[i * 3 + 1],
        cityCentres[i * 3 + 2],
        f,
      );
      if (p.z <= 0) continue;
      const dx = p.x - px;
      const dy = p.y - py;
      const dist = dx * dx + dy * dy;
      if (dist < bestDist) {
        bestDist = dist;
        best = cities[i];
      }
    }
    return best;
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    let width = 0;
    let height = 0;
    let spin = reduceMotion ? 0 : 0.0016;
    let dragging = false;
    let visible = true;
    let running = false;
    let lastX = 0;
    let lastY = 0;
    let raf = 0;

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = rect.width;
      height = rect.height;
      canvas.width = Math.max(1, Math.round(width * dpr));
      canvas.height = Math.max(1, Math.round(height * dpr));
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    const strokePolyline = (
      points: Float64Array,
      f: Frame,
      closed: boolean,
    ) => {
      let penDown = false;
      ctx.beginPath();
      const count = points.length / 3;
      for (let i = 0; i <= count; i += 1) {
        const index = (i % count) * 3;
        if (i === count && !closed) break;
        const p = project(points[index], points[index + 1], points[index + 2], f);
        if (p.z <= 0) {
          penDown = false;
          continue;
        }
        if (penDown) ctx.lineTo(p.x, p.y);
        else {
          ctx.moveTo(p.x, p.y);
          penDown = true;
        }
      }
      ctx.stroke();
    };

    /*
     * How wide a city draws, in pixels.
     *
     * The weight is already the square root of the population share, so
     * this is a straight line through it: area ends up proportional to
     * people. The floor keeps the smallest cities from vanishing into
     * sub-pixel nothing at small canvas sizes, which would quietly delete
     * about a third of the map.
     */
    const dotPx = (index: number, f: Frame) =>
      Math.max(0.9, f.radius * (0.005 + 0.028 * cityWeights[index]));

    const render = () => {
      // Fit the sphere to the smaller side of wherever it has been biased
      // to, so moving it shrinks it instead of clipping it off the canvas.
      const roomX = Math.min(
        width * biasRef.current,
        width * (1 - biasRef.current),
      );
      const roomY = Math.min(
        height * biasYRef.current,
        height * (1 - biasYRef.current),
      );
      const radius = Math.min(roomX * 0.94, roomY * 0.94);
      const f: Frame = {
        cx: width * biasRef.current,
        cy: height * biasYRef.current,
        radius,
        cosYaw: Math.cos(yaw.current),
        sinYaw: Math.sin(yaw.current),
        cosPitch: Math.cos(pitch.current),
        sinPitch: Math.sin(pitch.current),
      };
      frameRef.current = f;

      ctx.clearRect(0, 0, width, height);

      // Sky first. Stars sit behind everything and are the cheapest way to
      // say this is a body in space rather than a circle on a page.
      for (const star of STARS) {
        ctx.beginPath();
        ctx.arc(star.x * width, star.y * height, star.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(210, 226, 245, ${star.a})`;
        ctx.fill();
      }

      /*
       * Airglow rather than daylight scattering. On the night side the
       * atmosphere is a thin cold arc a few pixels deep, not the broad blue
       * bloom a lit planet carries — widening it here is the single fastest
       * way to make this stop looking like night.
       */
      const halo = ctx.createRadialGradient(
        f.cx,
        f.cy,
        radius * 0.985,
        f.cx,
        f.cy,
        radius * 1.09,
      );
      halo.addColorStop(0, "rgba(96, 156, 214, 0.40)");
      halo.addColorStop(0.4, "rgba(96, 156, 214, 0.13)");
      halo.addColorStop(1, "rgba(96, 156, 214, 0)");
      ctx.beginPath();
      ctx.arc(f.cx, f.cy, radius * 1.09, 0, Math.PI * 2);
      ctx.fillStyle = halo;
      ctx.fill();

      // The night side. Land and sea are the same dark.
      const ocean = ctx.createRadialGradient(
        f.cx - radius * 0.4,
        f.cy - radius * 0.45,
        radius * 0.05,
        f.cx,
        f.cy,
        radius,
      );
      ocean.addColorStop(0, "#0b1622");
      ocean.addColorStop(0.55, "#060c14");
      ocean.addColorStop(1, "#020509");
      ctx.beginPath();
      ctx.arc(f.cx, f.cy, radius, 0, Math.PI * 2);
      ctx.fillStyle = ocean;
      ctx.fill();

      // Limb darkening: the edge falls away from the viewer, so it loses
      // light. Without this the sphere reads as a flat disc no matter how
      // the coastlines are drawn.
      const limb = ctx.createRadialGradient(
        f.cx,
        f.cy,
        radius * 0.55,
        f.cx,
        f.cy,
        radius,
      );
      limb.addColorStop(0, "rgba(1, 3, 7, 0)");
      limb.addColorStop(1, "rgba(1, 3, 7, 0.8)");
      ctx.beginPath();
      ctx.arc(f.cx, f.cy, radius, 0, Math.PI * 2);
      ctx.fillStyle = limb;
      ctx.fill();

      ctx.strokeStyle = "rgba(130, 175, 225, 0.34)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(f.cx, f.cy, radius, 0, Math.PI * 2);
      ctx.stroke();

      ctx.lineWidth = 0.6;
      ctx.strokeStyle = "rgba(120, 160, 210, 0.06)";
      for (const line of graticule) strokePolyline(line, f, false);

      ctx.lineWidth = 0.8;
      ctx.strokeStyle = "rgba(120, 160, 210, 0.20)";
      for (const ring of coastVectors) strokePolyline(ring, f, true);

      /*
       * Cities with no market yet.
       *
       * Batched into three depth bands rather than filled one by one: 999
       * separate paths a frame is wasteful, and a single flat pass makes
       * the sphere look like a sticker. Three passes is enough for the eye
       * to read curvature, because a dot near the limb genuinely is dimmer.
       *
       * These dots are the only drawing of the ground there is. Where they
       * crowd, you are looking at the Nile, the Ganges, the eastern
       * seaboard; where they stop, you are looking at the Sahara or the
       * Pacific. Nothing else on this globe says that.
       */
      const bands = [
        { min: 0.62, alpha: 0.85 },
        { min: 0.28, alpha: 0.55 },
        { min: 0.02, alpha: 0.28 },
      ];

      for (let b = 0; b < bands.length; b += 1) {
        const band = bands[b];
        const max = b === 0 ? 2 : bands[b - 1].min;
        ctx.beginPath();
        for (let i = 0; i < cities.length; i += 1) {
          if (marketFor(cities[i].id).isLive) continue;
          const c = project(
            cityCentres[i * 3],
            cityCentres[i * 3 + 1],
            cityCentres[i * 3 + 2],
            f,
          );
          if (c.z <= band.min || c.z > max) continue;
          const r = dotPx(i, f);
          ctx.moveTo(c.x + r, c.y);
          ctx.arc(c.x, c.y, r, 0, Math.PI * 2);
        }
        ctx.fillStyle = `rgba(176, 205, 240, ${band.alpha})`;
        ctx.fill();
      }

      // Live markets, brightness by activity.
      for (let i = 0; i < cities.length; i += 1) {
        const market = marketFor(cities[i].id);
        if (!market.isLive) continue;
        const c = project(
          cityCentres[i * 3],
          cityCentres[i * 3 + 1],
          cityCentres[i * 3 + 2],
          f,
        );
        if (c.z <= 0.02) continue;
        const heat = market.activity / peakActivity;
        // Mint once a city has the most owners: at a glance, amber is a
        // market that exists and mint is one people are piling into.
        const alpha = (0.45 + heat * 0.55) * Math.min(1, c.z * 2.2);
        const rgb =
          market.owners >= CROWDED_OWNERS ? "91, 214, 160" : "255, 158, 44";
        const r = dotPx(i, f);

        // A halo first, so an opened city is findable on a spinning globe
        // before it is close enough to read. It is sized off the dot, so a
        // traded megacity glows across a continent and a traded small one
        // stays a pinprick — the halo carries scale as much as the dot.
        const glow = Math.max(r * 6, 14);
        const spot = ctx.createRadialGradient(c.x, c.y, 0, c.x, c.y, glow);
        spot.addColorStop(0, `rgba(${rgb}, ${0.5 * alpha})`);
        spot.addColorStop(1, `rgba(${rgb}, 0)`);
        ctx.fillStyle = spot;
        ctx.fillRect(c.x - glow, c.y - glow, glow * 2, glow * 2);

        ctx.beginPath();
        ctx.arc(c.x, c.y, r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${rgb}, ${alpha})`;
        ctx.fill();
      }

      const emphasise = (id: number | null, colour: string, lineWidth: number) => {
        if (id === null) return;
        const index = cities.findIndex((city) => city.id === id);
        if (index < 0) return;
        const c = project(
          cityCentres[index * 3],
          cityCentres[index * 3 + 1],
          cityCentres[index * 3 + 2],
          f,
        );
        if (c.z <= 0) return;
        // Stood off the dot rather than drawn on it, so the ring reads on
        // a two-pixel city as clearly as on Tokyo.
        ctx.beginPath();
        ctx.arc(c.x, c.y, dotPx(index, f) + 5, 0, Math.PI * 2);
        ctx.strokeStyle = colour;
        ctx.lineWidth = lineWidth;
        ctx.stroke();
      };

      emphasise(hoveredRef.current?.id ?? null, "rgba(255, 255, 255, 0.65)", 1.2);
      emphasise(selectedRef.current, "#ff9e2c", 2);

      yaw.current += spin;
      raf = window.requestAnimationFrame(render);
    };

    const start = () => {
      if (running) return;
      running = true;
      render();
    };
    const stop = () => {
      if (!running) return;
      running = false;
      window.cancelAnimationFrame(raf);
    };
    const onVisibility = () => {
      if (document.hidden) stop();
      else if (visible) start();
    };

    const onPointerDown = (event: PointerEvent) => {
      dragging = true;
      spin = 0;
      lastX = event.clientX;
      lastY = event.clientY;
      canvas.setPointerCapture(event.pointerId);
    };
    const onPointerMove = (event: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      if (!dragging) {
        setHovered(cityAt(event.clientX - rect.left, event.clientY - rect.top));
        return;
      }
      yaw.current += (event.clientX - lastX) * 0.006;
      pitch.current = Math.min(
        1.35,
        Math.max(-1.35, pitch.current + (event.clientY - lastY) * 0.006),
      );
      lastX = event.clientX;
      lastY = event.clientY;
    };
    const onPointerUp = (event: PointerEvent) => {
      if (!dragging) return;
      dragging = false;
      spin = reduceMotion ? 0 : 0.0016;
      canvas.releasePointerCapture(event.pointerId);
    };

    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(canvas);
    resize();

    const visibilityObserver = new IntersectionObserver(
      ([entry]) => {
        visible = entry.isIntersecting;
        if (visible && !document.hidden) start();
        else stop();
      },
      { threshold: 0 },
    );
    visibilityObserver.observe(canvas);
    document.addEventListener("visibilitychange", onVisibility);
    canvas.addEventListener("pointerdown", onPointerDown);
    canvas.addEventListener("pointermove", onPointerMove);
    canvas.addEventListener("pointerup", onPointerUp);
    canvas.addEventListener("pointercancel", onPointerUp);

    return () => {
      stop();
      resizeObserver.disconnect();
      visibilityObserver.disconnect();
      document.removeEventListener("visibilitychange", onVisibility);
      canvas.removeEventListener("pointerdown", onPointerDown);
      canvas.removeEventListener("pointermove", onPointerMove);
      canvas.removeEventListener("pointerup", onPointerUp);
      canvas.removeEventListener("pointercancel", onPointerUp);
    };
  }, [cityAt, marketFor, peakActivity]);

  const handleClick = (event: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    onSelect(cityAt(event.clientX - rect.left, event.clientY - rect.top));
  };

  return (
    <div className={clsx("relative", className)}>
      <canvas
        ref={canvasRef}
        role="img"
        aria-label={`Rotating globe showing ${cities.length} cities`}
        className="h-full w-full cursor-crosshair touch-none"
        onPointerLeave={() => setHovered(null)}
        onClick={handleClick}
      />

      {hovered && (
        <div className="pointer-events-none absolute left-4 top-4 border border-rule-strong bg-void/95 px-3 py-2">
          <div className="flex items-baseline gap-3">
            <span className="type-data text-chalk">{hovered.name}</span>
            <span className="type-label text-signal">
              #{String(hovered.id).padStart(3, "0")}
            </span>
          </div>
          <span className="type-data mt-1 block text-chalk-muted">
            {hovered.country} · {population(hovered.pop)}
          </span>
          <span className="type-data block text-chalk-soft">
            {marketFor(hovered.id).isLive
              ? `${marketFor(hovered.id).owners} owners`
              : "Open — no market yet"}
          </span>
        </div>
      )}

      <dl className="pointer-events-none absolute inset-x-0 bottom-0 hidden flex-wrap items-baseline gap-x-6 gap-y-1 border-t border-rule px-4 py-2 sm:flex">
        {[
          ["Ranked", `${cities.length} cities by population`],
          [
            "Status",
            totals.liveCities === 0
              ? "Every city open · none taken"
              : `${totals.liveCities} opened · ${totals.totalCities - totals.liveCities} still open`,
          ],
          ["Controls", "Drag to spin · click a city"],
        ].map(([key, value]) => (
          <div key={key} className="flex items-baseline gap-2">
            <dt className="type-label text-chalk-muted">{key}</dt>
            <dd className="type-data text-chalk-soft">{value}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
