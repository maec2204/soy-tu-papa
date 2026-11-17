"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { MOCK, MOCK_USER_COOKIE, mockRpc } from "./mock/db";
import { createClient } from "./supabase/server";

async function rpc(fn: string, args: Record<string, unknown>) {
  if (MOCK) return mockRpc(fn, args);
  const supabase = await createClient();
  return supabase.rpc(fn, args);
}

export async function createMatch(formData: FormData) {
  const { data, error } = await rpc("create_match", {
    p_kind: formData.get("kind"),
    p_rivals: formData.getAll("rival"),
    p_partner: formData.get("partner"),
  });
  if (error) throw new Error(error.message);
  redirect(`/partido/${data}`);
}

// Si la acción ya no aplica (el otro lado se adelantó), la base la rechaza y
// la pantalla se vuelve a pintar con el estado real del partido.
async function transition(fn: string, args: Record<string, unknown>) {
  await rpc(fn, args);
  revalidatePath("/", "layout");
}

export async function acceptMatch(matchId: string) {
  await transition("accept_match", { p_match: matchId });
}

export async function declineMatch(matchId: string) {
  await transition("decline_match", { p_match: matchId });
}

export async function reportScore(matchId: string, formData: FormData) {
  await transition("report_score", {
    p_match: matchId,
    p_score_a: Number(formData.get("score_a")),
    p_score_b: Number(formData.get("score_b")),
  });
}

export async function confirmScore(matchId: string) {
  await transition("confirm_score", { p_match: matchId });
}

export async function rejectScore(matchId: string) {
  await transition("reject_score", { p_match: matchId });
}

const LOGIN_ERRORS = { entrar: "/login?error=entrar", crear: "/login?primera=1&error=crear" };

export async function signIn(formData: FormData) {
  if (MOCK) redirect("/");
  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({
    email: String(formData.get("email")).trim().toLowerCase(),
    password: String(formData.get("password")),
  });
  redirect(error ? LOGIN_ERRORS.entrar : "/");
}

/** Primera vez: crea la cuenta. La base rechaza los correos que no están en la lista. */
export async function signUp(formData: FormData) {
  if (MOCK) redirect("/");
  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email: String(formData.get("email")).trim().toLowerCase(),
    password: String(formData.get("password")),
    options: { data: { name: String(formData.get("name")).trim() } },
  });
  // Sin sesión = el correo ya tenía cuenta o Supabase pide confirmar el correo.
  redirect(error || !data.session ? LOGIN_ERRORS.crear : "/");
}

export async function signOut() {
  if (MOCK) redirect("/login");
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}

/** Solo en modo demo: cambia de jugador para ver los dos lados de un partido. */
export async function switchMockUser(formData: FormData) {
  if (!MOCK) return;
  (await cookies()).set(MOCK_USER_COOKIE, String(formData.get("player")));
  revalidatePath("/", "layout");
}
