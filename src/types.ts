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

export type PetState = "idle" | "smile" | "jump" | "dance" | "sleep" | "sad";

export interface Task {
  label: string;
  xp: number;
  category: string;
}
