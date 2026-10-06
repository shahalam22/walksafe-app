"use client";

import { useState, type PointerEvent } from "react";
import { pretty } from "@/lib/format";
import { useTooltip } from "./Tooltip";
import styles from "./charts.module.css";

export interface Point {
  x: number;
  y: number | null;
  label?: string | null;
}

const W = 720, H = 220, L = 44, R = 16, T = 14, B = 28;

function niceMax(v: number) {
  const p = 10 ** Math.floor(Math.log10(v));
  for (const m of [1, 2, 2.5, 5, 10]) if (m * p >= v) return m * p;
  return 10 * p;
}

/** One line over x (increasing), with a crosshair and tooltip on hover. */
export function LineChart({ points, yUnit = "", xName = "Frame" }: { points: Point[]; yUnit?: string; xName?: string }) {
  const { tooltip, show, hide } = useTooltip();
  const [hover, setHover] = useState<number | null>(null);
  const pts = points.filter((p): p is Point & { y: number } => p.y != null && Number.isFinite(p.y));
  if (pts.length < 2) return <p className="empty">Not enough frames to draw</p>;

  const ys = pts.map((p) => p.y);
  const x0 = pts[0].x, x1 = pts[pts.length - 1].x;
  const yMax = niceMax(Math.max(...ys, 0.1));
  const sx = (x: number) => L + ((x - x0) / (x1 - x0 || 1)) * (W - L - R);
  const sy = (y: number) => T + (1 - y / yMax) * (H - T - B);

  const d = pts.map((p, i) => `${i ? "L" : "M"}${sx(p.x).toFixed(1)},${sy(p.y).toFixed(1)}`).join("");
  const last = pts[pts.length - 1];
  const yTicks = [0, 1, 2, 3, 4].map((i) => (yMax * i) / 4);
  const xTicks = [x0, Math.round((x0 + x1) / 2), x1];
  const best = hover == null ? null : pts[hover];

  function onMove(e: PointerEvent<SVGSVGElement>) {
    const box = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - box.left) / box.width) * W;
    let i = 0;
    pts.forEach((p, j) => {
      if (Math.abs(sx(p.x) - x) < Math.abs(sx(pts[i].x) - x)) i = j;
    });
    const p = pts[i];
    setHover(i);
    show(e, <>
      <b>{p.y.toFixed(2)} {yUnit}</b><br />{xName} {p.x}
      {p.label && <><br />{pretty(p.label)}</>}
    </>);
  }

  return (
    <>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className={styles.line}
        role="img"
        aria-label={`Line chart, ${pts.length} points, highest ${Math.max(...ys).toFixed(2)} ${yUnit}`}
        onPointerMove={onMove}
        onPointerLeave={() => { setHover(null); hide(); }}
      >
        {yTicks.map((v, i) => (
          <g key={i}>
            <line x1={L} x2={W - R} y1={sy(v)} y2={sy(v)} className={i ? styles.grid : styles.axis} />
            <text x={L - 6} y={sy(v) + 4} className={styles.tick} textAnchor="end">{v.toFixed(v < 1 ? 2 : 1)}</text>
          </g>
        ))}
        {xTicks.map((v, i) => (
          <text key={i} x={sx(v)} y={H - 8} className={styles.tick} textAnchor="middle">{v}</text>
        ))}
        <path d={`${d}L${sx(x1)},${sy(0)}L${sx(x0)},${sy(0)}Z`} className={styles.area} />
        <path d={d} className={styles.path} />
        <circle cx={sx(last.x)} cy={sy(last.y)} r={4} className={styles.dot} />
        {best && (
          <>
            <line x1={sx(best.x)} x2={sx(best.x)} y1={T} y2={H - B} className={styles.crosshair} />
            <circle cx={sx(best.x)} cy={sy(best.y)} r={4} className={styles.dot} />
          </>
        )}
      </svg>
      {tooltip}
    </>
  );
}
