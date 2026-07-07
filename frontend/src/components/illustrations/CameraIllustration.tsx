/**
 * Original illustration — a minimalist front-facing camera, built from
 * plain circles/rects plus computed tick and blade-seam lines. No stock
 * imagery involved; every coordinate below is generated geometry, not
 * traced or copied from an existing photo or icon set.
 */
export default function CameraIllustration({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 400 320" className={className} xmlns="http://www.w3.org/2000/svg">
      {/* Body */}
      <rect x="40" y="90" width="320" height="190" rx="24" className="fill-ink" />
      <rect x="140" y="55" width="90" height="45" rx="10" className="fill-ink" />
      <circle cx="70" cy="115" r="7" className="fill-accent" />

      {/* Lens barrel */}
      <circle cx="200" cy="190" r="100" className="fill-ink" />
      <circle cx="200" cy="190" r="100" className="stroke-accent" strokeWidth="2.5" fill="none" />

      {/* Rim ticks */}
      <g className="stroke-accent" strokeWidth="2" opacity="0.6">
        <line x1="300.0" y1="190.0" x2="312.0" y2="190.0" />
        <line x1="296.6" y1="215.9" x2="308.2" y2="219.0" />
        <line x1="286.6" y1="240.0" x2="297.0" y2="246.0" />
        <line x1="270.7" y1="260.7" x2="279.2" y2="269.2" />
        <line x1="250.0" y1="276.6" x2="256.0" y2="287.0" />
        <line x1="225.9" y1="286.6" x2="229.0" y2="298.2" />
        <line x1="200.0" y1="290.0" x2="200.0" y2="302.0" />
        <line x1="174.1" y1="286.6" x2="171.0" y2="298.2" />
        <line x1="150.0" y1="276.6" x2="144.0" y2="287.0" />
        <line x1="129.3" y1="260.7" x2="120.8" y2="269.2" />
        <line x1="113.4" y1="240.0" x2="103.0" y2="246.0" />
        <line x1="103.4" y1="215.9" x2="91.8" y2="219.0" />
        <line x1="100.0" y1="190.0" x2="88.0" y2="190.0" />
        <line x1="103.4" y1="164.1" x2="91.8" y2="161.0" />
        <line x1="113.4" y1="140.0" x2="103.0" y2="134.0" />
        <line x1="129.3" y1="119.3" x2="120.8" y2="110.8" />
        <line x1="150.0" y1="103.4" x2="144.0" y2="93.0" />
        <line x1="174.1" y1="93.4" x2="171.0" y2="81.8" />
        <line x1="200.0" y1="90.0" x2="200.0" y2="78.0" />
        <line x1="225.9" y1="93.4" x2="229.0" y2="81.8" />
        <line x1="250.0" y1="103.4" x2="256.0" y2="93.0" />
        <line x1="270.7" y1="119.3" x2="279.2" y2="110.8" />
        <line x1="286.6" y1="140.0" x2="297.0" y2="134.0" />
        <line x1="296.6" y1="164.1" x2="308.2" y2="161.0" />
      </g>

      {/* Aperture ring */}
      <circle cx="200" cy="190" r="65" className="fill-ink stroke-accent" strokeWidth="2" />

      {/* Blade seams */}
      <g className="stroke-accent" strokeWidth="1.5" opacity="0.5">
        <line x1="222.0" y1="190.0" x2="262.0" y2="190.0" />
        <line x1="216.9" y1="204.1" x2="247.5" y2="229.9" />
        <line x1="203.8" y1="211.7" x2="210.8" y2="251.1" />
        <line x1="189.0" y1="209.1" x2="169.0" y2="243.7" />
        <line x1="179.3" y1="197.5" x2="141.7" y2="211.2" />
        <line x1="179.3" y1="182.5" x2="141.7" y2="168.8" />
        <line x1="189.0" y1="170.9" x2="169.0" y2="136.3" />
        <line x1="203.8" y1="168.3" x2="210.8" y2="128.9" />
        <line x1="216.9" y1="175.9" x2="247.5" y2="150.1" />
      </g>

      {/* Glass */}
      <circle cx="200" cy="190" r="38" className="fill-accent" opacity="0.12" />
      <circle cx="200" cy="190" r="38" className="stroke-accent" strokeWidth="1.5" fill="none" />
      <circle cx="185" cy="175" r="9" className="fill-surface" opacity="0.4" />
    </svg>
  );
}
