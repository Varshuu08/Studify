import { useState, useEffect } from "react";
import { Panda } from "./Panda";
import { COLORS } from "./Common";
import { PetState } from "../types";

export function HomePage({ setPage }: { setPage: (p: string) => void }) {
  const [petState, setPetState] = useState<PetState>("idle");
  const petStates: PetState[] = ["idle", "smile", "jump", "dance", "sleep", "sad"];
  const [stateIdx, setStateIdx] = useState(0);

  useEffect(() => {
    const t = setInterval(() => {
      setStateIdx(i => {
        const next = (i + 1) % petStates.length;
        setPetState(petStates[next]);
        return next;
      });
    }, 2500);
    return () => clearInterval(t);
  }, []);

  const features = [
    { icon: "🤖", title: "AI Roadmap Generator", desc: "Instantly create structured step-by-step learning paths for any skill you can name." },
    { icon: "🐼", title: "Panda Companion", desc: "Your interactive buddy reacts to your progress and keeps your motivation levels high." },
    { icon: "⭐", title: "XP & Levels", desc: "Turn learning into a game. Earn experience points and level up as you master concepts." },
    { icon: "📊", title: "Smart Tracking", desc: "Visualize your journey with detailed analytics and streak monitoring." },
    { icon: "✅", title: "Daily Tasks", desc: "Get personalized daily missions that fit your schedule and pace." },
    { icon: "🔓", title: "Learn Any Skill", desc: "From Python to Public Speaking — if you want to learn it, we can teach it." },
  ];

  const steps = [
    { n: "01", title: "Set Your Goal", desc: "Tell us what you want to learn and your current level." },
    { n: "02", title: "AI Builds Your Path", desc: "Our engine creates a customized roadmap just for you." },
    { n: "03", title: "Check Daily Tasks", desc: "Complete bite-sized missions to earn XP and progress." },
    { n: "04", title: "Grow Together", desc: "Watch your panda buddy grow as you achieve your dreams." },
  ];

  return (
    <div style={{ background: COLORS.purple900, minHeight: "100vh", fontFamily: "'Nunito', sans-serif", color: "white" }}>
      {/* Hero */}
      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "80px 2rem 60px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 60, alignItems: "center" }}>
        <div>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "rgba(252,211,77,0.15)", border: "1px solid rgba(251,191,36,0.3)", borderRadius: 99, padding: "5px 14px", marginBottom: 24, fontSize: 13, color: COLORS.gold, fontWeight: 700 }}>
            <span>✨</span> Hackathon-Ready AI Learning
          </div>
          <h1 style={{ fontSize: 58, fontWeight: 900, lineHeight: 1, margin: "0 0 20px", letterSpacing: -1.5 }}>
            Learn Anything.<br />
            <span style={{ background: `linear-gradient(90deg, ${COLORS.gold}, ${COLORS.yellow})`, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>Grow Together.</span>
          </h1>
          <p style={{ fontSize: 19, color: COLORS.purple200, lineHeight: 1.6, margin: "0 0 36px", fontWeight: 500 }}>
            AI creates your roadmap. Your panda keeps you motivated. Master any skill with a personalized journey and gamified milestones.
          </p>
          <div style={{ display: "flex", gap: 12 }}>
            <button onClick={() => setPage("login")} style={{ background: COLORS.purple500, border: "none", color: "white", padding: "16px 32px", borderRadius: 14, fontSize: 17, fontWeight: 800, cursor: "pointer", fontFamily: "'Nunito', sans-serif", boxShadow: `0 4px 15px rgba(124,58,237,0.4)` }}>
              Start Learning Free
            </button>
            <button onClick={() => setPage("dashboard")} style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(196,181,253,0.3)", color: COLORS.purple100, padding: "16px 28px", borderRadius: 14, fontSize: 17, fontWeight: 700, cursor: "pointer", fontFamily: "'Nunito', sans-serif" }}>
              Watch Demo
            </button>
          </div>
        </div>

        {/* Panda showcase card */}
        <div style={{ background: "rgba(0,0,0,0.25)", border: `2px solid ${COLORS.yellow}`, borderRadius: 28, padding: 40, textAlign: "center", position: "relative" }}>
           <div style={{ position: "absolute", top: -20, right: -20, background: COLORS.yellow, color: COLORS.purple900, padding: "8px 16px", borderRadius: 99, fontWeight: 800, fontSize: 14, boxShadow: "0 4px 10px rgba(0,0,0,0.2)" }}>
            LEVEL 12
          </div>
          <div style={{ marginBottom: 12 }}>
            <Panda state={petState} size={180} />
          </div>
          <div style={{ fontSize: 24, fontWeight: 900, marginBottom: 8, color: "white" }}>Your Panda Learning Pal</div>
          <div style={{ fontSize: 14, color: COLORS.purple300, marginBottom: 28 }}>I'll cheer you on through every lesson!</div>
          <div style={{ display: "flex", justifyContent: "center", gap: 10, flexWrap: "wrap" }}>
            {petStates.slice(0, 4).map(s => (
              <button key={s} onClick={() => setPetState(s)} style={{ background: petState === s ? COLORS.yellow : "rgba(255,255,255,0.1)", border: "none", color: petState === s ? COLORS.purple900 : "white", padding: "8px 16px", borderRadius: 99, fontSize: 13, cursor: "pointer", fontFamily: "'Nunito', sans-serif", fontWeight: 800, textTransform: "capitalize" }}>
                {s}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Social / Stats */}
      <div style={{ background: "rgba(255,255,255,0.03)", padding: "40px 0" }}>
         <div style={{ maxWidth: 1100, margin: "0 auto", display: "flex", justifyContent: "center", gap: 80 }}>
            {([["5,000+", "Monthly Learners"], ["150+", "AI Roadmaps"], ["10k+", "Tasks Completed"]] as const).map(([v, l]) => (
                <div key={l} style={{ textAlign: "center" }}>
                    <div style={{ fontSize: 24, fontWeight: 900, color: COLORS.gold }}>{v}</div>
                    <div style={{ fontSize: 12, color: COLORS.purple300, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1 }}>{l}</div>
                </div>
            ))}
         </div>
      </div>

      {/* How it works */}
      <div style={{ padding: "80px 2rem" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <h2 style={{ textAlign: "center", fontSize: 40, fontWeight: 900, marginBottom: 12 }}>How it works</h2>
          <p style={{ textAlign: "center", color: COLORS.purple300, fontSize: 18, marginBottom: 56 }}>Transform any skill into a game in four easy steps</p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 24 }}>
            {steps.map((s, i) => (
              <div key={s.n} style={{ textAlign: "center", position: "relative" }}>
                {i < 3 && <div style={{ position: "absolute", top: 32, left: "70%", width: "60%", height: 3, background: `linear-gradient(90deg, ${COLORS.purple500}, transparent)`, borderRadius: 1 }} />}
                <div style={{ width: 64, height: 64, borderRadius: 20, background: `linear-gradient(135deg, ${COLORS.purple500}, ${COLORS.purple700})`, margin: "0 auto 20px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, fontWeight: 900, color: "white", boxShadow: `0 8px 16px rgba(0,0,0,0.3)` }}>
                  {s.n}
                </div>
                <div style={{ fontWeight: 800, fontSize: 18, marginBottom: 8, color: COLORS.gold }}>{s.title}</div>
                <div style={{ fontSize: 14, color: COLORS.purple300, lineHeight: 1.6 }}>{s.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Features grid */}
      <div style={{ background: "rgba(0,0,0,0.2)", padding: "80px 2rem" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
            <h2 style={{ textAlign: "center", fontSize: 40, fontWeight: 900, marginBottom: 12 }}>Unleash your potential</h2>
            <p style={{ textAlign: "center", color: COLORS.purple300, fontSize: 18, marginBottom: 56 }}>Everything you need to master any domain efficiently</p>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 24 }}>
            {features.map(f => (
                <div key={f.title} style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 24, padding: "32px", transition: "transform 0.2s" }}>
                <div style={{ fontSize: 40, marginBottom: 16 }}>{f.icon}</div>
                <div style={{ fontWeight: 800, fontSize: 19, marginBottom: 12, color: "white" }}>{f.title}</div>
                <div style={{ fontSize: 15, color: COLORS.purple300, lineHeight: 1.7 }}>{f.desc}</div>
                </div>
            ))}
            </div>
        </div>
      </div>

      {/* CTA */}
      <div style={{ maxWidth: 700, margin: "0 auto", padding: "100px 2rem", textAlign: "center" }}>
        <div style={{ fontSize: 64, marginBottom: 24 }}>🐼</div>
        <h2 style={{ fontSize: 42, fontWeight: 900, marginBottom: 20 }}>Your journey starts today.</h2>
        <p style={{ color: COLORS.purple300, fontSize: 18, marginBottom: 40, lineHeight: 1.6 }}>Don't learn alone. Let AI and your panda pal guide you to mastery. Create your free account in seconds.</p>
        <button onClick={() => setPage("login")} style={{ background: `linear-gradient(135deg, ${COLORS.purple500}, ${COLORS.pink})`, border: "none", color: "white", padding: "18px 48px", borderRadius: 16, fontSize: 20, fontWeight: 900, cursor: "pointer", fontFamily: "'Nunito', sans-serif", boxShadow: "0 10px 20px rgba(236,72,153,0.3)" }}>
          Get Started Now
        </button>
      </div>
    </div>
  );
}
