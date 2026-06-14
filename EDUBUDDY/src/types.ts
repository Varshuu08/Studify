export interface RoadmapPhase {
  phase: string;
  weeks: string;
  topics: string;
  milestone: string;
  status: "completed" | "inprogress" | "locked" | "upcoming";
}

export interface Roadmap {
  title: string;
  phases: RoadmapPhase[];
  tip?: string;
}

export interface DaySchedule {
  date: string; // ISO yyyy-mm-dd
  task: string;
  duration_hours?: number;
}

export interface Schedule {
  startDate: string;
  days: DaySchedule[];
}

export type PetState = "idle" | "smile" | "jump" | "dance" | "sleep" | "sad";

export interface Task {
  label: string;
  xp: number;
  category: string;
  priority?: "High" | "Medium" | "Low";
  due_date?: string;
}

export interface TaskHistoryEntry {
  task: string;
  completed_at: string;
  xp: number;
}
