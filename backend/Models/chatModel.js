const { pool, memoryStore, isDbConnected } = require("../config/database");

async function ensureSession(sessionId, modelName = "gemma3:4b", userAgent = null) {
  if (await isDbConnected()) {
    await pool.execute(
      `INSERT INTO chat_sessions (id, model_name, user_agent)
       VALUES (?, ?, ?)
       ON DUPLICATE KEY UPDATE
         model_name = VALUES(model_name),
         last_activity_at = CURRENT_TIMESTAMP`,
      [sessionId, modelName, userAgent ? String(userAgent).slice(0, 255) : null],
    );
    return { id: sessionId, modelName };
  }

  const existing = memoryStore.chatSessions.get(sessionId);
  if (existing) {
    existing.modelName = modelName;
    existing.lastActivityAt = new Date().toISOString();
    return existing;
  }

  const session = {
    id: sessionId,
    modelName,
    userAgent: userAgent ? String(userAgent).slice(0, 255) : null,
    createdAt: new Date().toISOString(),
    lastActivityAt: new Date().toISOString(),
  };
  memoryStore.chatSessions.set(sessionId, session);
  return session;
}

async function saveMessage({ sessionId, role, content, latencyMs = null }) {
  if (await isDbConnected()) {
    const [result] = await pool.execute(
      `INSERT INTO chat_messages (session_id, role, content, latency_ms)
       VALUES (?, ?, ?, ?)`,
      [sessionId, role, content, latencyMs],
    );
    return {
      id: result.insertId,
      sessionId,
      role,
      content,
      latencyMs,
      createdAt: new Date().toISOString(),
    };
  }

  const msg = {
    id: memoryStore.nextChatMessageId++,
    sessionId,
    role,
    content,
    latencyMs,
    createdAt: new Date().toISOString(),
  };
  memoryStore.chatMessages.push(msg);
  return msg;
}

async function getSessionHistory(sessionId, limit = 20) {
  const safeLimit = Math.max(1, Math.min(100, Number(limit) || 20));

  if (await isDbConnected()) {
    const [rows] = await pool.query(
      `SELECT id, session_id, role, content, latency_ms, created_at
       FROM (
         SELECT id, session_id, role, content, latency_ms, created_at
         FROM chat_messages
         WHERE session_id = ?
         ORDER BY id DESC
         LIMIT ?
       ) recent
       ORDER BY id ASC`,
      [sessionId, safeLimit],
    );
    return rows.map((row) => ({
      id: row.id,
      sessionId: row.session_id,
      role: row.role,
      content: row.content,
      latencyMs: row.latency_ms,
      createdAt: row.created_at,
    }));
  }

  return memoryStore.chatMessages
    .filter((m) => m.sessionId === sessionId)
    .slice(-safeLimit);
}

module.exports = {
  ensureSession,
  saveMessage,
  getSessionHistory,
};
