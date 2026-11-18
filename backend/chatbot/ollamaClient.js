const OLLAMA_BASE_URL = (
  process.env.OLLAMA_BASE_URL ||
  process.env.OLLAMA_URL ||
  "http://127.0.0.1:11434"
).replace(/\/+$/, "");

const OLLAMA_MODEL = process.env.OLLAMA_MODEL || "gemma3:4b";
const OLLAMA_TIMEOUT_MS = Number(process.env.OLLAMA_TIMEOUT_MS || 45000);
const CHATBOT_TEMPERATURE = Number(process.env.CHATBOT_TEMPERATURE || 0.4);

function createOllamaError(status, code, message) {
  const error = new Error(message);
  error.status = status;
  error.code = code;
  return error;
}

async function checkOllamaHealth() {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 2500);
  try {
    const response = await fetch(`${OLLAMA_BASE_URL}/api/tags`, {
      method: "GET",
      signal: controller.signal,
    });
    if (!response.ok) {
      return { available: false, model: OLLAMA_MODEL, statusCode: response.status };
    }
    const data = await response.json();
    const models = Array.isArray(data?.models) ? data.models.map((m) => m.name) : [];
    return {
      available: true,
      model: OLLAMA_MODEL,
      modelInstalled: models.some((name) => name.startsWith(OLLAMA_MODEL.split(":")[0])),
      models,
    };
  } catch {
    return { available: false, model: OLLAMA_MODEL };
  } finally {
    clearTimeout(timeout);
  }
}

async function chatWithOllama({ messages, model = OLLAMA_MODEL }) {
  const controller = new AbortController();
  let timedOut = false;
  const timeout = setTimeout(() => {
    timedOut = true;
    controller.abort();
  }, OLLAMA_TIMEOUT_MS);

  const startedAt = Date.now();
  try {
    const response = await fetch(`${OLLAMA_BASE_URL}/api/chat`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        model,
        messages,
        stream: false,
        options: {
          temperature: CHATBOT_TEMPERATURE,
        },
      }),
      signal: controller.signal,
    });

    if (!response.ok) {
      throw createOllamaError(
        503,
        "OLLAMA_BAD_RESPONSE",
        "El servicio local de IA (Ollama) no pudo procesar la consulta en este momento.",
      );
    }

    const data = await response.json();
    const content = data?.message?.content ?? data?.response;
    if (typeof content !== "string" || !content.trim()) {
      throw createOllamaError(
        502,
        "OLLAMA_INVALID_RESPONSE",
        "El servicio de IA devolvió una respuesta vacía.",
      );
    }

    return {
      reply: content.trim(),
      model: data.model || model,
      latencyMs: Date.now() - startedAt,
    };
  } catch (error) {
    if (error.status) {
      throw error;
    }
    if (timedOut) {
      throw createOllamaError(
        504,
        "OLLAMA_TIMEOUT",
        "El Barista IA tardó demasiado en responder. Intenta nuevamente.",
      );
    }
    throw createOllamaError(
      503,
      "OLLAMA_UNAVAILABLE",
      "El modelo local Gemma 3 en Ollama no está conectado en este momento.",
    );
  } finally {
    clearTimeout(timeout);
  }
}

module.exports = {
  OLLAMA_BASE_URL,
  OLLAMA_MODEL,
  checkOllamaHealth,
  chatWithOllama,
};
