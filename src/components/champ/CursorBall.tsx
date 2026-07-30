import { useEffect, useRef, useState } from "react";
import { useFinePointer, useReducedMotion } from "@/lib/media";

/** Desktop-only cricket-ball cursor with three ghost balls. Off under reduced motion. */
export function CursorBall({ enabled }: { enabled: boolean }) {
  const fine = useFinePointer();
  const reduced = useReducedMotion();
  const active = enabled && fine && !reduced;
  const balls = useRef<(HTMLDivElement | null)[]>([]);
  const [mode, setMode] = useState<"idle" | "cta" | "press">("idle");

  useEffect(() => {
    if (!active) {
      document.body.classList.remove("no-cursor");
      return;
    }
    document.body.classList.add("no-cursor");
    const pos = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
    const trail = balls.current.map(() => ({ x: pos.x, y: pos.y }));
    let raf = 0;

    const move = (e: PointerEvent) => {
      pos.x = e.clientX;
      pos.y = e.clientY;
      const el = e.target as HTMLElement;
      const overCta = !!el.closest("button,a,[role='button']");
      const overInput = !!el.closest("input,textarea");
      setMode(overInput ? "idle" : overCta ? "cta" : "idle");
      document.body.classList.toggle("no-cursor", !overInput);
    };
    const down = () => setMode("press");
    const up = () => setMode("idle");

    const tick = () => {
      trail.forEach((t, i) => {
        const target = i === 0 ? pos : trail[i - 1];
        t.x += (target.x - t.x) * (0.34 - i * 0.06);
        t.y += (target.y - t.y) * (0.34 - i * 0.06);
        const node = balls.current[i];
        if (node) node.style.transform = `translate3d(${t.x}px, ${t.y}px, 0) translate(-50%, -50%)`;
      });
      raf = requestAnimationFrame(tick);
    };
    tick();
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerdown", down);
    window.addEventListener("pointerup", up);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerdown", down);
      window.removeEventListener("pointerup", up);
      document.body.classList.remove("no-cursor");
    };
  }, [active]);

  if (!active) return null;

  const size = mode === "cta" ? 36 : 22;

  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 z-[90]">
      {[0, 1, 2, 3].map((i) => (
        <div
          key={i}
          ref={(n) => {
            balls.current[i] = n;
          }}
          className="absolute left-0 top-0 rounded-full transition-[width,height,opacity] duration-150"
          style={{
            width: i === 0 ? size : size * (0.7 - i * 0.14),
            height: i === 0 ? size : size * (0.7 - i * 0.14),
            opacity: i === 0 ? 1 : 0.28 - i * 0.07,
            background: "var(--color-win)",
            border: i === 0 ? "2px solid var(--color-ink)" : "none",
            boxShadow: i === 0 && mode === "cta" ? "0 0 0 6px color-mix(in oklab, var(--color-gold) 55%, transparent)" : "none",
            scale: i === 0 && mode === "press" ? "1.15 0.85" : "1 1",
          }}
        />
      ))}
    </div>
  );
}
