import { useState } from "react";
import { Panda } from "./Panda";
import { COLORS, ProgressBar } from "./Common";
import { PetState, Roadmap, RoadmapPhase, Task } from "../types";

export function DashboardPage() {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [completedTasks, setCompletedTasks] = useState<Record<number, boolean>>({ 0: false, 1: false, 2: false });
  const [xp, setXp] = useState(1240);
  const [level, setLevel] = useState(12);
  const [petState, setPetState] = useState<PetState>("idle");
  const [showGoalModal, setShowGoalModal] = useState(false);
  const [goalForm, setGoalForm] = useState({ skill: "", level: "Beginner", time: "1", weeks: "8" });
  const [generatingRoadmap, setGeneratingRoadmap] = useState(false);
  const [roadmap, setRoadmap] = useState<Roadmap | null>(null);
  const [apiError, setApiError] = useState("");

  const defaultRoadmap: Roadmap = {
    title: "Python Programming Mastery",
    phases: [
      { phase: "Phase 1: Foundations", weeks: "Week 1", topics: "Variables, Loops, Functions", milestone: "Build a CLI calculator", status: "inprogress" },
      { phase: "Phase 2: Logic Mastery", weeks: "Week 2-4", topics: "Data Structures, Algorithms", milestone: "Solving 20 LeetCode problems", status: "upcoming" },
      { phase: "Phase 3: Web Basics", weeks: "Week 5-8", topics: "Django, API integration", milestone: "Deploy a blog site", status: "upcoming" },
      { phase: "Phase 4: Capstone", weeks: "Week 9-12", topics: "Database optimize, Final project", milestone: "Full-stack SaaS app", status: "upcoming" },
    ]
  };

  const tasks: Task[] = [
    { label: "Revise dictionary methods", xp: 20, category: "Logic" },
    { label: "Write a for-loop exercise", xp: 15, category: "Practical" },
    { label: "Watch introduction to OOP", xp: 30, category: "Learning" },
  ];

  const weekDays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const streak = [true, true, true, true, true, false, false];

  const handleTaskToggle = (i: number) => {
    const wasCompleted = completedTasks[i];
    setCompletedTasks(prev => ({ ...prev, [i]: !prev[i] }));
    if (!wasCompleted) {
      const newXp = xp + tasks[i].xp;
      setXp(newXp);
      setPetState("jump");
      if (newXp % 100 < 30) {
        setPetState("dance");
      }
      setTimeout(() => setPetState("idle"), 3000);
    } else {
      setXp(x => x - tasks[i].xp);
    }
  };

  const generateAIRoadmap = async () => {
    if (!goalForm.skill) return;
    setGeneratingRoadmap(true);
    setApiError("");
    
    // Simulating AI generation delay
    setTimeout(() => {
      const mockRoadmap: Roadmap = {
        title: `Mastery Roadmap: ${goalForm.skill}`,
        phases: [
          { 
            phase: "Phase 1: Getting Started", 
            weeks: "Week 1", 
            topics: `Fundamentals of ${goalForm.skill}, setup, and basic tools.`, 
            milestone: "Complete your first small project", 
            status: "inprogress" 
          },
          { 
            phase: "Phase 2: Core Concepts", 
            weeks: "Weeks 2-3", 
            topics: "Deep dive into intermediate patterns and logic.", 
            milestone: "Master core principles", 
            status: "upcoming" 
          },
          { 
            phase: "Phase 3: Advanced Applications", 
            weeks: "Weeks 4-6", 
            topics: "Complex implementation and integration strategies.", 
            milestone: "Build a comprehensive portfolio piece", 
            status: "upcoming" 
          },
          { 
            phase: "Phase 4: Optimization & Mastery", 
            weeks: "Weeks 7+", 
            topics: "Best practices, scaling, and expert techniques.", 
            milestone: "Reach professional proficiency", 
            status: "upcoming" 
          },
        ],
        tip: `Consistent practice is key to mastering ${goalForm.skill}. Try to spend at least ${goalForm.time} hour(s) a day on it!`
      };

      setRoadmap(mockRoadmap);
      setGeneratingRoadmap(false);
      setShowGoalModal(false);
      setActiveTab("roadmap");
      setPetState("jump");
      setTimeout(() => setPetState("idle"), 3000);
    }, 1500);
  };

  const currentRoadmap = roadmap || defaultRoadmap;

  const getPandaMessage = () => {
    if (petState === "jump" || petState === "dance") return "WOOO! You're amazing! 🌟";
    if (petState === "sad") return "Aww, let's get back on track together!";
    if (petState === "sleep") return "I'm recharging... ready for more loops?";
    return "Let's crush those tasks today! 🐼🚀";
  };

  const sidebarItems = [
    { id: "dashboard", icon: "💎", label: "Dashboard" },
    { id: "roadmap", icon: "🗺️", label: "Roadmap" },
    { id: "tasks", icon: "📅", label: "Daily Tasks" },
    { id: "companion", icon: "🐼", label: "My Panda" },
    { id: "progress", icon: "📊", label: "Analytics" },
    { id: "achievements", icon: "🏆", label: "Badges" },
  ];

  return (
    <div style={{ background: "#0F0221", minHeight: "100vh", display: "flex", fontFamily: "'Nunito', sans-serif", color: "white" }}>
      {/* Sidebar */}
      <div style={{ width: 240, background: COLORS.purple900, borderRight: "1px solid rgba(255,255,255,0.05)", padding: "30px 0", display: "flex", flexDirection: "column", flexShrink: 0 }}>
        <div style={{ padding: "0 24px 32px", display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontSize: 24 }}>🐼</span>
            <span style={{ fontWeight: 900, fontSize: 18, letterSpacing: -0.5 }}>EduBuddy AI</span>
        </div>
        
        {sidebarItems.map(item => (
          <button key={item.id} onClick={() => setActiveTab(item.id)} style={{ display: "flex", alignItems: "center", gap: 14, padding: "14px 24px", border: "none", background: activeTab === item.id ? "rgba(251,191,36,0.1)" : "transparent", color: activeTab === item.id ? COLORS.yellow : COLORS.purple300, fontSize: 15, fontWeight: activeTab === item.id ? 800 : 500, cursor: "pointer", fontFamily: "'Nunito', sans-serif", transition: "all 0.2s", textAlign: "left", width: "100%", borderLeft: `4px solid ${activeTab === item.id ? COLORS.yellow : "transparent"}` }}>
            <span style={{ fontSize: 18 }}>{item.icon}</span> {item.label}
          </button>
        ))}
        
        <div style={{ marginTop: "auto", padding: "20px" }}>
            <div style={{ background: "rgba(255,255,255,0.03)", borderRadius: 20, padding: 20, textAlign: "center", border: "1px solid rgba(255,255,255,0.05)" }}>
               <Panda state={petState} size={80} />
               <div style={{ fontSize: 11, color: COLORS.purple400, fontWeight: 700, textTransform: "uppercase", marginTop: 8 }}>Buddy Level {level}</div>
            </div>
        </div>
      </div>

      {/* Main Container */}
      <div style={{ flex: 1, padding: "40px", overflowY: "auto" }}>
        {activeTab === "dashboard" && (
          <div style={{ maxWidth: 1000, margin: "0 auto" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 32 }}>
                <div>
                   <h1 style={{ fontSize: 32, fontWeight: 900, margin: "0 0 4px" }}>Hi, Aarav!</h1>
                   <p style={{ color: COLORS.purple300, margin: 0, fontSize: 16 }}>Your goal: <span style={{ color: COLORS.yellow, fontWeight: 700 }}>{currentRoadmap.title}</span></p>
                </div>
                <div style={{ display: "flex", gap: 12 }}>
                    <div style={{ background: "rgba(124,58,237,0.15)", padding: "10px 20px", borderRadius: 14, border: `1px solid ${COLORS.purple500}44` }}>
                        <div style={{ fontSize: 11, fontWeight: 800, color: COLORS.purple300 }}>DAILY STREAK</div>
                        <div style={{ fontSize: 18, fontWeight: 900 }}>🔥 12 Days</div>
                    </div>
                    <div style={{ background: "rgba(251,191,36,0.15)", padding: "10px 20px", borderRadius: 14, border: `1px solid ${COLORS.yellow}44` }}>
                        <div style={{ fontSize: 11, fontWeight: 800, color: COLORS.yellow }}>XP POINTS</div>
                        <div style={{ fontSize: 18, fontWeight: 900 }}>⭐ {xp}</div>
                    </div>
                </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1.2fr 0.8fr", gap: 24 }}>
                {/* Panda Main Interaction */}
                <div style={{ background: `linear-gradient(135deg, ${COLORS.purple900}, ${COLORS.purple800})`, borderRadius: 32, padding: 40, border: `2px solid ${COLORS.yellow}22`, display: "flex", gap: 32, alignItems: "center" }}>
                   <Panda state={petState} size={200} />
                   <div>
                       <div style={{ background: "white", color: COLORS.purple900, padding: "16px 24px", borderRadius: "20px 20px 20px 0", position: "relative", marginBottom: 20 }}>
                          <div style={{ fontWeight: 800, lineHeight: 1.4 }}>{getPandaMessage()}</div>
                          <div style={{ position: "absolute", bottom: -8, left: 0, width: 0, height: 0, borderLeft: "8px solid white", borderTop: "8px solid transparent" }}></div>
                       </div>
                       <button onClick={() => setShowGoalModal(true)} style={{ background: COLORS.yellow, color: COLORS.purple900, border: "none", padding: "12px 24px", borderRadius: 12, fontWeight: 900, fontSize: 14, cursor: "pointer", boxShadow: "0 4px 10px rgba(0,0,0,0.2)" }}>
                           Generate New Roadmap
                       </button>
                   </div>
                </div>

                {/* Progress Mini Card */}
                <div style={{ background: "rgba(255,255,255,0.03)", borderRadius: 32, border: "1px solid rgba(255,255,255,0.06)", padding: 32 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
                        <div style={{ fontWeight: 800, color: COLORS.purple200 }}>Course Progress</div>
                        <div style={{ fontWeight: 900, color: COLORS.gold }}>42%</div>
                    </div>
                    <ProgressBar percent={42} color={COLORS.gold} />
                    <div style={{ marginTop: 32 }}>
                        <div style={{ color: COLORS.purple400, fontSize: 12, fontWeight: 800, textTransform: "uppercase", marginBottom: 16 }}>This Week</div>
                        <div style={{ display: "flex", justifyContent: "space-between" }}>
                           {weekDays.map((d, i) => (
                             <div key={d} style={{ textAlign: "center" }}>
                                <div style={{ width: 10, height: 10, borderRadius: "50%", background: streak[i] ? COLORS.yellow : "rgba(255,255,255,0.1)", margin: "0 auto 8px" }} />
                                <div style={{ fontSize: 10, color: COLORS.purple400, fontWeight: 800 }}>{d}</div>
                             </div>
                           ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Daily Tasks Section */}
            <div style={{ marginTop: 24 }}>
                <h2 style={{ fontSize: 22, fontWeight: 900, marginBottom: 20 }}>Today's Missions</h2>
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                    {tasks.map((t, i) => (
                        <div 
                          key={i} 
                          onClick={() => handleTaskToggle(i)}
                          style={{ 
                            background: "rgba(255,255,255,0.04)", 
                            borderRadius: 20, 
                            padding: "20px 24px", 
                            display: "flex", 
                            alignItems: "center", 
                            gap: 20, 
                            cursor: "pointer",
                            border: `1px solid ${completedTasks[i] ? COLORS.yellow + "44" : "transparent"}`,
                            opacity: completedTasks[i] ? 0.6 : 1,
                            transition: "all 0.2s"
                          }}
                        >
                            <div style={{ width: 28, height: 28, borderRadius: 8, border: `2px solid ${completedTasks[i] ? COLORS.yellow : "rgba(255,255,255,0.2)"}`, background: completedTasks[i] ? COLORS.yellow : "transparent", display: "flex", alignItems: "center", justifyContent: "center", fontStyle: "normal" }}>
                                {completedTasks[i] && <span style={{ color: COLORS.purple900, fontWeight: 900, fontSize: 18 }}>✓</span>}
                            </div>
                            <div style={{ flex: 1 }}>
                                <div style={{ fontWeight: 800, fontSize: 16 }}>{t.label}</div>
                                <div style={{ fontSize: 12, color: COLORS.purple400 }}>{t.category}</div>
                            </div>
                            <div style={{ fontWeight: 900, color: COLORS.gold }}>+{t.xp} XP</div>
                        </div>
                    ))}
                </div>
            </div>
          </div>
        )}

        {/* Roadmap Display */}
        {activeTab === "roadmap" && (
           <div style={{ maxWidth: 800, margin: "0 auto" }}>
              <div style={{ textAlign: "center", marginBottom: 48 }}>
                 <h1 style={{ fontSize: 32, fontWeight: 900, marginBottom: 8 }}>{currentRoadmap.title}</h1>
                 <p style={{ color: COLORS.purple300 }}>A custom learning path generated just for you.</p>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                {currentRoadmap.phases.map((p, i) => (
                  <div key={i} style={{ display: "flex", gap: 24 }}>
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                      <div style={{ width: 44, height: 44, borderRadius: "50%", background: p.status === "completed" ? COLORS.mint : p.status === "inprogress" ? COLORS.yellow : "rgba(255,255,255,0.05)", display: "flex", alignItems: "center", justifyContent: "center", border: "4px solid rgba(255,255,255,0.05)", zIndex: 1 }}>
                         {p.status === "completed" ? "✓" : p.status === "inprogress" ? "🚀" : "🔒"}
                      </div>
                      {i < currentRoadmap.phases.length - 1 && <div style={{ width: 2, flex: 1, background: "rgba(255,255,255,0.05)", margin: "4px 0" }} />}
                    </div>
                    <div style={{ flex: 1, background: "rgba(255,255,255,0.03)", borderRadius: 24, padding: "24px", border: `1px solid ${p.status === "inprogress" ? COLORS.yellow + "44" : "transparent"}`, marginBottom: 24 }}>
                       <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                          <span style={{ fontWeight: 900, fontSize: 18, color: p.status === "locked" ? COLORS.purple400 : "white" }}>{p.phase}</span>
                          <span style={{ fontSize: 12, fontWeight: 800, color: COLORS.purple400 }}>{p.weeks}</span>
                       </div>
                       <div style={{ fontSize: 14, color: COLORS.purple300, marginBottom: 16 }}>{p.topics}</div>
                       <div style={{ display: "flex", alignItems: "center", gap: 8, background: "rgba(255,255,255,0.05)", padding: "10px 16px", borderRadius: 12 }}>
                          <span style={{ fontSize: 16 }}>🎯</span>
                          <span style={{ fontSize: 13, fontWeight: 700, color: COLORS.gold }}>{p.milestone}</span>
                       </div>
                    </div>
                  </div>
                ))}
              </div>

              {currentRoadmap.tip && (
                <div style={{ marginTop: 20, background: "rgba(251,191,36,0.1)", borderRadius: 20, padding: 24, border: `1px dashed ${COLORS.yellow}44` }}>
                  <div style={{ fontWeight: 800, fontSize: 14, color: COLORS.yellow, marginBottom: 4 }}>COACH'S TIP</div>
                  <div style={{ fontStyle: "italic", lineHeight: 1.5 }}>"{currentRoadmap.tip}"</div>
                </div>
              )}
           </div>
        )}
      </div>

       {/* Goal Modal */}
       {showGoalModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.8)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: 20 }}>
           <div style={{ background: COLORS.purple900, border: `2px solid ${COLORS.yellow}44`, borderRadius: 32, padding: 40, width: "100%", maxWidth: 440 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 32 }}>
                 <h2 style={{ fontSize: 24, fontWeight: 900, margin: 0 }}>Create Roadmap</h2>
                 <button onClick={() => setShowGoalModal(false)} style={{ background: "none", border: "none", color: COLORS.purple300, fontSize: 24, cursor: "pointer" }}>✕</button>
              </div>
              
              <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                 <div>
                    <label style={{ fontSize: 14, fontWeight: 800, color: COLORS.purple300, display: "block", marginBottom: 8 }}>Skill to master</label>
                    <input autoFocus value={goalForm.skill} onChange={e => setGoalForm(f => ({ ...f, skill: e.target.value }))} placeholder="e.g. Photoshop, UI Design, Swift..." style={{ width: "100%", padding: "14px 18px", borderRadius: 14, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "white", fontSize: 15, fontFamily: "'Nunito', sans-serif" }} />
                 </div>

                 <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                    <div>
                        <label style={{ fontSize: 13, fontWeight: 800, color: COLORS.purple300, display: "block", marginBottom: 8 }}>Time / Day</label>
                        <select value={goalForm.time} onChange={e => setGoalForm(f => ({ ...f, time: e.target.value }))} style={{ width: "100%", padding: "14px 18px", borderRadius: 14, background: COLORS.purple800, border: "1px solid rgba(255,255,255,0.1)", color: "white", fontSize: 15, fontFamily: "'Nunito', sans-serif" }}>
                            {["0.5", "1", "2"].map(t => <option key={t} value={t}>{t} hr</option>)}
                        </select>
                    </div>
                    <div>
                        <label style={{ fontSize: 13, fontWeight: 800, color: COLORS.purple300, display: "block", marginBottom: 8 }}>Weeks</label>
                        <select value={goalForm.weeks} onChange={e => setGoalForm(f => ({ ...f, weeks: e.target.value }))} style={{ width: "100%", padding: "14px 18px", borderRadius: 14, background: COLORS.purple800, border: "1px solid rgba(255,255,255,0.1)", color: "white", fontSize: 15, fontFamily: "'Nunito', sans-serif" }}>
                            {["4", "8", "12"].map(w => <option key={w} value={w}>{w} weeks</option>)}
                        </select>
                    </div>
                 </div>

                 <button onClick={generateAIRoadmap} disabled={generatingRoadmap} style={{ background: COLORS.yellow, color: COLORS.purple900, border: "none", padding: "16px", borderRadius: 14, fontSize: 16, fontWeight: 900, cursor: "pointer", transition: "all 0.2s" }}>
                    {generatingRoadmap ? "🤖 Building..." : "Generate Magic Roadmap ✨"}
                 </button>
                 {apiError && <div style={{ textAlign: "center", color: "#F87171", fontSize: 13, fontWeight: 700 }}>{apiError}</div>}
              </div>
           </div>
        </div>
       )}
    </div>
  );
}
