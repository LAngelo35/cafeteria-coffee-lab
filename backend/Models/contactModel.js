const { pool, memoryStore, isDbConnected } = require("../config/database");

async function createMessage({
  fullName,
  email,
  phone,
  inquiryType,
  subject,
  message,
  ipAddress,
}) {
  if (await isDbConnected()) {
    const [result] = await pool.execute(
      `INSERT INTO contact_messages
        (full_name, email, phone, inquiry_type, subject, message, status, ip_address)
       VALUES (?, ?, ?, ?, ?, ?, 'nuevo', ?)`,
      [
        fullName,
        email,
        phone || null,
        inquiryType || "consulta_general",
        subject || null,
        message,
        ipAddress || null,
      ],
    );
    return {
      id: result.insertId,
      fullName,
      email,
      phone: phone || null,
      inquiryType: inquiryType || "consulta_general",
      subject: subject || null,
      message,
      status: "nuevo",
      createdAt: new Date().toISOString(),
    };
  }

  const created = {
    id: memoryStore.nextContactId++,
    fullName,
    email,
    phone: phone || null,
    inquiryType: inquiryType || "consulta_general",
    subject: subject || null,
    message,
    status: "nuevo",
    ipAddress: ipAddress || null,
    createdAt: new Date().toISOString(),
  };
  memoryStore.contactMessages.push(created);
  return created;
}

async function findAllMessages() {
  if (await isDbConnected()) {
    const [rows] = await pool.query(
      "SELECT id, full_name, email, phone, inquiry_type, subject, message, status, created_at FROM contact_messages ORDER BY created_at DESC LIMIT 100",
    );
    return rows.map((row) => ({
      id: row.id,
      fullName: row.full_name,
      email: row.email,
      phone: row.phone,
      inquiryType: row.inquiry_type,
      subject: row.subject,
      message: row.message,
      status: row.status,
      createdAt: row.created_at,
    }));
  }

  return [...memoryStore.contactMessages].reverse();
}

module.exports = { createMessage, findAllMessages };
