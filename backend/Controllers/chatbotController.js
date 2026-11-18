const chatService = require("../chatbot/chatService");
const { httpError } = require("../Middleware/validateRequest");

async function postMessage(req, res) {
  const result = await chatService.processUserMessage({
    sessionId: req.validatedChat.sessionId,
    message: req.validatedChat.message,
    userAgent: req.get("user-agent") || null,
  });

  res.status(200).json({
    success: true,
    data: result,
  });
}

async function getHistory(req, res) {
  const { sessionId } = req.params;
  if (!sessionId || !/^[a-zA-Z0-9_-]{8,64}$/.test(sessionId)) {
    throw httpError(400, "INVALID_SESSION_ID", "El sessionId no es válido");
  }

  const history = await chatService.getHistory(sessionId);
  res.json({
    success: true,
    data: history,
  });
}

async function legacyOllamaPrompt(req, res) {
  const result = await chatService.processUserMessage({
    sessionId: req.validatedChat.sessionId,
    message: req.validatedChat.message,
    userAgent: req.get("user-agent") || null,
  });

  res.status(200).json({
    response: result.reply,
    sessionId: result.sessionId,
    model: result.model,
  });
}

module.exports = {
  postMessage,
  getHistory,
  legacyOllamaPrompt,
};
