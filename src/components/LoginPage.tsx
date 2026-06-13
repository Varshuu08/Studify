import { useState } from "react";
import { Panda } from "./Panda";
import { COLORS } from "./Common";
import { PetState } from "../types";
import { supabase } from "../lib/supabase";

export function LoginPage({ setPage }: { setPage: (p: string) => void }) {
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [petState, setPetState] = useState<PetState>("idle");

  const handleSubmit = async () => {
  if (!form.email || !form.password) return;

  setLoading(true);

  try {
  if (mode === "signup") {

    const { data, error } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
    });

    if (error) throw error;

    if (data.user) {
      const { error: dbError } = await supabase
        .from("users")
        .insert({
          id: data.user.id,
          email: data.user.email,
          name: form.name,
        });

      if (dbError) throw dbError;
    }

  } else {

    const { error } = await supabase.auth.signInWithPassword({
      email: form.email,
      password: form.password,
    });

    if (error) throw error;
  }

  setPage("dashboard");

} catch (error: any) {
  alert(error.message);
} finally {
  setLoading(false);
}
  };
  return (
    <div style={{ background: COLORS.purple900, minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: "2rem", fontFamily: "'Nunito', sans-serif" }}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 48, maxWidth: 940, width: "100%", alignItems: "center" }}>
        {/* Left: welcome */}
        <div style={{ textAlign: "center" }}>
          <div style={{ background: "rgba(0,0,0,0.2)", borderRadius: "50%", width: 220, height: 220, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 24px", border: `3px dashed ${COLORS.yellow}44` }}>
            <Panda state={petState} size={180} />
          </div>
          <h2 style={{ fontSize: 32, fontWeight: 900, color: "white", marginBottom: 12 }}>
            {mode === "login" ? "Welcome back! 👋" : "Join the pride! 🐼"}
          </h2>
          <p style={{ color: COLORS.purple300, fontSize: 16, lineHeight: 1.6, maxWidth: 340, margin: "0 auto" }}>
            {mode === "login"
              ? "Your panda buddy missed you. Let's hit your goal together!"
              : "Create an account to start your journey with your personal AI companion."}
          </p>
          <div style={{ marginTop: 32, display: "flex", justifyContent: "center", gap: 12 }}>
            {["🚀 Fast Growth", "📊 Smart Data", "🐼 Cute Pet"].map(t => (
              <div key={t} style={{ fontSize: 12, fontWeight: 700, color: COLORS.gold, background: "rgba(251,191,36,0.15)", padding: "6px 12px", borderRadius: 99, border: `1px solid ${COLORS.yellow}44` }}>{t}</div>
            ))}
          </div>
        </div>

        {/* Right: form */}
        <div style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 28, padding: "40px" }}>
          <div style={{ display: "flex", gap: 0, background: "rgba(0,0,0,0.3)", borderRadius: 14, padding: 5, marginBottom: 32 }}>
            {(["login", "signup"] as const).map(m => (
              <button key={m} onClick={() => setMode(m)} style={{ flex: 1, padding: "10px 0", borderRadius: 10, border: "none", fontSize: 15, fontWeight: 800, cursor: "pointer", fontFamily: "'Nunito', sans-serif", background: mode === m ? COLORS.purple500 : "transparent", color: mode === m ? "white" : COLORS.purple300, transition: "all 0.2s" }}>
                {m === "login" ? "Log In" : "Sign Up"}
              </button>
            ))}
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            {mode === "signup" && (
                <div>
                <label style={{ fontSize: 14, color: COLORS.purple300, display: "block", marginBottom: 8, fontWeight: 700 }}>Your name</label>
                <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Alex Chen" style={{ width: "100%", padding: "12px 16px", borderRadius: 12, border: "1px solid rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.05)", color: "white", fontSize: 15, fontFamily: "'Nunito', sans-serif", outline: "none", boxSizing: "border-box" }} />
                </div>
            )}

            <div>
                <label style={{ fontSize: 14, color: COLORS.purple300, display: "block", marginBottom: 8, fontWeight: 700 }}>Email Address</label>
                <input value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder="alex@example.com" type="email" style={{ width: "100%", padding: "12px 16px", borderRadius: 12, border: "1px solid rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.05)", color: "white", fontSize: 15, fontFamily: "'Nunito', sans-serif", outline: "none", boxSizing: "border-box" }} />
            </div>

            <div>
                <label style={{ fontSize: 14, color: COLORS.purple300, display: "block", marginBottom: 8, fontWeight: 700 }}>Password</label>
                <input value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} placeholder="••••••••" type="password" style={{ width: "100%", padding: "12px 16px", borderRadius: 12, border: "1px solid rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.05)", color: "white", fontSize: 15, fontFamily: "'Nunito', sans-serif", outline: "none", boxSizing: "border-box" }} />
            </div>

            <button onClick={handleSubmit} style={{ width: "100%", padding: "15px", background: loading ? "rgba(124,58,237,0.5)" : `linear-gradient(135deg, ${COLORS.purple500}, ${COLORS.purple700})`, border: "none", borderRadius: 12, color: "white", fontSize: 16, fontWeight: 900, cursor: "pointer", fontFamily: "'Nunito', sans-serif", transition: "transform 0.1s", outline: "none", boxShadow: loading ? "none" : "0 6px 20px rgba(124,58,237,0.3)" }}>
                {loading ? "Waking up your panda..." : mode === "login" ? "Enter the Journey →" : "Create Account →"}
            </button>
          </div>

          <div style={{ marginTop: 32, textAlign: "center" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 24 }}>
              <div style={{ flex: 1, height: 1, background: "rgba(255,255,255,0.1)" }} />
              <span style={{ fontSize: 13, color: COLORS.purple400, fontWeight: 600 }}>or use your social</span>
              <div style={{ flex: 1, height: 1, background: "rgba(255,255,255,0.1)" }} />
            </div>
            <div style={{ display: "flex", gap: 12 }}>
              {["G Google", "⌘ Apple"].map(provider => (
                <button key={provider} onClick={handleSubmit} style={{ flex: 1, padding: "10px", background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12, color: "white", fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: "'Nunito', sans-serif" }}>
                  {provider}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}