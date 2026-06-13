import { supabase } from "./supabase";

export const signUp = (email, password) =>
  supabase.auth.signUp({ email, password });

export const login = (email, password) =>
  supabase.auth.signInWithPassword({ email, password });

export const logout = () =>
  supabase.auth.signOut();
