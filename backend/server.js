import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import OpenAI from "openai";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.join(__dirname, "data");
const USERS_FILE = path.join(DATA_DIR, "users.json");
const ADMIN_SIGNUP_EMAIL = "deondrerutues@gmail.com";
const SESSION_TTL_MS = 1000 * 60 * 60 * 24 * 30;
const RESET_TTL_MS = 1000 * 60 * 30;

const app = express();

app.use(cors());
app.use(express.json());

const openai = process.env.OPENAI_API_KEY
  ? new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    })
  : null;

async function ensureDataFile() {
  await fs.mkdir(DATA_DIR, { recursive: true });
  try {
    await fs.access(USERS_FILE);
  } catch {
    await fs.writeFile(USERS_FILE, JSON.stringify({ users: [] }, null, 2));
  }
}

async function readUserStore() {
  await ensureDataFile();
  const raw = await fs.readFile(USERS_FILE, "utf8");
  const parsed = JSON.parse(raw);
  return Array.isArray(parsed.users) ? parsed : { users: [] };
}

async function writeUserStore(store) {
  await ensureDataFile();
  await fs.writeFile(USERS_FILE, JSON.stringify(store, null, 2));
}

function normalizeEmail(email) {
  return String(email ?? "").trim().toLowerCase();
}

function sanitizePhone(phone) {
  return String(phone ?? "").trim();
}

function hashToken(token) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

async function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString("hex");
  const derivedKey = await new Promise((resolve, reject) => {
    crypto.scrypt(password, salt, 64, (error, key) => {
      if (error) {
        reject(error);
        return;
      }
      resolve(key);
    });
  });

  return `${salt}:${Buffer.from(derivedKey).toString("hex")}`;
}

async function verifyPassword(password, storedHash) {
  const [salt, keyHex] = String(storedHash ?? "").split(":");
  if (!salt || !keyHex) {
    return false;
  }

  const derivedKey = await new Promise((resolve, reject) => {
    crypto.scrypt(password, salt, 64, (error, key) => {
      if (error) {
        reject(error);
        return;
      }
      resolve(key);
    });
  });

  const storedKey = Buffer.from(keyHex, "hex");
  const candidateKey = Buffer.from(derivedKey);

  if (storedKey.length !== candidateKey.length) {
    return false;
  }

  return crypto.timingSafeEqual(storedKey, candidateKey);
}

function buildUserResponse(user) {
  return {
    id: user.id,
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email,
    phone: user.phone,
    trackingConsent: user.trackingConsent,
    notificationPreference: user.notificationPreference,
    createdAt: user.createdAt,
  };
}

function createSession(user, rememberMe = true) {
  const rawToken = crypto.randomBytes(32).toString("hex");
  const now = Date.now();
  const sessionRecord = {
    tokenHash: hashToken(rawToken),
    rememberMe,
    createdAt: new Date(now).toISOString(),
    expiresAt: new Date(now + SESSION_TTL_MS).toISOString(),
  };

  user.sessions = (user.sessions ?? []).filter((session) => new Date(session.expiresAt).getTime() > now);
  user.sessions.push(sessionRecord);

  return rawToken;
}

async function findUserBySession(token) {
  const store = await readUserStore();
  const tokenHash = hashToken(token);
  const now = Date.now();

  for (const user of store.users) {
    user.sessions = (user.sessions ?? []).filter((session) => new Date(session.expiresAt).getTime() > now);
    const matchingSession = user.sessions.find((session) => session.tokenHash === tokenHash);
    if (matchingSession) {
      await writeUserStore(store);
      return { store, user };
    }
  }

  await writeUserStore(store);
  return null;
}

function getBearerToken(req) {
  const header = req.headers.authorization ?? "";
  return header.startsWith("Bearer ") ? header.slice(7) : null;
}

async function requireUser(req, res, next) {
  const token = getBearerToken(req);
  if (!token) {
    res.status(401).json({ success: false, message: "Missing auth token." });
    return;
  }

  const result = await findUserBySession(token);
  if (!result) {
    res.status(401).json({ success: false, message: "Session expired. Please log in again." });
    return;
  }

  req.store = result.store;
  req.user = result.user;
  req.authToken = token;
  next();
}

async function sendEmail({ to, subject, html }) {
  const resendApiKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM ?? "Rutues Center <onboarding@rutues-center.app>";

  if (!resendApiKey) {
    console.warn(`Email not sent to ${to}; RESEND_API_KEY is not configured.`);
    return { sent: false };
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${resendApiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to,
      subject,
      html,
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    console.error("Resend API error:", body);
    return { sent: false };
  }

  return { sent: true };
}

async function notifyAdminOfSignup(user) {
  return sendEmail({
    to: ADMIN_SIGNUP_EMAIL,
    subject: `New Rutues Center signup: ${user.firstName} ${user.lastName}`,
    html: `
      <h2>New Signup</h2>
      <p><strong>First name:</strong> ${user.firstName}</p>
      <p><strong>Last name:</strong> ${user.lastName}</p>
      <p><strong>Email:</strong> ${user.email}</p>
      <p><strong>Phone:</strong> ${user.phone}</p>
      <p><strong>Created at:</strong> ${user.createdAt}</p>
    `,
  });
}

async function sendPasswordResetEmail(email, resetToken) {
  const appUrl = process.env.APP_WEB_URL ?? "rutues-center://reset-password";
  const resetUrl = `${appUrl}?token=${resetToken}&email=${encodeURIComponent(email)}`;

  return sendEmail({
    to: email,
    subject: "Reset your Rutues Center password",
    html: `
      <h2>Password reset requested</h2>
      <p>If you requested a password reset, use the secure token below or open the reset link.</p>
      <p><strong>Reset token:</strong> ${resetToken}</p>
      <p><a href="${resetUrl}">Open reset flow</a></p>
      <p>This token expires in 30 minutes.</p>
    `,
  });
}

app.get("/health", (_req, res) => {
  res.json({ success: true });
});

app.post("/ai", async (req, res) => {
  try {
    if (!openai) {
      res.status(503).json({ success: false, error: "AI service is not configured on the server." });
      return;
    }

    const { message } = req.body;

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: "You are an AI planning assistant that breaks goals into structured tasks.",
        },
        {
          role: "user",
          content: message,
        },
      ],
    });

    res.json({
      success: true,
      reply: response.choices[0].message.content,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: "AI request failed" });
  }
});

app.post("/auth/signup", async (req, res) => {
  try {
    const firstName = String(req.body.firstName ?? "").trim();
    const lastName = String(req.body.lastName ?? "").trim();
    const email = normalizeEmail(req.body.email);
    const phone = sanitizePhone(req.body.phone);
    const password = String(req.body.password ?? "");

    if (!firstName || !lastName || !email || !phone || password.length < 8) {
      res.status(400).json({ success: false, message: "Please provide valid signup details." });
      return;
    }

    const store = await readUserStore();
    const existingUser = store.users.find((user) => user.email === email);
    if (existingUser) {
      res.status(409).json({ success: false, message: "An account with that email already exists." });
      return;
    }

    const nowIso = new Date().toISOString();
    const user = {
      id: crypto.randomUUID(),
      firstName,
      lastName,
      email,
      phone,
      passwordHash: await hashPassword(password),
      trackingConsent: null,
      notificationPreference: {
        prompted: false,
        appEnabled: false,
        systemStatus: "unknown",
      },
      resetRequests: [],
      sessions: [],
      createdAt: nowIso,
      updatedAt: nowIso,
    };

    const token = createSession(user, true);
    store.users.push(user);
    await writeUserStore(store);
    await notifyAdminOfSignup(user);

    res.status(201).json({ success: true, token, user: buildUserResponse(user) });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Unable to create account." });
  }
});

app.post("/auth/login", async (req, res) => {
  try {
    const email = normalizeEmail(req.body.email);
    const password = String(req.body.password ?? "");
    const rememberMe = Boolean(req.body.rememberMe);

    const store = await readUserStore();
    const user = store.users.find((candidate) => candidate.email === email);

    if (!user || !(await verifyPassword(password, user.passwordHash))) {
      res.status(401).json({ success: false, message: "Incorrect email or password." });
      return;
    }

    user.updatedAt = new Date().toISOString();
    const token = createSession(user, rememberMe);
    await writeUserStore(store);

    res.json({ success: true, token, user: buildUserResponse(user) });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Unable to sign in." });
  }
});

app.post("/auth/forgot-password", async (req, res) => {
  try {
    const email = normalizeEmail(req.body.email);
    const store = await readUserStore();
    const user = store.users.find((candidate) => candidate.email === email);

    if (user) {
      const rawResetToken = crypto.randomBytes(24).toString("hex");
      user.resetRequests = [
        {
          tokenHash: hashToken(rawResetToken),
          expiresAt: new Date(Date.now() + RESET_TTL_MS).toISOString(),
          createdAt: new Date().toISOString(),
        },
      ];
      user.updatedAt = new Date().toISOString();
      await writeUserStore(store);
      await sendPasswordResetEmail(email, rawResetToken);
    }

    res.json({
      success: true,
      message: "If an account exists for that email, reset instructions have been queued.",
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Unable to start password reset." });
  }
});

app.get("/auth/me", requireUser, async (req, res) => {
  res.json({ success: true, user: buildUserResponse(req.user) });
});

app.patch("/auth/profile", requireUser, async (req, res) => {
  const { user, store } = req;
  const nextEmail = normalizeEmail(req.body.email ?? user.email);

  const duplicate = store.users.find((candidate) => candidate.email === nextEmail && candidate.id !== user.id);
  if (duplicate) {
    res.status(409).json({ success: false, message: "That email is already in use by another account." });
    return;
  }

  user.firstName = String(req.body.firstName ?? user.firstName).trim();
  user.lastName = String(req.body.lastName ?? user.lastName).trim();
  user.email = nextEmail;
  user.phone = sanitizePhone(req.body.phone ?? user.phone);
  user.updatedAt = new Date().toISOString();

  await writeUserStore(store);
  res.json({ success: true, user: buildUserResponse(user) });
});

app.patch("/auth/preferences", requireUser, async (req, res) => {
  const { user, store } = req;

  if (typeof req.body.trackingConsent === "boolean") {
    user.trackingConsent = req.body.trackingConsent;
  }

  if (req.body.notificationPreference) {
    user.notificationPreference = {
      prompted: Boolean(req.body.notificationPreference.prompted),
      appEnabled: Boolean(req.body.notificationPreference.appEnabled),
      systemStatus: req.body.notificationPreference.systemStatus ?? "unknown",
    };
  }

  user.updatedAt = new Date().toISOString();
  await writeUserStore(store);

  res.json({ success: true, user: buildUserResponse(user) });
});

app.post("/auth/change-password", requireUser, async (req, res) => {
  try {
    const { user, store } = req;
    const currentPassword = String(req.body.currentPassword ?? "");
    const newPassword = String(req.body.newPassword ?? "");

    if (!(await verifyPassword(currentPassword, user.passwordHash))) {
      res.status(400).json({ success: false, message: "Current password is incorrect." });
      return;
    }

    if (newPassword.length < 8) {
      res.status(400).json({ success: false, message: "New password must be at least 8 characters." });
      return;
    }

    user.passwordHash = await hashPassword(newPassword);
    user.updatedAt = new Date().toISOString();
    await writeUserStore(store);

    res.json({ success: true, message: "Password updated successfully." });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Unable to update password." });
  }
});

app.listen(3000, () => {
  console.log("Rutues Center server running on port 3000");
});
