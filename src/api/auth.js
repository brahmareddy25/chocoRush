import { apiRequest } from "./client.js";

export function registerAccount(payload) {
  return apiRequest("/auth/register", { method: "POST", body: payload });
}

export function loginAccount(payload) {
  return apiRequest("/auth/login", { method: "POST", body: payload });
}

export function logoutAccount() {
  return apiRequest("/auth/logout", { method: "POST" });
}

export function getAuthSession() {
  return apiRequest("/auth/session");
}

export function getProfile() {
  return apiRequest("/auth/profile");
}

export function updateProfile(payload) {
  return apiRequest("/auth/profile", { method: "PUT", body: payload });
}
