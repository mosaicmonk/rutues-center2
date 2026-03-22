import OpenAI from "openai";

const DEFAULT_OPENAI_MODEL = process.env.OPENAI_MODEL || "gpt-4o-mini";
const DEFAULT_OLLAMA_MODEL = process.env.OLLAMA_MODEL || "llama3.2:3b";
const OLLAMA_BASE_URL = (process.env.OLLAMA_BASE_URL || "http://127.0.0.1:11434").replace(/\/$/, "");
const PROVIDER_PREFERENCE = (process.env.AI_PROVIDER || "auto").toLowerCase();
const REQUEST_TIMEOUT_MS = Number(process.env.AI_TIMEOUT_MS || 12000);

const openai = process.env.OPENAI_API_KEY
  ? new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    })
  : null;

const plannerSystemPrompt = `You are a planning assistant. Keep responses grounded only in what the user explicitly said. Never invent extra facts. Prefer concise titles and a clean action list.`;

const withTimeout = async (input, init = {}) => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    return await fetch(input, {
      ...init,
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timeoutId);
  }
};

const isOllamaReachable = async () => {
  try {
    const response = await withTimeout(`${OLLAMA_BASE_URL}/api/tags`);
    return response.ok;
  } catch {
    return false;
  }
};

const getProviderStatus = async () => {
  const ollamaAvailable = await isOllamaReachable();
  const openaiAvailable = Boolean(openai);

  return {
    preferred: PROVIDER_PREFERENCE,
    ollama: {
      available: ollamaAvailable,
      baseUrl: OLLAMA_BASE_URL,
      model: DEFAULT_OLLAMA_MODEL,
    },
    openai: {
      available: openaiAvailable,
      model: DEFAULT_OPENAI_MODEL,
    },
  };
};

const resolveProvider = async () => {
  const status = await getProviderStatus();

  if (PROVIDER_PREFERENCE === "ollama") {
    if (!status.ollama.available) {
      throw new Error("AI provider is set to Ollama, but the local Ollama API is not reachable.");
    }

    return { provider: "ollama", model: status.ollama.model };
  }

  if (PROVIDER_PREFERENCE === "openai") {
    if (!status.openai.available) {
      throw new Error("AI provider is set to OpenAI, but OPENAI_API_KEY is missing.");
    }

    return { provider: "openai", model: status.openai.model };
  }

  if (status.ollama.available) {
    return { provider: "ollama", model: status.ollama.model };
  }

  if (status.openai.available) {
    return { provider: "openai", model: status.openai.model };
  }

  throw new Error("No AI provider is configured. Start Ollama locally or set OPENAI_API_KEY.");
};

const callOllama = async (message) => {
  const response = await withTimeout(`${OLLAMA_BASE_URL}/api/generate`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: DEFAULT_OLLAMA_MODEL,
      prompt: `${plannerSystemPrompt}\n\nUser request:\n${message}`,
      stream: false,
    }),
  });

  if (!response.ok) {
    throw new Error(`Ollama request failed with status ${response.status}.`);
  }

  const data = await response.json();
  return {
    provider: "ollama",
    model: DEFAULT_OLLAMA_MODEL,
    reply: data.response,
  };
};

const callOpenAI = async (message) => {
  if (!openai) {
    throw new Error("OpenAI API key is not configured.");
  }

  const response = await openai.chat.completions.create({
    model: DEFAULT_OPENAI_MODEL,
    messages: [
      {
        role: "system",
        content: plannerSystemPrompt,
      },
      {
        role: "user",
        content: message,
      },
    ],
  });

  return {
    provider: "openai",
    model: DEFAULT_OPENAI_MODEL,
    reply: response.choices[0]?.message?.content || "",
  };
};

export const askPlanningAI = async (message) => {
  const selection = await resolveProvider();
  if (selection.provider === "ollama") {
    return callOllama(message);
  }

  return callOpenAI(message);
};

export { getProviderStatus };
