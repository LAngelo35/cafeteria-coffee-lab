const path = require("node:path");
const mysql = require("mysql2/promise");
const seedData = require("../database/seed-data");

require("dotenv").config({
  path: path.resolve(__dirname, "../.env"),
});

const pool = mysql.createPool({
  host: process.env.DB_HOST || "127.0.0.1",
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME || "cafeteria_db",
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  connectTimeout: 2500,
});

// Almacen en memoria sincronizado con seed-data.js para operacion resiliente si MySQL no esta iniciado
const memoryStore = {
  businessInfo: structuredClone(seedData.businessInfo),
  mediaAssets: structuredClone(seedData.mediaAssets),
  historyMilestones: structuredClone(seedData.historyMilestones),
  services: structuredClone(seedData.services),
  categories: structuredClone(seedData.categories),
  products: structuredClone(seedData.products),
  productVariants: structuredClone(seedData.productVariants),
  combosPackages: structuredClone(seedData.combosPackages),
  contactMessages: [],
  chatSessions: new Map(),
  chatMessages: [],
  nextContactId: 1,
  nextChatMessageId: 1,
};

let dbMode = process.env.USE_MEMORY_DB === "true" ? "memory" : "unknown";

async function checkConnection() {
  if (process.env.USE_MEMORY_DB === "true") {
    dbMode = "memory";
    return { connected: false, mode: "memory" };
  }

  try {
    await pool.query("SELECT 1");
    dbMode = "mysql";
    return { connected: true, mode: "mysql" };
  } catch (error) {
    dbMode = "memory";
    return { connected: false, mode: "memory", reason: error.message };
  }
}

async function isDbConnected() {
  if (process.env.USE_MEMORY_DB === "true") {
    return false;
  }
  if (dbMode === "mysql") {
    return true;
  }
  const status = await checkConnection();
  return status.connected;
}

function parseJsonColumn(value, fallback) {
  if (value === null || value === undefined) {
    return fallback;
  }
  if (typeof value === "string") {
    try {
      return JSON.parse(value);
    } catch {
      return fallback;
    }
  }
  return value;
}

module.exports = {
  pool,
  memoryStore,
  checkConnection,
  isDbConnected,
  parseJsonColumn,
  getMode: () => dbMode,
};
