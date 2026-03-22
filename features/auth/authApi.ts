import {
  AuthResponse,
  LoginPayload,
  SignupPayload,
  UpdatePreferencesPayload,
  UpdateProfilePayload,
} from "./types";
import { getApiBaseUrl } from "../../services/api";

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${getApiBaseUrl()}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
    ...init,
  });

  const data = (await response.json()) as T & { message?: string };

  if (!response.ok) {
    throw new Error((data as { message?: string }).message ?? "Request failed");
  }

  return data;
}

export async function signup(payload: SignupPayload) {
  return request<AuthResponse>("/auth/signup", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function login(payload: LoginPayload) {
  return request<AuthResponse>("/auth/login", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function forgotPassword(email: string) {
  return request<{ success: boolean; message: string }>("/auth/forgot-password", {
    method: "POST",
    body: JSON.stringify({ email }),
  });
}

export async function getCurrentUser(token: string) {
  return request<AuthResponse>("/auth/me", {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
}

export async function updateProfile(token: string, payload: UpdateProfilePayload) {
  return request<AuthResponse>("/auth/profile", {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });
}

export async function updatePreferences(token: string, payload: UpdatePreferencesPayload) {
  return request<AuthResponse>("/auth/preferences", {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });
}

export async function changePassword(token: string, currentPassword: string, newPassword: string) {
  return request<{ success: boolean; message: string }>("/auth/change-password", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ currentPassword, newPassword }),
  });
}
