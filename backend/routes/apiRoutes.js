const express = require("express");
const { checkDatabaseHealth, getDatabaseMode } = require("../Models");
const { checkOllamaHealth } = require("../chatbot/ollamaClient");
const homeController = require("../Controllers/homeController");
const mediaController = require("../Controllers/mediaController");
const serviceController = require("../Controllers/serviceController");
const specialtyController = require("../Controllers/specialtyController");
const aboutController = require("../Controllers/aboutController");
const priceController = require("../Controllers/priceController");
const contactController = require("../Controllers/contactController");
const chatbotController = require("../Controllers/chatbotController");
const createRateLimiter = require("../Middleware/rateLimiter");
const {
  validateContactPayload,
  validateChatPayload,
} = require("../Middleware/validateRequest");

const router = express.Router();

const contactLimiter = createRateLimiter({
  windowMs: 60_000,
  maxRequests: 15,
  code: "CONTACT_RATE_LIMIT",
});

const chatbotLimiter = createRateLimiter({
  windowMs: 60_000,
  maxRequests: 25,
  code: "CHATBOT_RATE_LIMIT",
});

router.get("/health", async (req, res) => {
  const [db, ollama] = await Promise.all([
    checkDatabaseHealth(),
    checkOllamaHealth(),
  ]);
  res.status(200).json({
    success: true,
    data: {
      status: "ok",
      database: {
        connected: db.connected,
        mode: getDatabaseMode(),
      },
      ollama,
    },
  });
});

router.get("/home", homeController.getHome);
router.get("/media/hero", mediaController.getHeroMedia);
router.get("/services", serviceController.listServices);
router.get("/specialties", specialtyController.listSpecialties);
router.get("/about", aboutController.getAbout);
router.get("/prices", priceController.getPrices);
router.post(
  "/contact",
  contactLimiter,
  validateContactPayload,
  contactController.submitContact,
);
router.post(
  "/chatbot/message",
  chatbotLimiter,
  validateChatPayload,
  chatbotController.postMessage,
);
router.get("/chatbot/history/:sessionId", chatbotController.getHistory);

module.exports = router;
