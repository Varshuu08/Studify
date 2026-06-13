export const COLORS = {
  purple900: "#1E0B3B",
  purple800: "#2D1260",
  purple700: "#4C1D95",
  purple600: "#6D28D9",
  purple500: "#7C3AED",
  purple400: "#8B5CF6",
  purple300: "#A78BFA",
  purple200: "#C4B5FD",
  purple100: "#EDE9FE",
  purple50: "#F5F3FF",
  lavender: "#7C3AED",
  gold: "#FCD34D",
  yellow: "#FBBF24",
  mint: "#10B981",
  pink: "#EC4899",
  cream: "#FAFAFA",
  white: "#FFFFFF",
};

export function XPBadge({ xp, level }: { xp: number; level: number }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
      <div style={{ background: "linear-gradient(135deg,#F59E0B,#D97706)", borderRadius: "50%", width: 36, height: 36, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 700, color: "white" }}>
        {level}
      </div>
      <div style={{ fontSize: 13, color: COLORS.purple300 }}>{xp} XP</div>
    </div>
  );
}

export function ProgressBar({ percent, color = COLORS.purple400 }: { percent: number; color?: string }) {
  return (
    <div style={{ background: "rgba(255,255,255,0.12)", borderRadius: 99, height: 8, overflow: "hidden" }}>
      <div style={{ width: `${percent}%`, height: "100%", background: color, borderRadius: 99, transition: "width 0.8s ease" }} />
    </div>
  );
}
