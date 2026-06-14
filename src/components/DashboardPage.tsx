import { useEffect, useState, useMemo } from "react";
import { Panda } from "./Panda";
import { COLORS, ProgressBar } from "./Common";
import { PetState, Roadmap, RoadmapPhase, Task, TaskHistoryEntry } from "../types";
import { supabase } from "../lib/supabase";
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import Badges from './Badges';
import RoadmapSchedule from './RoadmapSchedule';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

export function DashboardPage() {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [completedTasks, setCompletedTasks] = useState<Record<number, boolean>>({});
  const [xp, setXp] = useState(0);
  const [petState, setPetState] = useState<PetState>("idle");
  const [activityDays, setActivityDays] = useState<boolean[]>(new Array(7).fill(false));
  const [showGoalModal, setShowGoalModal] = useState(false);
  const [goalForm, setGoalForm] = useState({ skill: "", mode: "beginner", time: "1", weeks: "8" });
  const [generatingRoadmap, setGeneratingRoadmap] = useState(false);
  const [roadmap, setRoadmap] = useState<Roadmap | null>(null);
  const [apiError, setApiError] = useState("");
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [learningGoal, setLearningGoal] = useState("");
  const [userEmail, setUserEmail] = useState("");
  const [userId, setUserId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState(false);
  const [editingProfile, setEditingProfile] = useState(false);
  const [savingName, setSavingName] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileError, setProfileError] = useState("");
  const [taskHistory, setTaskHistory] = useState<TaskHistoryEntry[]>([]);
  const [savedBadges, setSavedBadges] = useState<any>({});
  const [savedSchedule, setSavedSchedule] = useState<any>(null);
  const displayName = name || userEmail.split("@")[0] || "friend";

  const defaultRoadmap: Roadmap = {
    title: "Python Programming Mastery",
    phases: [
      { phase: "Phase 1: Python Basics", weeks: "Week 1", topics: "Variables & Data Types, Control Flow, Functions, Debugging", milestone: "Build a CLI calculator", status: "inprogress" },
      { phase: "Phase 2: Data Structures Fundamentals", weeks: "Week 2-3", topics: "Lists & Tuples, Dictionaries & Sets, String Manipulation, List Comprehensions", milestone: "Solve 10 basic coding challenges", status: "upcoming" },
      { phase: "Phase 3: Advanced Data Structures", weeks: "Week 4-5", topics: "Stacks & Queues, Linked Lists, Trees, Graphs (Basics)", milestone: "Implement 5 data structures from scratch", status: "upcoming" },
      { phase: "Phase 4: Algorithm Fundamentals", weeks: "Week 6-7", topics: "Sorting Algorithms, Searching Techniques, Big O Analysis, Recursion", milestone: "Master 8 core algorithms", status: "upcoming" },
      { phase: "Phase 5: Advanced Algorithms", weeks: "Week 8-9", topics: "Dynamic Programming, Greedy Algorithms, Graph Traversal, Problem Solving", milestone: "Solve 15 LeetCode medium problems", status: "upcoming" },
      { phase: "Phase 6: Capstone Project", weeks: "Week 10+", topics: "System Design, Code Optimization, Performance Testing, Best Practices", milestone: "Build a complete data structure project", status: "upcoming" },
    ]
  };

  const todayIso = new Date().toISOString().slice(0,10);
  const initialTasks: Task[] = [
    { label: "Master list operations (append, slice, iterate)", xp: 20, category: "Data Structures", priority: "High", due_date: todayIso },
    { label: "Implement a stack data structure", xp: 30, category: "Practical", priority: "Medium", due_date: todayIso },
    { label: "Solve binary search problem on LeetCode", xp: 25, category: "Algorithms", priority: "High", due_date: todayIso },
    { label: "Understand and apply Big O notation", xp: 20, category: "Learning", priority: "Low", due_date: todayIso },
    { label: "Implement quicksort algorithm from scratch", xp: 35, category: "Practical", priority: "High", due_date: todayIso },
    { label: "Learn tree traversal (DFS, BFS)", xp: 30, category: "Algorithms", priority: "Medium", due_date: todayIso },
  ];

  const [tasks, setTasks] = useState<Task[]>(initialTasks);
  
  // Initialize completed tasks based on current tasks
  useEffect(() => {
    if (Object.keys(completedTasks).length === 0) {
      const init: Record<number, boolean> = {};
      tasks.forEach((_, i) => init[i] = false);
      setCompletedTasks(init);
    }
  }, [tasks.length]);

  const [taskXP, setTaskXP] = useState<number[]>(() => {
    try {
      const raw = localStorage.getItem("edubuddy_task_xp");
      if (raw) {
        const parsed = JSON.parse(raw);
        return parsed.length === initialTasks.length ? parsed : initialTasks.map(t => t.xp);
      }
    } catch {}
    return initialTasks.map(t => t.xp);
  });

  const [history, setHistory] = useState<{ date: string; points: number; completedCount: number }[]>(() => {
    try {
      const raw = localStorage.getItem("edubuddy_history");
      return raw ? JSON.parse(raw) : [];
    } catch (e) {
      return [];
    }
  });

  const [decayRate, setDecayRate] = useState<number>(() => {
    try { const raw = localStorage.getItem("edubuddy_decay_rate"); return raw ? Number(raw) : 0.2; } catch { return 0.2; }
  });

  // save history/taskXP/decayRate to Supabase when available
  useEffect(() => {
    if (!userId) return;
    (async () => {
      try {
        await supabase.from('users').update({ task_xp: taskXP, history, decay_rate: decayRate }).eq('id', userId);
      } catch (e) {}
    })();
  }, [userId, taskXP, history, decayRate]);

  const weekDays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const completedCount = Object.values(completedTasks).filter(Boolean).length;
  const courseProgress = tasks.length ? Math.round((completedCount / tasks.length) * 100) : 0;
  const level = Math.max(1, Math.floor(xp / 100) + 1);
  const streak = activityDays;
  const todayIndex = new Date().getDay() === 0 ? 6 : new Date().getDay() - 1;
  let currentStreak = 0;
  for (let i = todayIndex; i >= 0; i--) {
    if (!activityDays[i]) break;
    currentStreak += 1;
  }

  const petHp = Math.min(100, Math.max(0, 40 + currentStreak * 6 + courseProgress * 0.35));
  const happiness = Math.min(100, Math.max(0, 30 + currentStreak * 7 + completedCount * 8));
  const energy = Math.min(100, Math.max(0, 30 + completedCount * 10 + (history.slice(-1)[0]?.completedCount || 0) * 5));
  const focus = Math.min(100, Math.max(0, 35 + history.slice(-7).filter(h => h.completedCount > 0).length * 7));
  const xpProgress = xp % 100;
  const totalTasksCompleted = history.reduce((sum, h) => sum + (h.completedCount || 0), 0);
  const weeklyTotalPoints = history.slice(-7).reduce((sum, h) => sum + (h.points || 0), 0);
  const weeklyProgressPercent = Math.min(100, Math.round((weeklyTotalPoints / 140) * 100));
  const pendingTasks = tasks.map((task, idx) => ({ ...task, completed: !!completedTasks[idx], index: idx })).filter(task => !task.completed);

  useEffect(() => {
    const entries: TaskHistoryEntry[] = [];
    history.slice(-20).reverse().forEach(entry => {
      if (Array.isArray((entry as any).tasks)) {
        (entry as any).tasks.forEach((task: any) => {
          entries.push({ task: task.task || "Task", completed_at: entry.date, xp: task.xp || 0 });
        });
      }
    });
    setTaskHistory(entries);
  }, [history]);

  const saveUserStats = async (stats: { xp: number; completed_tasks: Record<number, boolean>; activity_days: boolean[] }) => {
    if (!userId) return;
    await supabase
      .from("users")
      .update({
        xp: stats.xp,
        completed_tasks: stats.completed_tasks,
        activity_days: stats.activity_days,
      })
      .eq("id", userId);
  };

  const resetTaskXP = async () => {
    const base = tasks.map(t => t.xp);
    setTaskXP(base);
    setHistory([]);
    try { localStorage.removeItem("edubuddy_history"); localStorage.setItem("edubuddy_task_xp", JSON.stringify(base)); } catch {}
    if (userId) {
      await supabase.from('users').update({ task_xp: base, history: [] }).eq('id', userId);
    }
  };

  const updateDecayRate = async (r: number) => {
    setDecayRate(r);
    try { localStorage.setItem("edubuddy_decay_rate", String(r)); } catch {}
    if (userId) await supabase.from('users').update({ decay_rate: r }).eq('id', userId);
  };

  const handleTaskToggle = async (i: number) => {
    const wasCompleted = completedTasks[i];
    const nextTasks = { ...completedTasks, [i]: !wasCompleted };
    const taskAward = taskXP[i] ?? tasks[i].xp;
    const nextXp = wasCompleted ? Math.max(0, xp - taskAward) : xp + taskAward;
    const todayIndex = new Date().getDay() === 0 ? 6 : new Date().getDay() - 1;
    const nextActivityDays = [...activityDays];

    if (!wasCompleted) {
      nextActivityDays[todayIndex] = true;
    } else if (!Object.values(nextTasks).some(Boolean)) {
      nextActivityDays[todayIndex] = false;
    }

    setCompletedTasks(nextTasks);
    setXp(nextXp);
    // persist last-earned points into history for today
    const today = new Date().toISOString().slice(0, 10);
    const earnedPoints = nextXp - (Number(localStorage.getItem("edubuddy_xp_base") || 0));
    // We track per-day points as a snapshot when toggling tasks
    const prev = history.slice();
    const todayIdx = prev.findIndex(h => h.date === today);
    const completedCountToday = Object.values(nextTasks).filter(Boolean).length;
    if (todayIdx >= 0) {
      prev[todayIdx] = { ...prev[todayIdx], points: Math.max(prev[todayIdx].points, earnedPoints), completedCount: completedCountToday };
    } else {
      prev.push({ date: today, points: earnedPoints, completedCount: completedCountToday });
    }
    setHistory(prev.slice(-30));
    try { localStorage.setItem("edubuddy_history", JSON.stringify(prev.slice(-30))); } catch {}
    try { localStorage.setItem("edubuddy_xp_base", String(nextXp)); } catch {}
    setActivityDays(nextActivityDays);
    setPetState("jump");
    if (nextXp % 100 < 30) {
      setPetState("dance");
    }
    setTimeout(() => setPetState("idle"), 3000);

    await saveUserStats({
      xp: nextXp,
      completed_tasks: nextTasks,
      activity_days: nextActivityDays,
    });
  };

  // On mount handle day rollover: shift incomplete tasks and reduce XP for missed tasks
  useEffect(() => {
    const today = new Date().toISOString().slice(0, 10);
    const last = localStorage.getItem("edubuddy_last_date");
    if (last !== today) {
      // if there was a previous date saved, compute rollover
      const savedCompletedRaw = localStorage.getItem("edubuddy_completed_tasks");
      const savedCompleted: Record<number, boolean> | null = savedCompletedRaw ? JSON.parse(savedCompletedRaw) : null;
      if (savedCompleted) {
        const incompleteIdxs = Object.keys(savedCompleted).filter(k => !savedCompleted[Number(k)]).map(k => Number(k));
        if (incompleteIdxs.length > 0) {
          // reduce XP for incomplete tasks by decayRate (min 1)
          const nextXP = taskXP.slice();
          incompleteIdxs.forEach(idx => {
            nextXP[idx] = Math.max(1, Math.round(nextXP[idx] * (1 - decayRate)));
          });
          setTaskXP(nextXP);
          try { localStorage.setItem("edubuddy_task_xp", JSON.stringify(nextXP)); } catch {}
          // show sad panda
          setPetState("sad");
          setTimeout(() => setPetState("idle"), 3500);
        }
      }
      localStorage.setItem("edubuddy_last_date", today);
      // reset daily completed tasks for UI
      const resetCompleted: Record<number, boolean> = {};
      tasks.forEach((_, i) => resetCompleted[i] = false);
      setCompletedTasks(resetCompleted);
      try { localStorage.setItem("edubuddy_completed_tasks", JSON.stringify(resetCompleted)); } catch {}
    } else {
      // load persisted XP and completed states
      try {
        const rawXp = localStorage.getItem("edubuddy_task_xp");
        if (rawXp) setTaskXP(JSON.parse(rawXp));
        const rawCompleted = localStorage.getItem("edubuddy_completed_tasks");
        if (rawCompleted) setCompletedTasks(JSON.parse(rawCompleted));
      } catch (e) {}
    }
  }, []);

  // persist completedTasks when changed
  useEffect(() => {
    try { localStorage.setItem("edubuddy_completed_tasks", JSON.stringify(completedTasks)); } catch {}
  }, [completedTasks]);

  useEffect(() => {
    try { localStorage.setItem("edubuddy_task_xp", JSON.stringify(taskXP)); } catch {}
  }, [taskXP]);

  useEffect(() => {
    try { localStorage.setItem("edubuddy_history", JSON.stringify(history)); } catch {}
  }, [history]);

  useEffect(() => {
    try { localStorage.setItem("edubuddy_decay_rate", String(decayRate)); } catch {}
  }, [decayRate]);

  const chartData = useMemo(() => {
    const points = history.slice(-14);
    const labels = points.map(p => p.date);
    const dataPoints = points.map(p => p.points);
    return {
      labels,
      datasets: [
        {
          label: 'Daily Points',
          data: dataPoints,
          borderColor: COLORS.gold,
          backgroundColor: COLORS.yellow,
          tension: 0.3,
          pointRadius: 4,
          pointHoverRadius: 6,
        }
      ]
    };
  }, [history]);

  const chartOptions = useMemo(() => ({
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: { mode: 'index', intersect: false }
    },
    scales: {
      x: { ticks: { color: COLORS.purple300 } },
      y: { ticks: { color: COLORS.purple300 } }
    }
  }), []);

  const generateTasksForSkill = (skill: string, mode: string): Task[] => {
    const skillLower = skill.toLowerCase();
    
    // Language-based skills
    if (skillLower.includes('french') || skillLower.includes('spanish') || skillLower.includes('german') || skillLower.includes('chinese') || skillLower.includes('japanese')) {
      const lang = skill.charAt(0).toUpperCase() + skill.slice(1);
      return [
        { label: `Master ${lang} greetings and common phrases`, xp: 15, category: "Vocabulary" },
        { label: `Learn ${lang} grammar fundamentals (tenses, pronouns)`, xp: 25, category: "Grammar" },
        { label: `Practice ${lang} pronunciation and listening comprehension`, xp: 20, category: "Speaking" },
        { label: `Write short ${lang} essays or journal entries`, xp: 30, category: "Writing" },
        { label: `Hold a basic ${lang} conversation with native speaker`, xp: 35, category: "Practical" },
        { label: `Complete ${lang} immersion challenge (movies, music, reading)`, xp: 25, category: "Immersion" },
      ];
    }
    
    // Art & Design skills
    if (skillLower.includes('photoshop') || skillLower.includes('design') || skillLower.includes('ui') || skillLower.includes('ux') || skillLower.includes('graphic')) {
      return [
        { label: `Master layer management and selection tools`, xp: 20, category: "Fundamentals" },
        { label: `Learn color theory and composition principles`, xp: 25, category: "Theory" },
        { label: `Create a complete design mockup from scratch`, xp: 35, category: "Practical" },
        { label: `Practice typography and text styling`, xp: 20, category: "Design" },
        { label: `Build a professional portfolio piece`, xp: 40, category: "Portfolio" },
        { label: `Critique and redesign existing designs`, xp: 25, category: "Analysis" },
      ];
    }
    
    // Programming & Tech skills
    if (skillLower.includes('python') || skillLower.includes('javascript') || skillLower.includes('coding') || skillLower.includes('programming') || skillLower.includes('swift') || skillLower.includes('java')) {
      return [
        { label: `Understand language basics and syntax fundamentals`, xp: 20, category: "Fundamentals" },
        { label: `Implement core data structures from scratch`, xp: 30, category: "Data Structures" },
        { label: `Solve 5 algorithmic problems on coding platform`, xp: 25, category: "Algorithms" },
        { label: `Build a complete project with the language`, xp: 35, category: "Practical" },
        { label: `Understand design patterns and best practices`, xp: 25, category: "Advanced" },
        { label: `Contribute to open-source or build portfolio project`, xp: 30, category: "Portfolio" },
      ];
    }
    
    // Music skills
    if (skillLower.includes('music') || skillLower.includes('piano') || skillLower.includes('guitar') || skillLower.includes('singing') || skillLower.includes('drum')) {
      return [
        { label: `Learn music theory basics (notes, scales, chords)`, xp: 20, category: "Theory", priority: "Medium", due_date: todayIso },
        { label: `Master instrument fundamentals and hand positioning`, xp: 25, category: "Fundamentals", priority: "High", due_date: todayIso },
        { label: `Practice daily finger exercises and drills`, xp: 15, category: "Practice", priority: "Low", due_date: todayIso },
        { label: `Learn and play a complete song`, xp: 35, category: "Practical", priority: "High", due_date: todayIso },
        { label: `Perform in front of an audience`, xp: 40, category: "Performance", priority: "High", due_date: todayIso },
        { label: `Compose and record your own piece`, xp: 30, category: "Creation", priority: "Medium", due_date: todayIso },
      ];
    }
    
    // Business & Marketing skills
    if (skillLower.includes('marketing') || skillLower.includes('business') || skillLower.includes('seo') || skillLower.includes('sales')) {
      return [
        { label: `Master digital marketing fundamentals and platforms`, xp: 20, category: "Fundamentals" },
        { label: `Learn analytics and data interpretation`, xp: 25, category: "Analytics" },
        { label: `Create a comprehensive marketing campaign`, xp: 35, category: "Strategy" },
        { label: `Build and optimize a landing page`, xp: 30, category: "Practical" },
        { label: `Master social media strategy and engagement`, xp: 25, category: "Social Media" },
        { label: `Analyze competitors and market trends`, xp: 25, category: "Research" },
      ];
    }
    
    // Fitness & Health
    if (skillLower.includes('fitness') || skillLower.includes('yoga') || skillLower.includes('workout') || skillLower.includes('nutrition')) {
      return [
        { label: `Learn proper form and injury prevention techniques`, xp: 20, category: "Safety" },
        { label: `Build a personalized workout routine`, xp: 25, category: "Planning" },
        { label: `Complete 20 workout sessions consistently`, xp: 30, category: "Consistency" },
        { label: `Learn nutrition basics and meal planning`, xp: 25, category: "Nutrition" },
        { label: `Achieve a fitness milestone (running distance, lift weight)`, xp: 35, category: "Practical" },
        { label: `Help someone else with their fitness journey`, xp: 20, category: "Coaching" },
      ];
    }
    
    // Default/generic tasks if skill doesn't match above patterns
    return [
      { label: `Master the fundamentals of ${skill}`, xp: 20, category: "Fundamentals", priority: "High", due_date: todayIso },
      { label: `Study core concepts and theory of ${skill}`, xp: 25, category: "Learning", priority: "Medium", due_date: todayIso },
      { label: `Complete beginner-level ${skill} project`, xp: 30, category: "Practical", priority: "High", due_date: todayIso },
      { label: `Practice intermediate ${skill} techniques`, xp: 25, category: "Practice", priority: "Medium", due_date: todayIso },
      { label: `Build a complete ${skill} portfolio project`, xp: 35, category: "Portfolio", priority: "High", due_date: todayIso },
      { label: `Teach or mentor someone in ${skill}`, xp: 20, category: "Mentoring", priority: "Low", due_date: todayIso },
    ];
  };

  const generateAIRoadmap = async () => {
    if (!goalForm.skill) return;
    setGeneratingRoadmap(true);
    setApiError("");
    
    // Generate roadmap based on training mode
    setTimeout(() => {
      const weeksNum = parseInt(goalForm.weeks);
      const mode = goalForm.mode;
      
      let phases: RoadmapPhase[] = [];
      
      if (mode === "beginner") {
        phases = [
          { phase: "Phase 1: Fundamentals", weeks: `Week 1-${Math.ceil(weeksNum * 0.25)}`, topics: `Introduction to ${goalForm.skill}, Basic Concepts, Setup & Tools, First Project`, milestone: "Build your first simple project", status: "inprogress" },
          { phase: "Phase 2: Core Skills", weeks: `Week ${Math.ceil(weeksNum * 0.25) + 1}-${Math.ceil(weeksNum * 0.5)}`, topics: `Essential Techniques, Common Patterns, Best Practices, Hands-on Practice`, milestone: "Complete 5 beginner projects", status: "upcoming" },
          { phase: "Phase 3: Consolidation", weeks: `Week ${Math.ceil(weeksNum * 0.5) + 1}-${weeksNum}`, topics: `Real-world Applications, Troubleshooting, Mini Portfolio Project, Code Review`, milestone: "Build a complete portfolio piece", status: "upcoming" },
        ];
      } else if (mode === "intermediate") {
        phases = [
          { phase: "Phase 1: Advanced Fundamentals", weeks: `Week 1-${Math.ceil(weeksNum * 0.2)}`, topics: `Advanced ${goalForm.skill} Patterns, Architecture Concepts, Optimization Basics`, milestone: "Master intermediate concepts", status: "inprogress" },
          { phase: "Phase 2: Specialized Skills", weeks: `Week ${Math.ceil(weeksNum * 0.2) + 1}-${Math.ceil(weeksNum * 0.55)}`, topics: `Complex Problem Solving, Advanced Techniques, Performance Optimization, Testing`, milestone: "Complete 8 intermediate challenges", status: "upcoming" },
          { phase: "Phase 3: Integration & Scaling", weeks: `Week ${Math.ceil(weeksNum * 0.55) + 1}-${Math.ceil(weeksNum * 0.85)}`, topics: `System Integration, Best Practices, Scalability, Real-world Solutions`, milestone: "Build an integrated system", status: "upcoming" },
          { phase: "Phase 4: Mastery Project", weeks: `Week ${Math.ceil(weeksNum * 0.85) + 1}-${weeksNum}`, topics: `End-to-end Project Development, Documentation, Deployment, Code Excellence`, milestone: "Complete a professional-grade project", status: "upcoming" },
        ];
      } else {
        phases = [
          { phase: "Phase 1: Expert Foundations", weeks: `Week 1-${Math.ceil(weeksNum * 0.15)}`, topics: `Cutting-edge ${goalForm.skill} Techniques, Architectural Patterns, Advanced Design`, milestone: "Understand expert-level concepts", status: "inprogress" },
          { phase: "Phase 2: Deep Specialization", weeks: `Week ${Math.ceil(weeksNum * 0.15) + 1}-${Math.ceil(weeksNum * 0.4)}`, topics: `Advanced Algorithm Implementation, Performance Tuning, Scalable Design`, milestone: "Master specialized expertise", status: "upcoming" },
          { phase: "Phase 3: Complex Systems", weeks: `Week ${Math.ceil(weeksNum * 0.4) + 1}-${Math.ceil(weeksNum * 0.7)}`, topics: `System Architecture, Advanced Optimization, Distributed Systems Concepts, Mentoring Patterns`, milestone: "Build a complex multi-component system", status: "upcoming" },
          { phase: "Phase 4: Thought Leadership", weeks: `Week ${Math.ceil(weeksNum * 0.7) + 1}-${Math.ceil(weeksNum * 0.9)}`, topics: `Advanced Problem Solving, Contributing to Community, Best Practices Documentation`, milestone: "Create thought leadership content", status: "upcoming" },
          { phase: "Phase 5: Mastery & Innovation", weeks: `Week ${Math.ceil(weeksNum * 0.9) + 1}-${weeksNum}`, topics: `Innovative Applications, Teaching Others, Advanced Optimization, Industry Standards`, milestone: "Become an expert and innovator", status: "upcoming" },
        ];
      }
      
      const mockRoadmap: Roadmap = {
        title: `${mode.charAt(0).toUpperCase() + mode.slice(1)} ${goalForm.skill} Mastery - ${weeksNum} weeks`,
        phases: phases,
        tip: `Perfect pace for ${mode} learners! Dedicate ${goalForm.time} hour(s) daily to master ${goalForm.skill} in ${weeksNum} weeks. Remember: consistency beats intensity!`
      };
      
      // Generate skill-specific tasks
      const skillTasks = generateTasksForSkill(goalForm.skill, mode);
      setTasks(skillTasks);
      const newCompleted: Record<number, boolean> = {};
      skillTasks.forEach((_, i) => newCompleted[i] = false);
      setCompletedTasks(newCompleted);
      setTaskXP(skillTasks.map(t => t.xp));
      try { localStorage.setItem("edubuddy_task_xp", JSON.stringify(skillTasks.map(t => t.xp))); } catch {}
      try { localStorage.setItem("edubuddy_completed_tasks", JSON.stringify(newCompleted)); } catch {}

      setRoadmap(mockRoadmap);
      setGeneratingRoadmap(false);
      setShowGoalModal(false);
      setActiveTab("roadmap");
      setPetState("jump");
      setTimeout(() => setPetState("idle"), 3000);
    }, 1500);
  };

  const currentRoadmap = roadmap || defaultRoadmap;
  const [roadmapStartDate, setRoadmapStartDate] = useState<string>(() => {
    const d = new Date();
    return d.toISOString().slice(0,10);
  });

  function parseWeekRange(weeks: string) {
    // Examples: "Week 1", "Week 2-4", "Weeks 7+", "Week 9-12"
    const s = weeks.replace(/Weeks?/i, '').trim();
    if (s.includes('+')) {
      const n = Number(s.replace('+','').replace(/[^\\d]/g,'')) || 1;
      return [n, n + 3];
    }
    if (s.includes('-')) {
      const [a,b] = s.split('-').map(x => Number(x.replace(/[^\d]/g,'')));
      return [a||1, b||a||1];
    }
    const n = Number(s.replace(/[^\d]/g,'')) || 1;
    return [n, n];
  }

  function dateAfterWeeks(startIso:string, weeks:number) {
    const d = new Date(startIso + 'T00:00:00');
    d.setDate(d.getDate() + (weeks-1)*7);
    return d;
  }

  function formatDate(d: Date) {
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}-${month}-${year}`;
  }

  useEffect(() => {
    const loadProfile = async () => {
      setProfileError("");
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError) {
        setProfileError("Unable to load your profile.");
        return;
      }

      if (!user) {
        return;
      }

      setUserId(user.id);
      if (user.email) {
        setUserEmail(user.email);
      }
      const authName =
        (user.user_metadata as any)?.full_name ||
        (user.user_metadata as any)?.name ||
        "";

      const { data: profile, error: profileLoadError } = await supabase
        .from("users")
        .select("name, username, email, xp, completed_tasks, activity_days, task_xp, history, decay_rate, badges")
        .eq("id", user.id)
        .single();

      if (profileLoadError) {
        // If the row doesn't exist yet, still use auth metadata or email prefix.
        if (authName) {
          setName(authName);
        } else if (user.email) {
          setName(user.email.split("@")[0]);
        }
        if ((user.user_metadata as any)?.username) {
          setUsername((user.user_metadata as any).username);
        }
        if ((user.user_metadata as any)?.learning_goal) {
          setLearningGoal((user.user_metadata as any).learning_goal);
        }
        return;
      }

      if (profile?.name) {
        setName(profile.name);
      } else if (authName) {
        setName(authName);
      } else if (user.email) {
        setName(user.email.split("@")[0]);
      }
      if (profile?.username) setUsername(profile.username);
      if (profile?.email) setUserEmail(profile.email);
      if (profile?.xp != null) setXp(profile.xp);
      if (profile?.completed_tasks) setCompletedTasks(profile.completed_tasks);
      if (Array.isArray(profile?.activity_days) && profile.activity_days.length === 7) {
        setActivityDays(profile.activity_days.map((value: any) => !!value));
      }
      if (profile?.task_xp && Array.isArray(profile.task_xp)) {
        setTaskXP(profile.task_xp);
        try { localStorage.setItem("edubuddy_task_xp", JSON.stringify(profile.task_xp)); } catch {}
      }
      if (profile?.history && Array.isArray(profile.history)) {
        setHistory(profile.history);
        try { localStorage.setItem("edubuddy_history", JSON.stringify(profile.history)); } catch {}
        const flattened = profile.history.flatMap((entry: any) => Array.isArray(entry.tasks) ? entry.tasks : []);
        if (flattened.length) setTaskHistory(flattened as TaskHistoryEntry[]);
      }
      if (profile?.decay_rate != null) {
        setDecayRate(Number(profile.decay_rate));
        try { localStorage.setItem("edubuddy_decay_rate", String(profile.decay_rate)); } catch {}
      }
      if (profile?.badges) setSavedBadges(profile.badges || {});
      if (profile?.xp != null) setXp(profile.xp);
      if (profile?.completed_tasks) setCompletedTasks(profile.completed_tasks);
      if (Array.isArray(profile?.activity_days) && profile.activity_days.length === 7) {
        setActivityDays(profile.activity_days);
      }
      if ((user.user_metadata as any)?.learning_goal) {
        setLearningGoal((user.user_metadata as any).learning_goal);
      }
    };

    loadProfile();
  }, []);

  const saveName = async () => {
    if (!userId) return;
    setSavingName(true);
    setProfileError("");

    const { error } = await supabase
      .from("users")
      .update({ name })
      .eq("id", userId);

    if (error) {
      setProfileError("Could not save your name. Try again.");
    } else {
      setEditingName(false);
    }

    setSavingName(false);
  };

  const saveProfile = async () => {
    if (!userId) return;
    setSavingProfile(true);
    setProfileError("");

    try {
      const profileUpdate: any = { name };
      if (username) profileUpdate.username = username;
      const { error: rowError } = await supabase.from("users").update(profileUpdate).eq("id", userId);
      const { error: authError } = await supabase.auth.updateUser({ data: { learning_goal: learningGoal } });

      if (rowError || authError) {
        setProfileError("Could not save profile changes. Try again.");
      } else {
        setEditingProfile(false);
      }
    } catch (err) {
      setProfileError("Could not save profile changes. Try again.");
    }

    setSavingProfile(false);
  };

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
                   <div style={{ display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap" }}>
                     <h1 style={{ fontSize: 32, fontWeight: 900, margin: 0 }}>Hi, {displayName}!</h1>
                     <button onClick={() => setEditingName(prev => !prev)} style={{ background: COLORS.yellow, color: COLORS.purple900, border: "none", padding: "10px 16px", borderRadius: 14, fontWeight: 800, cursor: "pointer", fontSize: 13 }}>
                       {editingName ? "Cancel" : "Edit name"}
                     </button>
                   </div>
                   <p style={{ color: COLORS.purple300, margin: "10px 0 0", fontSize: 16 }}>Your goal: <span style={{ color: COLORS.yellow, fontWeight: 700 }}>{currentRoadmap.title}</span></p>
                </div>
                <div style={{ display: "flex", gap: 12 }}>
                    <div style={{ background: "rgba(124,58,237,0.15)", padding: "10px 20px", borderRadius: 14, border: `1px solid ${COLORS.purple500}44` }}>
                        <div style={{ fontSize: 11, fontWeight: 800, color: COLORS.purple300 }}>DAILY STREAK</div>
                        <div style={{ fontSize: 18, fontWeight: 900 }}>🔥 {currentStreak} Days</div>
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
                        <div style={{ fontWeight: 900, color: COLORS.gold }}>{courseProgress}%</div>
                    </div>
                    <ProgressBar percent={courseProgress} color={COLORS.gold} />
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

            {editingName && (
              <div style={{ marginBottom: 24, maxWidth: 560, padding: 24, background: "rgba(255,255,255,0.05)", borderRadius: 24, border: "1px solid rgba(255,255,255,0.1)" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 18, gap: 12, flexWrap: "wrap" }}>
                  <div>
                    <div style={{ fontSize: 15, fontWeight: 800, color: COLORS.purple200, marginBottom: 6 }}>Change your display name</div>
                    <div style={{ fontSize: 13, color: COLORS.purple400 }}>This updates the name shown across your dashboard.</div>
                  </div>
                </div>
                <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                  <input
                    value={name}
                    onChange={e => setName(e.target.value)}
                    placeholder="Enter your name"
                    style={{ flex: 1, minWidth: 220, padding: "14px 18px", borderRadius: 14, background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)", color: "white", fontSize: 15, fontFamily: "'Nunito', sans-serif" }}
                  />
                  <button onClick={saveName} disabled={savingName || !name.trim()} style={{ background: COLORS.yellow, color: COLORS.purple900, border: "none", padding: "14px 22px", borderRadius: 14, fontSize: 15, fontWeight: 900, cursor: savingName ? "default" : "pointer" }}>
                    {savingName ? "Saving..." : "Save name"}
                  </button>
                </div>
                {profileError && <div style={{ marginTop: 12, color: "#F87171", fontSize: 13, fontWeight: 700 }}>{profileError}</div>}
              </div>
            )}

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
                        <div onClick={(e) => { e.stopPropagation(); handleTaskToggle(i); }} title={t.category} style={{ width: 40, height: 40, borderRadius: 10, border: `2px solid ${completedTasks[i] ? COLORS.yellow : "rgba(255,255,255,0.08)"}`, background: completedTasks[i] ? COLORS.yellow : "rgba(255,255,255,0.02)", display: "flex", alignItems: "center", justifyContent: "center", fontStyle: "normal", fontSize: 18, cursor: "pointer" }}>
                          {completedTasks[i] ? <span style={{ color: COLORS.purple900, fontWeight: 900 }}>✓</span> : (t.category === "Logic" ? "🧠" : t.category === "Practical" ? "🛠️" : "📚")}
                        </div>
                            <div style={{ flex: 1 }}>
                                <div style={{ fontWeight: 800, fontSize: 16 }}>{t.label}</div>
                                <div style={{ fontSize: 12, color: COLORS.purple400 }}>{t.category}</div>
                            </div>
                        <div style={{ fontWeight: 900, color: COLORS.gold }}>+{taskXP[i] ?? t.xp} XP</div>
                        </div>
                    ))}
                </div>
            </div>
          </div>
        )}

        {activeTab === "companion" && (
          <div style={{ maxWidth: 1000, margin: "0 auto" }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
              <div style={{ background: "rgba(255,255,255,0.03)", borderRadius: 32, border: "1px solid rgba(255,255,255,0.06)", padding: 30 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
                  <div style={{ fontWeight: 900, fontSize: 18 }}>Pet Status</div>
                  <div style={{ color: COLORS.purple300, fontSize: 12 }}>Realtime wellbeing</div>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 18, marginBottom: 24 }}>
                  <div style={{ background: "rgba(255,255,255,0.02)", borderRadius: 20, padding: 18 }}>
                    <div style={{ fontSize: 12, color: COLORS.purple300, marginBottom: 6 }}>Panda HP</div>
                    <div style={{ fontSize: 28, fontWeight: 900 }}>{Math.round(petHp)}%</div>
                  </div>
                  <div style={{ background: "rgba(255,255,255,0.02)", borderRadius: 20, padding: 18 }}>
                    <div style={{ fontSize: 12, color: COLORS.purple300, marginBottom: 6 }}>Panda Level</div>
                    <div style={{ fontSize: 28, fontWeight: 900 }}>{level}</div>
                  </div>
                </div>
                <div style={{ display: "flex", justifyContent: "center", alignItems: "center", marginBottom: 24 }}>
                  <div style={{ width: 120, height: 120, position: "relative" }}>
                    <div style={{ position: "absolute", inset: 0, borderRadius: "50%", border: "10px solid rgba(255,255,255,0.08)" }} />
                    <div style={{ position: "absolute", inset: 0, borderRadius: "50%", border: `10px solid ${COLORS.yellow}`, clipPath: `polygon(50% 50%, 100% 50%, 100% 0, 50% 0)` }} />
                    <div style={{ position: "absolute", inset: 12, borderRadius: "50%", background: "rgba(255,255,255,0.06)", display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontWeight: 900, fontSize: 18 }}>
                      {xpProgress}%
                    </div>
                  </div>
                </div>
                <div style={{ display: "grid", gap: 16 }}>
                  {[
                    { label: "Happiness", value: happiness, color: COLORS.mint },
                    { label: "Energy", value: energy, color: COLORS.yellow },
                    { label: "Focus", value: focus, color: COLORS.purple400 },
                  ].map(stat => (
                    <div key={stat.label} style={{ background: "rgba(255,255,255,0.02)", borderRadius: 18, padding: 16 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
                        <div style={{ color: COLORS.purple300, fontSize: 12 }}>{stat.label}</div>
                        <div style={{ fontWeight: 900, color: stat.color }}>{stat.value}%</div>
                      </div>
                      <ProgressBar percent={stat.value} color={stat.color} />
                    </div>
                  ))}
                </div>
              </div>

              <div style={{ background: "rgba(255,255,255,0.03)", borderRadius: 32, border: "1px solid rgba(255,255,255,0.06)", padding: 30 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
                  <div style={{ fontWeight: 900, fontSize: 18 }}>User Profile</div>
                  <button onClick={() => setEditingProfile(prev => !prev)} style={{ background: COLORS.yellow, color: COLORS.purple900, border: "none", padding: "8px 14px", borderRadius: 12, fontWeight: 800, cursor: "pointer", fontSize: 12 }}>
                    {editingProfile ? "Close" : "Edit"}
                  </button>
                </div>
                <div style={{ display: "grid", gap: 16 }}>
                  <div style={{ display: "grid", gap: 6 }}>
                    <div style={{ fontSize: 12, color: COLORS.purple300 }}>Name</div>
                    <div style={{ fontWeight: 900 }}>{name || "-"}</div>
                  </div>
                  <div style={{ display: "grid", gap: 6 }}>
                    <div style={{ fontSize: 12, color: COLORS.purple300 }}>Username</div>
                    <div style={{ fontWeight: 900 }}>{username || "-"}</div>
                  </div>
                  <div style={{ display: "grid", gap: 6 }}>
                    <div style={{ fontSize: 12, color: COLORS.purple300 }}>Email</div>
                    <div style={{ fontWeight: 900 }}>{userEmail || "-"}</div>
                  </div>
                  <div style={{ display: "grid", gap: 6 }}>
                    <div style={{ fontSize: 12, color: COLORS.purple300 }}>Learning Goal</div>
                    <div style={{ fontWeight: 900, color: COLORS.gold }}>{learningGoal || "No goal set"}</div>
                  </div>
                </div>
                {editingProfile && (
                  <div style={{ marginTop: 24, display: "grid", gap: 16 }}>
                    <div style={{ display: "grid", gap: 8 }}>
                      <label style={{ color: COLORS.purple300, fontSize: 12 }}>Name</label>
                      <input value={name} onChange={e => setName(e.target.value)} style={{ width: "100%", padding: "12px 14px", borderRadius: 12, border: "1px solid rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.05)", color: "white" }} />
                    </div>
                    <div style={{ display: "grid", gap: 8 }}>
                      <label style={{ color: COLORS.purple300, fontSize: 12 }}>Learning Goal</label>
                      <input value={learningGoal} onChange={e => setLearningGoal(e.target.value)} style={{ width: "100%", padding: "12px 14px", borderRadius: 12, border: "1px solid rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.05)", color: "white" }} />
                    </div>
                    <button onClick={saveProfile} disabled={savingProfile} style={{ background: COLORS.yellow, color: COLORS.purple900, border: "none", padding: "14px 18px", borderRadius: 14, fontWeight: 900, cursor: "pointer" }}>
                      {savingProfile ? "Saving..." : "Save Profile"}
                    </button>
                    {profileError && <div style={{ color: "#F87171", fontSize: 13 }}>{profileError}</div>}
                  </div>
                )}
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1.2fr 0.8fr", gap: 24, marginTop: 24 }}>
              <div style={{ background: "rgba(255,255,255,0.03)", borderRadius: 32, border: "1px solid rgba(255,255,255,0.06)", padding: 30 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
                  <div style={{ fontWeight: 900, fontSize: 18 }}>Task History</div>
                  <div style={{ color: COLORS.purple300, fontSize: 12 }}>{taskHistory.length} recent items</div>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 12, maxHeight: 320, overflowY: "auto", paddingRight: 4 }}>
                  {(taskHistory.length ? taskHistory : history.slice(-6).map(h => ({ task: `${h.completedCount || 0} task${h.completedCount === 1 ? "" : "s"}`, completed_at: h.date, xp: h.points || 0 }))).map((entry, idx) => (
                    <div key={idx} style={{ display: "flex", justifyContent: "space-between", gap: 12, background: "rgba(255,255,255,0.02)", borderRadius: 20, padding: 18 }}>
                      <div>
                        <div style={{ fontWeight: 800 }}>{entry.task}</div>
                        <div style={{ fontSize: 12, color: COLORS.purple300 }}>{entry.completed_at}</div>
                      </div>
                      <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", justifyContent: "space-between" }}>
                        <div style={{ fontWeight: 900, color: COLORS.gold }}>+{entry.xp} XP</div>
                        <div style={{ fontSize: 12, color: COLORS.purple300 }}>{entry.completed_at}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div style={{ background: "rgba(255,255,255,0.03)", borderRadius: 32, border: "1px solid rgba(255,255,255,0.06)", padding: 30 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
                  <div style={{ fontWeight: 900, fontSize: 18 }}>Progress Analytics</div>
                  <div style={{ color: COLORS.purple300, fontSize: 12 }}>Weekly summary</div>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0,1fr))", gap: 16, marginBottom: 24 }}>
                  <div style={{ background: "rgba(255,255,255,0.02)", borderRadius: 20, padding: 16 }}>
                    <div style={{ fontSize: 12, color: COLORS.purple300 }}>Current Streak</div>
                    <div style={{ fontWeight: 900, fontSize: 24 }}>{currentStreak} days</div>
                  </div>
                  <div style={{ background: "rgba(255,255,255,0.02)", borderRadius: 20, padding: 16 }}>
                    <div style={{ fontSize: 12, color: COLORS.purple300 }}>Total XP</div>
                    <div style={{ fontWeight: 900, fontSize: 24 }}>{xp}</div>
                  </div>
                  <div style={{ background: "rgba(255,255,255,0.02)", borderRadius: 20, padding: 16 }}>
                    <div style={{ fontSize: 12, color: COLORS.purple300 }}>Tasks Completed</div>
                    <div style={{ fontWeight: 900, fontSize: 24 }}>{totalTasksCompleted}</div>
                  </div>
                  <div style={{ background: "rgba(255,255,255,0.02)", borderRadius: 20, padding: 16 }}>
                    <div style={{ fontSize: 12, color: COLORS.purple300 }}>Weekly Progress</div>
                    <div style={{ fontWeight: 900, fontSize: 24 }}>{weeklyProgressPercent}%</div>
                  </div>
                </div>
                <div style={{ background: "rgba(255,255,255,0.02)", borderRadius: 24, padding: 18, minHeight: 220 }}>
                  <div style={{ fontSize: 13, color: COLORS.purple300, marginBottom: 12 }}>Recent XP trend</div>
                  <div style={{ width: "100%", height: 160 }}>
                    <Line data={chartData} options={chartOptions as any} />
                  </div>
                </div>
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24, marginTop: 24 }}>
              <div style={{ background: "rgba(255,255,255,0.03)", borderRadius: 32, border: "1px solid rgba(255,255,255,0.06)", padding: 30 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
                  <div style={{ fontWeight: 900, fontSize: 18 }}>Upcoming Tasks</div>
                  <div style={{ color: COLORS.purple300, fontSize: 12 }}>Today</div>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 14, maxHeight: 320, overflowY: "auto" }}>
                  {pendingTasks.length ? pendingTasks.map(task => (
                    <div key={task.index} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 14, background: "rgba(255,255,255,0.02)", borderRadius: 20, padding: 18 }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 800 }}>{task.label}</div>
                        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 6, color: COLORS.purple300, fontSize: 12 }}>
                          <span>{task.priority || "Medium"} priority</span>
                          <span>{task.due_date || todayIso}</span>
                        </div>
                      </div>
                      <button onClick={() => handleTaskToggle(task.index)} style={{ width: 38, height: 38, borderRadius: 12, border: "2px solid rgba(255,255,255,0.1)", background: "transparent", color: COLORS.purple100, cursor: "pointer", fontSize: 18, fontWeight: 800 }}>
                        ✓
                      </button>
                    </div>
                  )) : (
                    <div style={{ color: COLORS.purple300, fontSize: 14, padding: 18, borderRadius: 20, background: "rgba(255,255,255,0.02)" }}>No pending tasks for today!</div>
                  )}
                </div>
              </div>
              <div style={{ background: "rgba(255,255,255,0.03)", borderRadius: 32, border: "1px solid rgba(255,255,255,0.06)", padding: 30 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
                  <div style={{ fontWeight: 900, fontSize: 18 }}>Achievements</div>
                  <div style={{ color: COLORS.purple300, fontSize: 12 }}>Milestones</div>
                </div>
                <div style={{ display: "grid", gap: 16 }}>
                  {[
                    { title: "7-Day Streak", desc: "Keep the momentum alive.", earned: currentStreak >= 7, icon: "🔥" },
                    { title: "50% Progress", desc: "Halfway to mastery.", earned: courseProgress >= 50, icon: "⭐" },
                    { title: "Task Champion", desc: "30+ tasks completed.", earned: totalTasksCompleted >= 30, icon: "🏅" },
                    { title: "Evolution Ready", desc: "Grow your panda to the next form.", earned: level >= 5, icon: "🌱" },
                  ].map(badge => (
                    <div key={badge.title} style={{ display: "flex", gap: 14, alignItems: "center", background: "rgba(255,255,255,0.02)", borderRadius: 20, padding: 16, border: `1px solid ${badge.earned ? COLORS.yellow + "44" : "rgba(255,255,255,0.05)"}` }}>
                      <div style={{ width: 44, height: 44, borderRadius: 16, background: badge.earned ? COLORS.yellow : "rgba(255,255,255,0.08)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20 }}>{badge.icon}</div>
                      <div>
                        <div style={{ fontWeight: 900 }}>{badge.title}</div>
                        <div style={{ fontSize: 12, color: COLORS.purple300 }}>{badge.desc}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === "progress" && (
          <div style={{ maxWidth: 900, margin: "0 auto" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
              <h1 style={{ fontSize: 28, fontWeight: 900, margin: 0 }}>Analytics</h1>
              <div style={{ color: COLORS.purple300, fontWeight: 800 }}>{history.length} days tracked</div>
            </div>

            <div style={{ background: "rgba(255,255,255,0.03)", padding: 20, borderRadius: 16, marginBottom: 20 }}>
              <div style={{ fontSize: 13, color: COLORS.purple300, marginBottom: 8 }}>Daily Points (last {Math.min(14, history.length)} days)</div>
              <div style={{ width: "100%", height: 240 }}>
                <Line data={chartData} options={chartOptions as any} />
              </div>
              <div style={{ display: 'flex', gap: 12, marginTop: 12 }}>
                <button onClick={resetTaskXP} style={{ background: COLORS.purple700, color: 'white', border: 'none', padding: '8px 12px', borderRadius: 10, fontWeight: 800 }}>Reset Task XP</button>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <div style={{ fontSize: 13, color: COLORS.purple300 }}>Decay</div>
                  <input type="range" min={0} max={0.9} step={0.05} value={decayRate} onChange={e => updateDecayRate(Number(e.target.value))} />
                  <div style={{ color: COLORS.purple200, fontWeight: 800 }}>{Math.round(decayRate * 100)}%</div>
                </div>
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <div style={{ background: "rgba(255,255,255,0.03)", padding: 16, borderRadius: 12 }}>
                <div style={{ fontSize: 13, color: COLORS.purple300, marginBottom: 8 }}>Recent Activity</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {history.slice(-7).reverse().map(h => (
                    <div key={h.date} style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <div style={{ color: COLORS.purple200, fontWeight: 800 }}>{h.date}</div>
                      <div style={{ color: COLORS.gold, fontWeight: 900 }}>{h.points} pts • {h.completedCount} tasks</div>
                    </div>
                  ))}
                </div>
              </div>

              <div style={{ background: "rgba(255,255,255,0.03)", padding: 16, borderRadius: 12 }}>
                <div style={{ fontSize: 13, color: COLORS.purple300, marginBottom: 8 }}>Tendency</div>
                <div style={{ fontSize: 20, fontWeight: 900 }}>
                  {(() => {
                    const last = history.slice(-3);
                    if (last.length < 2) return "Not enough data";
                    const prev = last[last.length - 2].points;
                    const cur = last[last.length - 1].points;
                    const diff = cur - prev;
                    const pct = Math.round((diff / Math.max(1, prev)) * 100);
                    return (
                      <span style={{ color: diff >= 0 ? COLORS.mint : COLORS.purple200 }}>{diff >= 0 ? `▲ ${pct}%` : `▼ ${Math.abs(pct)}%`}</span>
                    );
                  })()}
                </div>
                <div style={{ fontSize: 12, color: COLORS.purple400, marginTop: 8 }}>Shows daily point change (last 2 days)</div>
              </div>
            </div>
          </div>
        )}

        {activeTab === "tasks" && (
          <div style={{ maxWidth: 900, margin: "0 auto" }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h1 style={{ fontSize: 28, fontWeight: 900 }}>Daily Tasks</h1>
            </div>

            {tasks.length === 0 ? (
              <div style={{ padding: 24, background: 'rgba(255,255,255,0.03)', borderRadius: 12 }}>
                <div style={{ fontSize: 16, color: COLORS.purple300, marginBottom: 12 }}>No tasks for today.</div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button onClick={() => { setTasks(initialTasks); const base = initialTasks.map(t=>t.xp); setTaskXP(base); try{ localStorage.setItem('edubuddy_task_xp', JSON.stringify(base)); }catch{} }} style={{ background: COLORS.yellow, color: COLORS.purple900, padding: '10px 14px', borderRadius: 10, fontWeight: 900 }}>Add sample tasks</button>
                </div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {tasks.map((t, i) => (
                  <div key={i} onClick={() => handleTaskToggle(i)} style={{ background: 'rgba(255,255,255,0.04)', borderRadius: 20, padding: '18px 20px', display: 'flex', alignItems: 'center', gap: 16, cursor: 'pointer', border: `1px solid ${completedTasks[i] ? COLORS.yellow + '44' : 'transparent'}` }}>
                    <div onClick={(e) => { e.stopPropagation(); handleTaskToggle(i); }} title={t.category} style={{ width: 48, height: 48, borderRadius: 12, border: `2px solid ${completedTasks[i] ? COLORS.yellow : 'rgba(255,255,255,0.08)'}`, background: completedTasks[i] ? COLORS.yellow : 'rgba(255,255,255,0.02)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22 }}>
                      {completedTasks[i] ? <span style={{ color: COLORS.purple900, fontWeight: 900 }}>✓</span> : (t.category === 'Logic' ? '🧠' : t.category === 'Practical' ? '🛠️' : '📚')}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 800, fontSize: 16 }}>{t.label}</div>
                      <div style={{ fontSize: 12, color: COLORS.purple400 }}>{t.category}</div>
                    </div>
                    <div style={{ fontWeight: 900, color: COLORS.gold }}>+{taskXP[i] ?? t.xp} XP</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === "achievements" && (
          <div style={{ maxWidth: 900, margin: '0 auto' }}>
            {/* compute simple badges */}
            {(() => {
              const sevenDay = currentStreak >= 7;
              const halfway = courseProgress >= 50;
              const consistent = (history.slice(-7).filter(h => h.completedCount > 0).length) >= 5;
              const taskMaster = history.reduce((s, h) => s + (h.completedCount || 0), 0) >= 30;
              const badges = [
                { id: 'streak7', name: '7-Day Streak', desc: 'Complete at least one task for 7 days in a row.', earned: sevenDay, color: '#F59E0B' },
                { id: 'halfway', name: 'Halfway There', desc: 'Reach 50% course progress.', earned: halfway, color: '#10B981' },
                { id: 'consistent', name: 'Consistent Learner', desc: 'Complete tasks on 5 of the last 7 days.', earned: consistent, color: '#3B82F6' },
                { id: 'taskmaster', name: 'Task Master', desc: 'Complete 30+ tasks total.', earned: taskMaster, color: '#D946EF' },
              ];
              return <Badges badges={badges} />;
            })()}
          </div>
        )}

        {/* Roadmap Display */}
        {activeTab === "roadmap" && (
           <div style={{ maxWidth: 800, margin: "0 auto" }}>
              <div style={{ textAlign: "center", marginBottom: 48 }}>
                 <h1 style={{ fontSize: 32, fontWeight: 900, marginBottom: 8 }}>{currentRoadmap.title}</h1>
                 <p style={{ color: COLORS.purple300 }}>A custom learning path generated just for you.</p>
              </div>

              <div style={{ marginBottom: 18, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                 <div style={{ color: COLORS.purple300 }}>Roadmap start date</div>
                 <input type="date" value={roadmapStartDate} onChange={e=>setRoadmapStartDate(e.target.value)} style={{ background: COLORS.purple800, color: 'white', padding: '8px 10px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.08)' }} />
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {currentRoadmap.phases.map((p, i) => {
                  const [startWeek, endWeek] = parseWeekRange(p.weeks);
                  const startDate = dateAfterWeeks(roadmapStartDate, startWeek);
                  const endDate = dateAfterWeeks(roadmapStartDate, endWeek + 1);
                  const suggested = (p.topics || '').split(',').map(s=>s.trim()).slice(0,3);
                  return (
                    <div key={i} style={{ display: "flex", gap: 24 }}>
                      <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                        <div style={{ width: 44, height: 44, borderRadius: "50%", background: p.status === "completed" ? COLORS.mint : p.status === "inprogress" ? COLORS.yellow : "rgba(255,255,255,0.05)", display: "flex", alignItems: "center", justifyContent: "center", border: "4px solid rgba(255,255,255,0.05)", zIndex: 1 }}>
                          {p.status === "completed" ? "✓" : p.status === "inprogress" ? "🚀" : "🔒"}
                        </div>
                        {i < currentRoadmap.phases.length - 1 && <div style={{ width: 2, flex: 1, background: "rgba(255,255,255,0.05)", margin: "4px 0" }} />}
                      </div>
                      <div style={{ flex: 1, background: "rgba(255,255,255,0.03)", borderRadius: 24, padding: "20px", border: `1px solid ${p.status === "inprogress" ? COLORS.yellow + "44" : "transparent"}`, marginBottom: 12 }}>
                         <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                            <div>
                              <div style={{ fontWeight: 900, fontSize: 18, color: p.status === "locked" ? COLORS.purple400 : "white" }}>{p.phase}</div>
                              <div style={{ fontSize: 12, color: COLORS.purple300 }}>{p.topics}</div>
                            </div>
                            <div style={{ textAlign: 'right' }}>
                              <div style={{ fontSize: 12, fontWeight: 800, color: COLORS.purple400 }}>{p.weeks}</div>
                              <div style={{ fontSize: 12, color: COLORS.purple300 }}>{formatDate(startDate)} → {formatDate(endDate)}</div>
                            </div>
                         </div>

                         <div style={{ marginBottom: 12 }}>
                           <div style={{ fontSize: 13, color: COLORS.purple300, marginBottom: 6 }}>Suggested daily micro-tasks (small wins):</div>
                           <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                             {suggested.map((s, idx) => (
                               <div key={idx} style={{ background: 'rgba(255,255,255,0.04)', padding: '8px 10px', borderRadius: 8, fontSize: 13 }}>{s}</div>
                             ))}
                           </div>
                         </div>

                         <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                           <div style={{ fontSize: 13 }}>Daily time:</div>
                           <div style={{ fontWeight: 900, color: COLORS.yellow }}>{goalForm.time} hr/day</div>
                           <div style={{ marginLeft: 12, fontSize: 12, color: COLORS.purple400 }}>Estimated weeks: {startWeek}{startWeek===endWeek? '': ` - ${endWeek}`}</div>
                         </div>
                      </div>
                    </div>
                  );
                })}
              </div>
              <div style={{ marginTop: 20 }}>
                <RoadmapSchedule roadmap={currentRoadmap} startDate={roadmapStartDate} hoursPerDay={goalForm.time} userId={userId} onChangeStart={(days)=>{
                  const d = new Date(roadmapStartDate + 'T00:00:00');
                  d.setDate(d.getDate() + days);
                  setRoadmapStartDate(d.toISOString().slice(0,10));
                }} onToggleComplete={async (date, completed, points) => {
                  // reflect completion into Daily Tasks XP and panda moods
                  const dayIndex = Object.keys(completedTasks).length ? 0 : 0; // unused here; we map tasks separately
                  let nextXp = xp;
                  if (completed) {
                    nextXp = xp + (points || 10);
                    setPetState('jump');
                    setTimeout(()=>setPetState('idle'), 2500);
                  } else {
                    nextXp = Math.max(0, xp - (points || 10));
                  }
                  setXp(nextXp);
                  // record activity day for streak detection
                  const todayIndex = new Date(date).getDay() === 0 ? 6 : new Date(date).getDay() - 1;
                  const nextActivityDays = [...activityDays];
                  nextActivityDays[todayIndex] = completed;
                  setActivityDays(nextActivityDays);
                  await saveUserStats({ xp: nextXp, completed_tasks: completedTasks, activity_days: nextActivityDays });
                }} />
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

                 <div>
                    <label style={{ fontSize: 14, fontWeight: 800, color: COLORS.purple300, display: "block", marginBottom: 8 }}>Training Mode</label>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10 }}>
                        {["beginner", "intermediate", "advanced"].map(mode => (
                            <button
                                key={mode}
                                onClick={() => setGoalForm(f => ({ ...f, mode: mode as any }))}
                                style={{
                                    padding: "10px 16px",
                                    borderRadius: 10,
                                    border: "2px solid",
                                    borderColor: goalForm.mode === mode ? COLORS.yellow : "rgba(255,255,255,0.1)",
                                    background: goalForm.mode === mode ? COLORS.yellow + "20" : "transparent",
                                    color: goalForm.mode === mode ? COLORS.yellow : COLORS.purple300,
                                    fontWeight: 800,
                                    fontSize: 12,
                                    cursor: "pointer",
                                    textTransform: "capitalize",
                                    fontFamily: "'Nunito', sans-serif"
                                }}
                            >
                                {mode}
                            </button>
                        ))}
                    </div>
                 </div>

                 <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                    <div>
                        <label style={{ fontSize: 13, fontWeight: 800, color: COLORS.purple300, display: "block", marginBottom: 8 }}>Hours / Day</label>
                        <select value={goalForm.time} onChange={e => setGoalForm(f => ({ ...f, time: e.target.value }))} style={{ width: "100%", padding: "12px 14px", borderRadius: 12, background: COLORS.purple800, border: "1px solid rgba(255,255,255,0.1)", color: "white", fontSize: 14, fontFamily: "'Nunito', sans-serif" }}>
                            {["0.5", "1", "1.5", "2", "3", "4"].map(t => <option key={t} value={t}>{t} {parseFloat(t) === 1 ? "hr" : "hrs"}</option>)}
                        </select>
                    </div>
                    <div>
                        <label style={{ fontSize: 13, fontWeight: 800, color: COLORS.purple300, display: "block", marginBottom: 8 }}>Duration</label>
                        <select value={goalForm.weeks} onChange={e => setGoalForm(f => ({ ...f, weeks: e.target.value }))} style={{ width: "100%", padding: "12px 14px", borderRadius: 12, background: COLORS.purple800, border: "1px solid rgba(255,255,255,0.1)", color: "white", fontSize: 14, fontFamily: "'Nunito', sans-serif" }}>
                            {Array.from({length: 12}, (_, i) => String(i + 1)).map(w => <option key={w} value={w}>{w} {w === "1" ? "week" : "weeks"}</option>)}
                        </select>
                    </div>
                 </div>

                 <button onClick={generateAIRoadmap} disabled={generatingRoadmap || !goalForm.skill} style={{ background: COLORS.yellow, color: COLORS.purple900, border: "none", padding: "16px", borderRadius: 14, fontSize: 16, fontWeight: 900, cursor: goalForm.skill ? "pointer" : "not-allowed", opacity: goalForm.skill ? 1 : 0.5, transition: "all 0.2s" }}>
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
