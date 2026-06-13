import { supabase } from "./supabase";

export const createGoal = async (goalData) => {
  const { data, error } = await supabase
    .from("goals")
    .insert([goalData]);

  return { data, error };
};

export const getGoals = async (userId) => {
  const { data, error } = await supabase
    .from("goals")
    .select("*")
    .eq("user_id", userId);

  return { data, error };
};
