function errorHandler(error, req, res, next) {
  if (res.headersSent) {
    return next(error);
  }

  if (error?.type === "entity.parse.failed") {
    return res.status(400).json({
      success: false,
      error: {
        code: "INVALID_JSON",
        message: "JSON malformado en el cuerpo de la petición",
      },
    });
  }

  if (error.code === "ER_DUP_ENTRY") {
    return res.status(409).json({
      success: false,
      error: {
        code: "DUPLICATE_ENTRY",
        message: "El registro ya existe",
      },
    });
  }

  const status = Number.isInteger(error.status) ? error.status : 500;
  if (status >= 500 && process.env.NODE_ENV !== "test") {
    console.error(error);
  }

  const payload = {
    success: false,
    error: {
      code:
        error.code ||
        (status >= 500 ? "INTERNAL_SERVER_ERROR" : "REQUEST_ERROR"),
      message:
        status === 500
          ? "Error interno del servidor"
          : error.message || "Error al procesar la solicitud",
    },
  };

  if (error.fallbackReply) {
    payload.error.fallbackReply = error.fallbackReply;
  }
  if (error.sessionId) {
    payload.error.sessionId = error.sessionId;
  }

  return res.status(status).json(payload);
}

module.exports = errorHandler;
