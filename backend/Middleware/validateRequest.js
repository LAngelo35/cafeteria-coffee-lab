const ALLOWED_INQUIRY_TYPES = new Set([
  "consulta_general",
  "reserva",
  "catering_eventos",
  "mayorista",
  "sugerencia",
]);

function httpError(status, code, message) {
  const error = new Error(message);
  error.status = status;
  error.code = code;
  return error;
}

function requireJsonObject(req, res, next) {
  if (!["POST", "PUT", "PATCH"].includes(req.method)) {
    return next();
  }

  if (!req.body || typeof req.body !== "object" || Array.isArray(req.body)) {
    return res.status(400).json({
      success: false,
      error: {
        code: "INVALID_JSON_BODY",
        message: "El cuerpo debe ser un objeto JSON",
      },
    });
  }

  return next();
}

function validateContactPayload(req, res, next) {
  const {
    full_name: fullName,
    email,
    phone,
    inquiry_type: inquiryType,
    subject,
    message,
  } = req.body;

  if (typeof fullName !== "string" || fullName.trim().length < 2 || fullName.trim().length > 120) {
    return next(
      httpError(400, "VALIDATION_ERROR", "El nombre completo es obligatorio (2 a 120 caracteres)."),
    );
  }

  if (
    typeof email !== "string" ||
    email.trim().length > 150 ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())
  ) {
    return next(
      httpError(400, "VALIDATION_ERROR", "Ingresa un correo electrónico válido."),
    );
  }

  if (phone !== undefined && phone !== null && (typeof phone !== "string" || phone.length > 40)) {
    return next(
      httpError(400, "VALIDATION_ERROR", "El teléfono no es válido."),
    );
  }

  const normalizedType = inquiryType || "consulta_general";
  if (!ALLOWED_INQUIRY_TYPES.has(normalizedType)) {
    return next(
      httpError(400, "VALIDATION_ERROR", "El tipo de consulta seleccionado no es válido."),
    );
  }

  if (subject !== undefined && subject !== null && (typeof subject !== "string" || subject.length > 180)) {
    return next(
      httpError(400, "VALIDATION_ERROR", "El asunto debe tener hasta 180 caracteres."),
    );
  }

  if (typeof message !== "string" || message.trim().length < 10 || message.trim().length > 3000) {
    return next(
      httpError(400, "VALIDATION_ERROR", "El mensaje debe tener entre 10 y 3000 caracteres."),
    );
  }

  req.validatedContact = {
    fullName: fullName.trim(),
    email: email.trim(),
    phone: typeof phone === "string" && phone.trim() ? phone.trim() : null,
    inquiryType: normalizedType,
    subject: typeof subject === "string" && subject.trim() ? subject.trim() : null,
    message: message.trim(),
  };

  return next();
}

function validateChatPayload(req, res, next) {
  const rawMessage = req.body.message ?? req.body.prompt;
  const sessionId = req.body.sessionId;

  if (
    typeof rawMessage !== "string" ||
    !rawMessage.trim() ||
    rawMessage.length > 4000
  ) {
    return next(
      httpError(
        400,
        "INVALID_CHAT_MESSAGE",
        "message debe ser un texto no vacío de hasta 4000 caracteres",
      ),
    );
  }

  if (
    sessionId !== undefined &&
    sessionId !== null &&
    (typeof sessionId !== "string" || !/^[a-zA-Z0-9_-]{8,64}$/.test(sessionId))
  ) {
    return next(
      httpError(400, "INVALID_SESSION_ID", "sessionId tiene un formato inválido"),
    );
  }

  req.validatedChat = {
    sessionId: sessionId || null,
    message: rawMessage.trim(),
  };

  return next();
}

module.exports = {
  httpError,
  requireJsonObject,
  validateContactPayload,
  validateChatPayload,
};
