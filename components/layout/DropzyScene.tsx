/**
 * Vector scene ported from the customer app's DropzyHero (dropzy_mobile/lib/widgets/scenery.dart):
 * gopuram skyline, hills, palms, a gold sun and a violet bus carrying a gold parcel. Decorative only.
 */
export default function DropzyScene({ className, showBus = true, sun: sunAt = [232, 50] }: { className?: string; showBus?: boolean; sun?: [number, number] }) {
  const silhouette = "#201A38";
  const sun = "#F5C451";
  const tiers = [0, 1, 2, 3, 4].map((i) => {
    const w = 66 - i * 10;
    return { x: 72 - w / 2, y: 182 - (i + 1) * 18, w };
  });
  const fronds = (x: number, topY: number, s: number) => [
    ...[-22, -14, 14, 22].map((dx) => `M${x},${topY} Q${x + dx * 0.5 * s},${topY - 12 * s} ${x + dx * s},${topY - 2 * s}`),
    `M${x},${topY} Q${x},${topY - 14 * s} ${x + 2 * s},${topY - 16 * s}`,
  ];
  return (
    <svg viewBox="0 0 400 200" preserveAspectRatio="xMidYMax slice" className={className} aria-hidden focusable="false">
      {/* sun with glow */}
      <circle cx={sunAt[0]} cy={sunAt[1]} r="40" fill={sun} opacity="0.16" />
      <circle cx={sunAt[0]} cy={sunAt[1]} r="22" fill={sun} />
      {/* back hills */}
      <path d="M0,182 L0,148 Q90,108 190,142 Q300,178 400,138 L400,182 Z" fill="#2E2450" />
      {/* gopuram */}
      <g fill={silhouette}>
        {tiers.map((t) => (
          <rect key={t.y} x={t.x} y={t.y} width={t.w} height="17" rx="3" />
        ))}
        <circle cx="72" cy="90" r="6" />
        <rect x="70.5" y="76" width="3" height="12" />
      </g>
      <rect x="66" y="166" width="12" height="16" rx="6" fill={sun} opacity="0.55" />
      {/* palms */}
      <g fill="none" stroke={silhouette} strokeLinecap="round">
        <path d="M150,182 Q144,154 150,128" strokeWidth="4" />
        {fronds(150, 128, 1).map((d) => <path key={d} d={d} strokeWidth="3" />)}
        <path d="M356,182 Q351.2,159.6 356,138.8" strokeWidth="3.2" />
        {fronds(356, 138.8, 0.8).map((d) => <path key={d} d={d} strokeWidth="2.4" />)}
      </g>
      {/* front hill */}
      <path d="M0,182 L0,170 Q120,148 250,168 Q330,180 400,162 L400,182 Z" fill={silhouette} />
      {/* road */}
      <rect x="0" y="182" width="400" height="24" fill="#17131F" />
      {Array.from({ length: 9 }).map((_, i) => (
        <rect key={i} x={10 + i * 46} y="191" width="24" height="4" rx="2" fill="#3A3350" />
      ))}
      {/* bus carrying a parcel */}
      {showBus && (
        <g>
          <rect x="256" y="116" width="30" height="24" rx="4" fill="#F4C15A" />
          <rect x="269" y="116" width="4" height="24" fill="#B4801F" />
          <rect x="256" y="126" width="30" height="4" fill="#B4801F" />
          <rect x="236" y="138" width="104" height="40" rx="9" fill="#8B5CF6" />
          {[0, 1, 2, 3].map((i) => (
            <rect key={i} x={246 + i * 22} y="146" width="16" height="13" rx="3" fill="#EDEAF8" />
          ))}
          <rect x="330" y="146" width="6" height="13" rx="2" fill={sun} />
          <circle cx="262" cy="180" r="10" fill="#0E0B16" />
          <circle cx="314" cy="180" r="10" fill="#0E0B16" />
          <circle cx="262" cy="180" r="4" fill="#3A3350" />
          <circle cx="314" cy="180" r="4" fill="#3A3350" />
          <g stroke="#FFFFFF" strokeOpacity="0.18" strokeWidth="2" strokeLinecap="round">
            {[0, 1, 2].map((i) => (
              <line key={i} x1={228 - i * 6} y1={148 + i * 10} x2={216 - i * 6} y2={148 + i * 10} />
            ))}
          </g>
        </g>
      )}
    </svg>
  );
}
