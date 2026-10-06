// Adding, changing and deleting accounts goes through the WalkSafe server,
// which holds the Supabase secret key.
import { api, serverBase } from "./server-api";
import type { Role } from "./supabase";

export interface NewAccount {
  email: string;
  password: string;
  display_name: string;
  role: Role;
}

export type AccountChange = { password: string } | { active: boolean };

export async function createAccount(account: NewAccount) {
  await api(await serverBase(), "/api/admin/users", { json: account });
}

export async function changeAccount(userId: string, change: AccountChange) {
  await api(await serverBase(), `/api/admin/users/${userId}`, { method: "PATCH", json: change });
}

export async function deleteAccount(userId: string) {
  await api(await serverBase(), `/api/admin/users/${userId}`, { method: "DELETE" });
}
