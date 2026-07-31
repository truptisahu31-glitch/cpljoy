/* ---------------------------------------------------------------------------
   Partner marks. Real assets from `Willow TV Project/Predictor/public/logos`,
   copied into `public/logos`.
   --------------------------------------------------------------------------- */

/** Champhunt lockup — the PNG is a full ball-mark + wordmark (294×42). */
export function ChamphuntLogo({
  height,
  className = "",
}: {
  height?: number;
  className?: string;
}) {
  return (
    <img
      src="/logos/champhunt.png"
      alt="Champhunt"
      style={height ? { height, width: "auto" } : { width: "auto" }}
      className={`block w-auto shrink-0 object-contain ${className}`}
      loading="eager"
      decoding="async"
    />
  );
}

/**
 * Willow Sports lockup.
 *
 * The source PNG is a navy wordmark on transparent, which disappears against
 * the indigo header and footer. Rather than sit it on a white box, the mark is
 * rendered as solid white so it reads on any dark surface. Trade-off: this drops
 * Willow's brand red — preserving that would need a light surface behind it.
 */
export function WillowLogo({
  height,
  className = "",
}: {
  height?: number;
  className?: string;
}) {
  return (
    <img
      src="/logos/willow-sports.png"
      alt="Willow Sports"
      style={
        height
          ? { height, width: "auto", filter: "brightness(0) invert(1)" }
          : { width: "auto", filter: "brightness(0) invert(1)" }
      }
      className={`block w-auto shrink-0 object-contain ${className}`}
      // Eager: this sits in the fixed header, above the fold on every page.
      loading="eager"
      decoding="async"
    />
  );
}

/**
 * The two marks together, as they appear in the header and footer.
 *
 * `stacked` drops the divider and wraps, for the narrow mobile menu where a
 * single row would compress both marks past legibility.
 */
export function PartnerLockup({
  champHeight = 26,
  willowHeight = 30,
  className = "",
}: {
  champHeight?: number;
  willowHeight?: number;
  className?: string;
}) {
  return (
    <div className={`flex min-w-0 items-center gap-2.5 ${className}`}>
      <ChamphuntLogo height={champHeight} />
      <span aria-hidden="true" className="h-5 w-px shrink-0 bg-cream/30" />
      <WillowLogo height={willowHeight} />
    </div>
  );
}
