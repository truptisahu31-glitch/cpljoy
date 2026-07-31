import { useEffect, useState } from "react";
import { AnimatePresence, motion, useMotionValue, useSpring, useTransform, type MotionValue } from "motion/react";
import { useFinePointer, useReducedMotion, useWideViewport } from "@/lib/media";

/* ---------------------------------------------------------------------------
   Desktop-only cricket cursor.

   Ported from the Pixel Perfect showcase. The head is spring-followed rather
   than eased frame-by-frame, which is what gives it weight, and it rolls: spin
   accumulates with the distance travelled instead of running on a timer, so the
   seam turns at the speed of the hand.

   The trail is the same glyph as the head, nine copies of it on progressively
   softer springs. It used to be plain circles, which meant the bat dragged a
   tail of balls behind it. Sharing one glyph keeps the shape honest in both
   modes.

   One context change: hovering anything clickable swaps the ball for a bat and
   rings it. Everything else stays a ball, so the shape means "you can hit this"
   rather than "you are over a large section". Text inputs hand the system caret
   back — a custom cursor over a text field costs the user the one affordance
   that tells them they can type.
   --------------------------------------------------------------------------- */

/** The cursor's shape. One definition, drawn at whatever size a layer needs. */
function Glyph({
  bat,
  size,
  rotate,
}: {
  bat: boolean;
  size: number;
  rotate?: MotionValue<string>;
}) {
  return (
    <motion.svg width={size} height={size} viewBox="0 0 24 24" style={rotate ? { rotate } : undefined}>
      {bat ? (
        <>
          <rect
            x="14"
            y="2"
            width="6"
            height="4"
            rx="1.4"
            transform="rotate(45 17 4)"
            fill="var(--color-cream)"
            stroke="var(--color-ink)"
            strokeWidth="2"
          />
          <rect
            x="4"
            y="8"
            width="9"
            height="13"
            rx="3"
            transform="rotate(45 8.5 14.5)"
            fill="var(--color-gold)"
            stroke="var(--color-ink)"
            strokeWidth="2"
          />
        </>
      ) : (
        <>
          <circle
            cx="12"
            cy="12"
            r="10"
            fill="var(--color-live)"
            stroke="var(--color-ink)"
            strokeWidth="2"
          />
          <path
            d="M7 4.6C9.8 8 9.8 16 7 19.4"
            fill="none"
            stroke="var(--color-cream)"
            strokeWidth="1.6"
          />
        </>
      )}
    </motion.svg>
  );
}

/** A ball knocked off the bat: where it started and which way it went. */
type Spark = { id: number; x: number; y: number; dx: number; dy: number; born: number };

/** Minimum turn (radians) that counts as a change of direction — a shot. */
const TURN_THRESHOLD = 0.7;
/** Minimum travel per move event, so a jittering hand does not spray balls. */
const MIN_SPEED = 6;
/** Floor between spawns, so a fast scribble cannot flood the screen. */
const SPAWN_COOLDOWN_MS = 90;
/** How far a knocked ball travels before it is gone. */
const SPARK_DISTANCE = 190;
/** Knocked balls are the same ball as the cursor, at its resting size. */
const SPARK_SIZE = 22;
/** Hotter than the cursor's red so a struck ball reads against cream sections. */
const SPARK_RED = "#ff1f2e";
const SPARK_MS = 820;

export function CursorBall({ enabled }: { enabled: boolean }) {
  const fine = useFinePointer();
  const wide = useWideViewport();
  const reduced = useReducedMotion();
  const [active, setActive] = useState(false);
  const [big, setBig] = useState(false);
  const [bat, setBat] = useState(false);
  const [pressed, setPressed] = useState(false);
  const [sparks, setSparks] = useState<Spark[]>([]);


  // Off-screen until the first move, so it never flashes at the origin.
  const x = useMotionValue(-100);
  const y = useMotionValue(-100);
  const angle = useMotionValue(0);

  /* Spring chain.
     Fluidity comes from keeping the stiffness steps close together and the mass
     low: the old chain dropped 500 → 260 → 170 → 110, so the last ball lagged
     far enough to read as a separate object rather than a tail. These sit
     nearer each other and each layer is only slightly heavier than the one in
     front, so the trail moves as one ribbon. Damping stays high enough that
     nothing overshoots and wobbles. */
  const head = { stiffness: 700, damping: 34, mass: 0.5 };
  const sx = useSpring(x, head);
  const sy = useSpring(y, head);

  const t1 = { stiffness: 460, damping: 30, mass: 0.64 };
  const t2 = { stiffness: 360, damping: 30, mass: 0.78 };
  const t3 = { stiffness: 285, damping: 30, mass: 0.92 };
  const t4 = { stiffness: 225, damping: 30, mass: 1.06 };
  const t5 = { stiffness: 178, damping: 30, mass: 1.2 };
  const t6 = { stiffness: 140, damping: 30, mass: 1.34 };
  const t7 = { stiffness: 112, damping: 30, mass: 1.48 };
  const t8 = { stiffness: 90, damping: 30, mass: 1.62 };
  const t9 = { stiffness: 72, damping: 30, mass: 1.76 };

  const tx1 = useSpring(x, t1);
  const ty1 = useSpring(y, t1);
  const tx2 = useSpring(x, t2);
  const ty2 = useSpring(y, t2);
  const tx3 = useSpring(x, t3);
  const ty3 = useSpring(y, t3);
  const tx4 = useSpring(x, t4);
  const ty4 = useSpring(y, t4);
  const tx5 = useSpring(x, t5);
  const ty5 = useSpring(y, t5);
  const tx6 = useSpring(x, t6);
  const ty6 = useSpring(y, t6);
  const tx7 = useSpring(x, t7);
  const ty7 = useSpring(y, t7);
  const tx8 = useSpring(x, t8);
  const ty8 = useSpring(y, t8);
  const tx9 = useSpring(x, t9);
  const ty9 = useSpring(y, t9);

  // Rotation trails too, so a bat in the tail lies along the swing rather than
  // sitting at a fixed angle while the head turns.
  const rot = useSpring(angle, { stiffness: 180, damping: 22, mass: 0.5 });
  const rotT1 = useSpring(angle, { stiffness: 140, damping: 22, mass: 0.7 });
  const rotT2 = useSpring(angle, { stiffness: 115, damping: 22, mass: 0.85 });
  const rotT3 = useSpring(angle, { stiffness: 95, damping: 22, mass: 1 });
  const rotT4 = useSpring(angle, { stiffness: 80, damping: 22, mass: 1.15 });
  const rotT5 = useSpring(angle, { stiffness: 68, damping: 22, mass: 1.3 });
  const rotT6 = useSpring(angle, { stiffness: 58, damping: 22, mass: 1.45 });
  const rotT7 = useSpring(angle, { stiffness: 50, damping: 22, mass: 1.6 });
  const rotT8 = useSpring(angle, { stiffness: 43, damping: 22, mass: 1.75 });
  const rotT9 = useSpring(angle, { stiffness: 37, damping: 22, mass: 1.9 });

  const rotDeg = useTransform(rot, (v) => `${v}deg`);
  const rotDeg1 = useTransform(rotT1, (v) => `${v}deg`);
  const rotDeg2 = useTransform(rotT2, (v) => `${v}deg`);
  const rotDeg3 = useTransform(rotT3, (v) => `${v}deg`);
  const rotDeg4 = useTransform(rotT4, (v) => `${v}deg`);
  const rotDeg5 = useTransform(rotT5, (v) => `${v}deg`);
  const rotDeg6 = useTransform(rotT6, (v) => `${v}deg`);
  const rotDeg7 = useTransform(rotT7, (v) => `${v}deg`);
  const rotDeg8 = useTransform(rotT8, (v) => `${v}deg`);
  const rotDeg9 = useTransform(rotT9, (v) => `${v}deg`);

  useEffect(() => {
    /* `wide` as well as `fine`: narrowing a desktop window past `md` hides the
       cursor artwork but used to leave `no-cursor` on <body>, so the viewport
       had no pointer at all. Below 768px the system cursor comes back, and
       widening past it hands the ball and bat over again. */
    if (!enabled || !fine || !wide || reduced) {
      setActive(false);
      document.body.classList.remove("no-cursor");
      return;
    }
    setActive(true);
    document.body.classList.add("no-cursor");

    let last = { x: 0, y: 0 };
    let spin = 0;
    // Previous travel direction, for detecting a turn.
    let dir: { x: number; y: number } | null = null;
    let lastSpawn = 0;
    let sparkId = 0;

    const move = (e: MouseEvent) => {
      const dx = e.clientX - last.x;
      const dy = e.clientY - last.y;
      // Distance travelled drives rotation, so the ball rolls rather than spins
      // on the spot.
      const speed = Math.hypot(dx, dy);
      spin += speed * 2;
      angle.set(spin);

      const el = e.target as HTMLElement | null;
      const interactive = !!el?.closest("button, a, [role='button'], [data-cursor='card']");

      /* Knock a ball off the bat on a change of direction.
         A shot is a turn, not just movement: comparing the new travel vector
         with the previous one means balls fly when the hand actually changes
         its mind, rather than streaming continuously while it drifts.

         `interactive` is read from this event rather than from a ref mirroring
         the `bat` state — the ref lags by one render, which spawned a stray ball
         on the move that left the button. */
      if (speed > MIN_SPEED) {
        const nx = dx / speed;
        const ny = dy / speed;
        if (dir && interactive) {
          // Dot product of two unit vectors is the cosine of the turn.
          const turn = Math.acos(Math.max(-1, Math.min(1, dir.x * nx + dir.y * ny)));
          const now = performance.now();
          if (turn > TURN_THRESHOLD && now - lastSpawn > SPAWN_COOLDOWN_MS) {
            lastSpawn = now;
            // Fly off along the new direction, with a little spread so repeated
            // shots do not stack along one line.
            const spread = (Math.random() - 0.5) * 0.9;
            const cos = Math.cos(spread);
            const sin = Math.sin(spread);
            const id = ++sparkId;
            const spark: Spark = {
              id,
              x: e.clientX,
              y: e.clientY,
              dx: (nx * cos - ny * sin) * SPARK_DISTANCE,
              dy: (nx * sin + ny * cos) * SPARK_DISTANCE,
              born: now,
            };
            // Prune by age on every insert as well as on a timer: a
            // backgrounded tab clamps timers hard, and stale balls would
            // otherwise sit on screen until the next one happened to arrive.
            setSparks((list) => [
              ...list.filter((s) => now - s.born < SPARK_MS),
              spark,
            ].slice(-12));
            window.setTimeout(
              () => setSparks((list) => list.filter((s) => s.id !== id)),
              SPARK_MS,
            );
          }
        }
        dir = { x: nx, y: ny };
      }

      last = { x: e.clientX, y: e.clientY };
      x.set(e.clientX);
      y.set(e.clientY);

      const input = !!el?.closest("input, textarea, select");
      // The bat is the hover state for anything clickable — it is the "you can
      // hit this" signal. Everywhere else stays a ball, including over the
      // table, which used to swap the shape just for being a large region.
      setBig(interactive);
      setBat(interactive);
      document.body.classList.toggle("no-cursor", !input);
    };
    const down = () => setPressed(true);
    const up = () => setPressed(false);

    window.addEventListener("mousemove", move);
    window.addEventListener("mousedown", down);
    window.addEventListener("mouseup", up);
    return () => {
      window.removeEventListener("mousemove", move);
      window.removeEventListener("mousedown", down);
      window.removeEventListener("mouseup", up);
      document.body.classList.remove("no-cursor");
      setActive(false);
    };
  }, [enabled, fine, wide, reduced, x, y, angle]);

  if (!active) return null;

  const size = big ? 36 : 22;

  /* Nine followers, at gentle size and opacity steps — a long, gradual tail
     reads as motion blur instead of as a few discrete followers. */
  const trails: Array<{
    x: MotionValue<number>;
    y: MotionValue<number>;
    r: MotionValue<string>;
    o: number;
    s: number;
  }> = [
    { x: tx1, y: ty1, r: rotDeg1, o: 0.58, s: 0.76 },
    { x: tx2, y: ty2, r: rotDeg2, o: 0.48, s: 0.67 },
    { x: tx3, y: ty3, r: rotDeg3, o: 0.39, s: 0.58 },
    { x: tx4, y: ty4, r: rotDeg4, o: 0.31, s: 0.49 },
    { x: tx5, y: ty5, r: rotDeg5, o: 0.24, s: 0.4 },
    { x: tx6, y: ty6, r: rotDeg6, o: 0.19, s: 0.35 },
    { x: tx7, y: ty7, r: rotDeg7, o: 0.14, s: 0.3 },
    { x: tx8, y: ty8, r: rotDeg8, o: 0.1, s: 0.25 },
    { x: tx9, y: ty9, r: rotDeg9, o: 0.06, s: 0.2 },
  ];

  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 z-[95] hidden md:block">
      {/* Balls knocked off the bat. They leave from where the shot happened, so
          they are positioned absolutely rather than following the cursor. */}
      <AnimatePresence>
        {sparks.map((sp) => (
          <motion.span
            key={sp.id}
            className="absolute left-0 top-0 flex items-center justify-center"
            initial={{
              x: sp.x,
              y: sp.y,
              opacity: 1,
              scale: 1,
              rotate: 0,
              translateX: "-50%",
              translateY: "-50%",
            }}
            // Spins as it flies, like a struck ball, and stays near full size —
            // shrinking away made it hard to follow.
            animate={{
              x: sp.x + sp.dx,
              y: sp.y + sp.dy,
              // Hold at full opacity for most of the flight, then fade. Fading
              // across the whole duration meant the ball was already half gone
              // while it was still beside the bat, which is why it read as
              // invisible.
              opacity: [1, 1, 0],
              scale: 0.9,
              rotate: 260,
            }}
            exit={{ opacity: 0 }}
            transition={{
              duration: SPARK_MS / 1000,
              ease: [0.16, 1, 0.3, 1],
              opacity: { duration: SPARK_MS / 1000, times: [0, 0.62, 1], ease: "linear" },
            }}
            style={{
              // Overriding the variable locally re-tints the shared glyph without
              // a second copy of the artwork, and the glow lifts it off busy
              // photography.
              ["--color-live" as string]: SPARK_RED,
              filter: `drop-shadow(0 0 6px ${SPARK_RED}) drop-shadow(0 0 2px rgba(0,0,0,0.35))`,
            }}
          >
            <Glyph bat={false} size={SPARK_SIZE} />
          </motion.span>
        ))}
      </AnimatePresence>

      {/* Furthest-back layer first, so the head paints over its own tail. */}
      {trails
        .slice()
        .reverse()
        .map((t, i) => (
          <motion.span
            key={i}
            className="absolute left-0 top-0 flex items-center justify-center"
            style={{
              x: t.x,
              y: t.y,
              opacity: t.o,
              translateX: "-50%",
              translateY: "-50%",
            }}
          >
            <Glyph bat={bat} size={Math.round(size * t.s)} rotate={t.r} />
          </motion.span>
        ))}

      <motion.span
        className="absolute left-0 top-0 flex items-center justify-center"
        style={{ x: sx, y: sy, translateX: "-50%", translateY: "-50%" }}
        animate={{ scaleY: pressed ? 0.8 : 1, scaleX: pressed ? 1.15 : 1 }}
      >
        {big && (
          <span
            className="absolute rounded-full border-[3px]"
            style={{ width: size + 16, height: size + 16, borderColor: "var(--color-gold)" }}
          />
        )}
        <Glyph bat={bat} size={size} rotate={rotDeg} />
      </motion.span>
    </div>
  );
}
