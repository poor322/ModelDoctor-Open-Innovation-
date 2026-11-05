/* ────────────────────────────────────────
   NeuralBackground — Pure CSS animated mesh
   No JavaScript. No 60fps canvas. Zero CPU.
   ──────────────────────────────────────── */

"use client";

export default function NeuralBackground() {
  return (
    <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
      {/* Base gradient */}
      <div className="absolute inset-0 bg-void" />

      {/* Animated gradient orbs */}
      <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] rounded-full bg-accent-blue/[0.07] blur-[120px] animate-drift-1" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] rounded-full bg-purple-500/[0.05] blur-[120px] animate-drift-2" />
      <div className="absolute top-[40%] left-[50%] w-[40%] h-[40%] rounded-full bg-accent-teal/[0.04] blur-[100px] animate-drift-3" />

      {/* Grid overlay */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `
            linear-gradient(rgba(66, 133, 244, 0.3) 1px, transparent 1px),
            linear-gradient(90deg, rgba(66, 133, 244, 0.3) 1px, transparent 1px)
          `,
          backgroundSize: "60px 60px",
        }}
      />

      {/* Radial fade at edges */}
      <div className="absolute inset-0 bg-gradient-to-b from-void via-transparent to-void" />
      <div className="absolute inset-0 bg-gradient-to-r from-void via-transparent to-void opacity-50" />
    </div>
  );
}
