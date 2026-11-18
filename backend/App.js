const path = require("node:path");
require("dotenv").config({
  path: path.resolve(__dirname, ".env"),
});

const express = require("express");
const corsMiddleware = require("./Middleware/corsMiddleware");
const requestLogger = require("./Middleware/requestLogger");
const {
  requireJsonObject,
  validateChatPayload,
} = require("./Middleware/validateRequest");
const errorHandler = require("./Middleware/errorHandler");
const apiRoutes = require("./routes/apiRoutes");
const chatbotController = require("./Controllers/chatbotController");
const { checkDatabaseHealth } = require("./Models");

const app = express();

app.disable("x-powered-by");
app.use(corsMiddleware);
app.use(requestLogger);
app.use(express.json({ limit: "1mb" }));
app.use(requireJsonObject);

// Recursos multimedia curados localmente (video hero Pexels y fotos de tienda/carta)
app.use(
  "/videos",
  express.static(path.resolve(__dirname, "public/videos"), { maxAge: "1d" }),
);
app.use(
  "/images",
  express.static(path.resolve(__dirname, "public/images"), { maxAge: "1d" }),
);

app.use("/api", apiRoutes);
app.post("/ollama-prompt", validateChatPayload, chatbotController.legacyOllamaPrompt);

app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: {
      code: "NOT_FOUND",
      message: "Ruta no encontrada",
    },
  });
});

app.use(errorHandler);

async function startServer() {
  const port = Number(process.env.PORT || 3000);
  const host = process.env.HOST || "127.0.0.1";
  const dbStatus = await checkDatabaseHealth();

  if (dbStatus.connected) {
    console.log("MySQL conectado correctamente.");
  } else {
    console.warn(
      `MySQL no disponible (${dbStatus.reason || "modo memoria"}); usando almacén semilla en memoria.`,
    );
  }

  return app.listen(port, host, () => {
    console.log(`API Cafetería disponible en http://${host}:${port}`);
  });
}

if (require.main === module) {
  startServer();
}

module.exports = app;
module.exports.startServer = startServer;
