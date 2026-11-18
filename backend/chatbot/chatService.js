const crypto = require("node:crypto");
const { chatModel } = require("../Models");
const { buildLiveContext, buildLocalFallbackReply } = require("./contextBuilder");
const { buildSystemPrompt } = require("./systemPrompt");
const { chatWithOllama, OLLAMA_MODEL } = require("./ollamaClient");

const MAX_HISTORY = Number(process.env.CHATBOT_MAX_HISTORY || 10);

async function processUserMessage({ sessionId, message, userAgent }) {
  const activeSessionId = sessionId || crypto.randomUUID();
  await chatModel.ensureSession(activeSessionId, OLLAMA_MODEL, userAgent);

  await chatModel.saveMessage({
    sessionId: activeSessionId,
    role: "user",
    content: message,
  });

  const [snapshot, historyRows] = await Promise.all([
    buildLiveContext(),
    chatModel.getSessionHistory(activeSessionId, MAX_HISTORY),
  ]);

  const systemContent = buildSystemPrompt(
    snapshot.business.brandName,
    snapshot.block,
  );

  // Evitamos duplicar el ultimo mensaje si ya viene en historyRows
  const historyMessages = historyRows.map((row) => ({
    role: row.role,
    content: row.content,
  }));
  if (
    historyMessages.length === 0 ||
    historyMessages[historyMessages.length - 1].content !== message ||
    historyMessages[historyMessages.length - 1].role !== "user"
  ) {
    historyMessages.push({ role: "user", content: message });
  }

  const messages = [
    { role: "system", content: systemContent },
    ...historyMessages,
  ];

  try {
    const result = await chatWithOllama({ messages });
    await chatModel.saveMessage({
      sessionId: activeSessionId,
      role: "assistant",
      content: result.reply,
      latencyMs: result.latencyMs,
    });

    return {
      sessionId: activeSessionId,
      model: result.model,
      reply: result.reply,
      latencyMs: result.latencyMs,
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    error.fallbackReply = buildLocalFallbackReply(message, snapshot);
    error.sessionId = activeSessionId;
    throw error;
  }
}

async function getHistory(sessionId) {
  const messages = await chatModel.getSessionHistory(sessionId, 40);
  return {
    sessionId,
    messages,
  };
}

module.exports = {
  processUserMessage,
  getHistory,
};
