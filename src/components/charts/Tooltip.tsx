"use client";

import { useState, type PointerEvent, type ReactNode } from "react";
import styles from "./charts.module.css";

interface Tip {
  x: number;
  y: number;
  content: ReactNode;
}

const WIDTH = 240;

/** A tooltip that follows the pointer: render `tooltip`, call show() on move and hide() on leave. */
export function useTooltip() {
  const [tip, setTip] = useState<Tip | null>(null);

  const show = (e: PointerEvent, content: ReactNode) => setTip({ x: e.clientX, y: e.clientY, content });
  const hide = () => setTip(null);

  let tooltip: ReactNode = null;
  if (tip) {
    const above = tip.y > 80;
    const left = Math.max(8, Math.min(tip.x + 14, window.innerWidth - WIDTH - 8));
    tooltip = (
      <div
        className={styles.tooltip}
        style={{ left, top: above ? tip.y - 12 : tip.y + 16, transform: above ? "translateY(-100%)" : undefined }}
      >
        {tip.content}
      </div>
    );
  }
  return { tooltip, show, hide };
}
