import { supabase } from "./supabase";

export const updateProgress = async (
  goalId,
  completedTasks,
  xpEarned
) => {
  const { data, error } = await supabase
    .from("progress")
    .update({
      completed_tasks: completedTasks,
      xp_earned: xpEarned,
    })
    .eq("goal_id", goalId);

  return { data, error };
};

export const getProgress = async (goalId) => {
  const { data, error } = await supabase
    .from("progress")
    .select("*")
    .eq("goal_id", goalId);

  return { data, error };
};
