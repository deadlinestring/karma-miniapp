/* eslint-disable @next/next/no-img-element */

const variantClass = {
  subtle: "h-32 w-32 opacity-[0.08]",
  hero: "h-72 w-72 opacity-[0.16]",
  empty: "h-24 w-24 opacity-[0.12]"
} as const;

const maskAssetPath = "/brand/karma-mask.svg";

export function BrandMaskWatermark({
  variant = "subtle",
  className = ""
}: {
  variant?: keyof typeof variantClass;
  className?: string;
}) {
  return (
    <div
      aria-hidden="true"
      className={`pointer-events-none select-none ${variantClass[variant]} ${className}`}
    >
      <img
        src={maskAssetPath}
        alt=""
        draggable={false}
        className="h-full w-full object-contain opacity-90 drop-shadow-[0_0_28px_rgba(255,79,216,0.34)]"
      />
    </div>
  );
}
