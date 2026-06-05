const variantClass = {
  subtle: "h-32 w-32 opacity-[0.08]",
  hero: "h-72 w-72 opacity-[0.16]",
  empty: "h-24 w-24 opacity-[0.12]"
} as const;

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
      <svg viewBox="0 0 160 160" className="h-full w-full drop-shadow-[0_0_28px_rgba(255,79,216,0.34)]">
        <defs>
          <linearGradient id="karma-mask-gradient" x1="20" x2="140" y1="24" y2="136" gradientUnits="userSpaceOnUse">
            <stop stopColor="#ff4fd8" />
            <stop offset="0.52" stopColor="#9b5cff" />
            <stop offset="1" stopColor="#31f6ff" />
          </linearGradient>
        </defs>
        <path
          d="M80 16 130 38v39c0 32-20 57-50 67-30-10-50-35-50-67V38L80 16Z"
          fill="none"
          stroke="url(#karma-mask-gradient)"
          strokeWidth="7"
          strokeLinejoin="round"
        />
        <path
          d="M52 68c11-12 25-12 36 0M72 98c7 5 15 5 22 0M104 68c8-8 18-9 28-2"
          fill="none"
          stroke="url(#karma-mask-gradient)"
          strokeLinecap="round"
          strokeWidth="7"
        />
        <path
          d="M45 44c18 8 30 19 35 34 5-15 17-26 35-34"
          fill="none"
          stroke="url(#karma-mask-gradient)"
          strokeLinecap="round"
          strokeWidth="6"
          opacity="0.72"
        />
      </svg>
    </div>
  );
}
