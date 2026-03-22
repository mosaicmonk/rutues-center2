import * as FileSystem from "expo-file-system/legacy";

const SESSION_FILE = `${FileSystem.documentDirectory ?? ""}auth-session.json`;

interface StoredSession {
  token: string;
}

export async function readStoredSessionToken() {
  if (!FileSystem.documentDirectory) {
    return null;
  }

  const fileInfo = await FileSystem.getInfoAsync(SESSION_FILE);
  if (!fileInfo.exists) {
    return null;
  }

  try {
    const raw = await FileSystem.readAsStringAsync(SESSION_FILE);
    const parsed = JSON.parse(raw) as StoredSession;
    return parsed.token ?? null;
  } catch {
    return null;
  }
}

export async function writeStoredSessionToken(token: string) {
  if (!FileSystem.documentDirectory) {
    return;
  }

  await FileSystem.writeAsStringAsync(SESSION_FILE, JSON.stringify({ token }));
}

export async function clearStoredSessionToken() {
  if (!FileSystem.documentDirectory) {
    return;
  }

  const fileInfo = await FileSystem.getInfoAsync(SESSION_FILE);
  if (fileInfo.exists) {
    await FileSystem.deleteAsync(SESSION_FILE, { idempotent: true });
  }
}
