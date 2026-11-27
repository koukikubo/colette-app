"use client";
import { useEffect, useState } from "react";

type Box = { left: number; top: number; width: number; height: number };
// 画面の実要素をハイライトする。隠れたメニューは開閉ボタンを示す。
export function GuideSpotlight({ target }: { target: string }) {
  const [measured, setMeasured] = useState<{ target: string; box: Box } | null>(
    null,
  );
  useEffect(() => {
    let frame = 0;
    const measure = () => {
      let element = document.querySelector<HTMLElement>(
        `[data-guide-target="${target}"]`,
      );
      let rect = element?.getBoundingClientRect();
      if (
        !rect ||
        rect.width === 0 ||
        rect.height === 0 ||
        rect.right <= 0 ||
        rect.bottom <= 0 ||
        rect.left >= innerWidth ||
        rect.top >= innerHeight
      ) {
        element = document.querySelector<HTMLElement>(
          '[data-guide-target="navigation"]',
        );
        rect = element?.getBoundingClientRect();
      }
      if (!rect || !rect.width || !rect.height) return;
      const left = Math.max(4, rect.left - 4),
        top = Math.max(4, rect.top - 4);
      setMeasured({
        target,
        box: {
          left,
          top,
          width: Math.max(0, Math.min(innerWidth - 4, rect.right + 4) - left),
          height: Math.max(0, Math.min(innerHeight - 4, rect.bottom + 4) - top),
        },
      });
    };
    const schedule = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(measure);
    };
    schedule();
    window.addEventListener("resize", schedule);
    window.addEventListener("scroll", schedule, true);
    const observer = new ResizeObserver(schedule);
    const element = document.querySelector(`[data-guide-target="${target}"]`);
    if (element) observer.observe(element);
    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      window.removeEventListener("resize", schedule);
      window.removeEventListener("scroll", schedule, true);
    };
  }, [target]);
  return measured?.target === target ? (
    <div
      aria-hidden="true"
      data-slot="guide-spotlight"
      className="pointer-events-none fixed z-40 rounded-xl ring-4 ring-primary"
      style={{ ...measured.box, boxShadow: "0 0 0 9999px rgb(0 0 0 / 35%)" }}
    />
  ) : null;
}
