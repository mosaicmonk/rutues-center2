import React, { createContext, ReactNode, useContext, useEffect, useMemo, useState } from "react";
import { Alert, Linking, PermissionsAndroid, Platform } from "react-native";

import {
  changePassword as changePasswordRequest,
  forgotPassword as forgotPasswordRequest,
  getCurrentUser,
  login as loginRequest,
  signup as signupRequest,
  updatePreferences as updatePreferencesRequest,
  updateProfile as updateProfileRequest,
} from "./authApi";
import { clearStoredSessionToken, readStoredSessionToken, writeStoredSessionToken } from "./authStorage";
import { LoginPayload, NotificationSystemStatus, SignupPayload, UpdateProfilePayload, UserProfile } from "./types";

interface AuthContextValue {
  initialized: boolean;
  authBusy: boolean;
  user: UserProfile | null;
  sessionToken: string | null;
  rememberMe: boolean;
  isSignedIn: boolean;
  needsTrackingConsent: boolean;
  needsNotificationSetup: boolean;
  signup: (payload: SignupPayload) => Promise<void>;
  login: (payload: LoginPayload) => Promise<void>;
  logout: () => Promise<void>;
  requestPasswordReset: (email: string) => Promise<string>;
  saveTrackingConsent: (allowTracking: boolean) => Promise<void>;
  completeNotificationSetup: (allowNotifications: boolean) => Promise<NotificationSystemStatus>;
  refreshUser: () => Promise<void>;
  saveProfile: (payload: UpdateProfilePayload) => Promise<void>;
  saveNotificationPreference: (enabled: boolean) => Promise<void>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<string>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

async function requestNotificationPermission(): Promise<NotificationSystemStatus> {
  if (Platform.OS === "android") {
    if (Platform.Version < 33) {
      return "granted";
    }

    const result = await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS);
    return result === PermissionsAndroid.RESULTS.GRANTED ? "granted" : "denied";
  }

  Alert.alert(
    "Enable notifications",
    "To enable notifications on iPhone, the app will open Settings so you can turn them on.",
    [
      {
        text: "Open Settings",
        onPress: () => {
          void Linking.openSettings();
        },
      },
      { text: "Not now", style: "cancel" },
    ]
  );

  return "unsupported";
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [initialized, setInitialized] = useState(false);
  const [authBusy, setAuthBusy] = useState(false);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [sessionToken, setSessionToken] = useState<string | null>(null);
  const [rememberMe, setRememberMe] = useState(false);

  const applySession = async (token: string | null, persistent: boolean) => {
    setSessionToken(token);
    setRememberMe(persistent);

    if (token && persistent) {
      await writeStoredSessionToken(token);
      return;
    }

    await clearStoredSessionToken();
  };

  const refreshUser = async () => {
    if (!sessionToken) {
      setUser(null);
      return;
    }

    const response = await getCurrentUser(sessionToken);
    setUser(response.user ?? null);
  };

  useEffect(() => {
    const bootstrap = async () => {
      try {
        const storedToken = await readStoredSessionToken();
        if (!storedToken) {
          setInitialized(true);
          return;
        }

        const response = await getCurrentUser(storedToken);
        setSessionToken(storedToken);
        setRememberMe(true);
        setUser(response.user ?? null);
      } catch {
        await clearStoredSessionToken();
        setSessionToken(null);
        setUser(null);
      } finally {
        setInitialized(true);
      }
    };

    void bootstrap();
  }, []);

  const signup = async (payload: SignupPayload) => {
    setAuthBusy(true);
    try {
      const response = await signupRequest(payload);
      if (!response.token || !response.user) {
        throw new Error("Signup did not return a session.");
      }

      setUser(response.user);
      await applySession(response.token, true);
    } finally {
      setAuthBusy(false);
    }
  };

  const login = async (payload: LoginPayload) => {
    setAuthBusy(true);
    try {
      const response = await loginRequest(payload);
      if (!response.token || !response.user) {
        throw new Error("Login did not return a session.");
      }

      setUser(response.user);
      await applySession(response.token, payload.rememberMe);
    } finally {
      setAuthBusy(false);
    }
  };

  const logout = async () => {
    setUser(null);
    await applySession(null, false);
  };

  const requestPasswordReset = async (email: string) => {
    const response = await forgotPasswordRequest(email);
    return response.message;
  };

  const saveTrackingConsent = async (allowTracking: boolean) => {
    if (!sessionToken) {
      throw new Error("No active session.");
    }

    setAuthBusy(true);
    try {
      const response = await updatePreferencesRequest(sessionToken, {
        trackingConsent: allowTracking,
      });
      if (response.user) {
        setUser(response.user);
      }
    } finally {
      setAuthBusy(false);
    }
  };

  const completeNotificationSetup = async (allowNotifications: boolean) => {
    if (!sessionToken) {
      throw new Error("No active session.");
    }

    const systemStatus = allowNotifications ? await requestNotificationPermission() : "denied";

    setAuthBusy(true);
    try {
      const response = await updatePreferencesRequest(sessionToken, {
        notificationPreference: {
          prompted: true,
          appEnabled: allowNotifications && systemStatus === "granted",
          systemStatus,
        },
      });
      if (response.user) {
        setUser(response.user);
      }
    } finally {
      setAuthBusy(false);
    }

    return systemStatus;
  };

  const saveProfile = async (payload: UpdateProfilePayload) => {
    if (!sessionToken) {
      throw new Error("No active session.");
    }

    setAuthBusy(true);
    try {
      const response = await updateProfileRequest(sessionToken, payload);
      if (response.user) {
        setUser(response.user);
      }
    } finally {
      setAuthBusy(false);
    }
  };

  const saveNotificationPreference = async (enabled: boolean) => {
    if (!sessionToken || !user) {
      throw new Error("No active session.");
    }

    setAuthBusy(true);
    try {
      const response = await updatePreferencesRequest(sessionToken, {
        notificationPreference: {
          prompted: true,
          appEnabled: enabled,
          systemStatus: enabled ? user.notificationPreference.systemStatus || "unknown" : "denied",
        },
      });
      if (response.user) {
        setUser(response.user);
      }
    } finally {
      setAuthBusy(false);
    }
  };

  const changePassword = async (currentPassword: string, newPassword: string) => {
    if (!sessionToken) {
      throw new Error("No active session.");
    }

    const response = await changePasswordRequest(sessionToken, currentPassword, newPassword);
    return response.message;
  };

  const value = useMemo<AuthContextValue>(
    () => ({
      initialized,
      authBusy,
      user,
      sessionToken,
      rememberMe,
      isSignedIn: Boolean(user && sessionToken),
      needsTrackingConsent: Boolean(user && user.trackingConsent === null),
      needsNotificationSetup: Boolean(user && !user.notificationPreference.prompted),
      signup,
      login,
      logout,
      requestPasswordReset,
      saveTrackingConsent,
      completeNotificationSetup,
      refreshUser,
      saveProfile,
      saveNotificationPreference,
      changePassword,
    }),
    [authBusy, initialized, rememberMe, sessionToken, user]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider.");
  }

  return context;
}
