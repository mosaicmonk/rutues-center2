export type NotificationSystemStatus = "granted" | "denied" | "unsupported" | "unknown";

export interface UserProfile {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  trackingConsent: boolean | null;
  notificationPreference: {
    prompted: boolean;
    appEnabled: boolean;
    systemStatus: NotificationSystemStatus;
  };
  createdAt: string;
}

export interface AuthResponse {
  success: boolean;
  message?: string;
  token?: string;
  user?: UserProfile;
}

export interface SignupPayload {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  password: string;
}

export interface LoginPayload {
  email: string;
  password: string;
  rememberMe: boolean;
}

export interface UpdateProfilePayload {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
}

export interface UpdatePreferencesPayload {
  trackingConsent?: boolean;
  notificationPreference?: {
    prompted: boolean;
    appEnabled: boolean;
    systemStatus: NotificationSystemStatus;
  };
}
