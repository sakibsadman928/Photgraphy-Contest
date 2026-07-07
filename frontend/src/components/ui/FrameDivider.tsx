/**
 * The platform's signature structural device: a hairline rule flanked by
 * small perforations, evoking the sprocket holes along a 35mm film strip.
 * Used to mark genuine sequence boundaries (Round 1 -> Final -> Results),
 * not as generic decoration.
 */
export default function FrameDivider({ label }: { label?: string }) {
  return (
    <div className="flex items-center gap-4 my-10" role="separator">
      <div className="flex-1 h-[3px] bg-sprocket-line text-accent/30 bg-[length:14px_3px] bg-repeat-x" />
      {label && (
        <span className="font-mono text-xs tracking-[0.2em] uppercase text-accent-text whitespace-nowrap">
          {label}
        </span>
      )}
      <div className="flex-1 h-[3px] bg-sprocket-line text-accent/30 bg-[length:14px_3px] bg-repeat-x" />
    </div>
  );
}
