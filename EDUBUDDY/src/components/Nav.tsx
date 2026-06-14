import { useEffect, useState } from "react";
import { COLORS, XPBadge } from "./Common";
import { supabase } from "../lib/supabase";

export function Nav({ page, setPage }: { page: string; setPage: (p: string) => void }) {
  const [xp, setXp] = useState(0);
  const [level, setLevel] = useState(1);

  useEffect(() => {
    const loadStats = async () => {
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError || !user) return;

      const { data: profile } = await supabase
        .from("users")
        .select("xp")
        .eq("id", user.id)
        .single();

      if (profile?.xp != null) {
        setXp(profile.xp);
        setLevel(Math.max(1, Math.floor(profile.xp / 100) + 1));
      }
    };

    if (page === "dashboard") {
      loadStats();
    }
  }, [page]);

  return (
    <nav style={{ background: COLORS.purple900, borderBottom: "1px solid rgba(124,58,237,0.3)", padding: "0 2rem", display: "flex", alignItems: "center", justifyContent: "space-between", height: 60, position: "sticky", top: 0, zIndex: 100 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer" }} onClick={() => setPage("home")}>
        <span style={{ fontSize: 24 }}>🐼</span>
        <span style={{ fontFamily: "'Nunito', sans-serif", fontWeight: 800, fontSize: 20, color: "white" }}>EduBuddy</span>
        <span style={{ fontSize: 11, color: COLORS.yellow, fontWeight: 800, letterSpacing: 1 }}>AI</span>
      </div>
      {page === "dashboard" ? (
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <XPBadge xp={xp} level={level} />
          <div style={{ width: 34, height: 34, borderRadius: "50%", background: COLORS.yellow, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 900, color: COLORS.purple900, cursor: "pointer" }}>A</div>
        </div>
      ) : (
        <div style={{ display: "flex", gap: 12 }}>
          <button onClick={() => setPage("login")} style={{ background: "transparent", border: "1px solid rgba(255,255,255,0.15)", color: "white", padding: "8px 18px", borderRadius: 10, fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: "'Nunito', sans-serif" }}>Log in</button>
          <button onClick={() => setPage("login")} style={{ background: COLORS.yellow, border: "none", color: COLORS.purple900, padding: "8px 18px", borderRadius: 10, fontSize: 14, fontWeight: 800, cursor: "pointer", fontFamily: "'Nunito', sans-serif" }}>Get Started</button>
        </div>
      )}
    </nav>
  );
}
