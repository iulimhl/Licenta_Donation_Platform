import { apiFetch } from "./api";

export async function getHomeStats() {
  return apiFetch("/home/stats");
}