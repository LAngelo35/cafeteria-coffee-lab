const assert = require("node:assert/strict");
const { after, before, test } = require("node:test");
const { once } = require("node:events");

process.env.NODE_ENV = "test";
process.env.USE_MEMORY_DB = "true";
process.env.DISABLE_RATE_LIMIT = "true";

const app = require("./App");

let server;
let baseUrl;

before(async () => {
  server = app.listen(0, "127.0.0.1");
  await once(server, "listening");
  baseUrl = `http://127.0.0.1:${server.address().port}`;
});

after(async () => {
  await new Promise((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  });
});

test("GET /api/health returns ok and database/ollama status", async () => {
  const response = await fetch(`${baseUrl}/api/health`);
  assert.equal(response.status, 200);
  const body = await response.json();
  assert.equal(body.success, true);
  assert.equal(body.data.status, "ok");
  assert.equal(body.data.database.mode, "memory");
});

test("CORS allows Angular dev origins and blocks unauthorized origins", async () => {
  const allowed = await fetch(`${baseUrl}/api/home`, {
    headers: { Origin: "http://localhost:4200" },
  });
  assert.equal(allowed.status, 200);
  assert.equal(
    allowed.headers.get("access-control-allow-origin"),
    "http://localhost:4200",
  );

  const preflight = await fetch(`${baseUrl}/api/contact`, {
    method: "OPTIONS",
    headers: {
      Origin: "http://127.0.0.1:4200",
      "Access-Control-Request-Method": "POST",
    },
  });
  assert.equal(preflight.status, 204);

  const blocked = await fetch(`${baseUrl}/api/home`, {
    headers: { Origin: "https://evil.example" },
  });
  assert.equal(blocked.status, 403);
  const blockedBody = await blocked.json();
  assert.equal(blockedBody.success, false);
  assert.equal(blockedBody.error.code, "CORS_FORBIDDEN");
});

test("GET /api/home returns hero video, business info, featured services and specialties", async () => {
  const response = await fetch(`${baseUrl}/api/home`);
  assert.equal(response.status, 200);
  const { success, data } = await response.json();
  assert.equal(success, true);
  assert.match(data.heroVideo.mediaUrl, /\/videos\/hero-cafe-loop\.mp4$/);
  assert.equal(data.business.brandName, "Origen & Crema Coffee Lab");
  assert.equal(data.featuredServices.length, 3);
  assert.equal(data.featuredSpecialties.length, 4);
});

test("Static hero video and poster are served from Node.js", async () => {
  const videoRes = await fetch(`${baseUrl}/videos/hero-cafe-loop.mp4`, {
    method: "HEAD",
  });
  assert.equal(videoRes.status, 200);
  const posterRes = await fetch(`${baseUrl}/images/hero-poster.jpg`, {
    method: "HEAD",
  });
  assert.equal(posterRes.status, 200);
});

test("GET /api/services, /api/specialties, /api/about, and /api/prices return dynamic data", async () => {
  const [servicesRes, specialtiesRes, aboutRes, pricesRes] = await Promise.all([
    fetch(`${baseUrl}/api/services`),
    fetch(`${baseUrl}/api/specialties?tag=vegano`),
    fetch(`${baseUrl}/api/about`),
    fetch(`${baseUrl}/api/prices?search=Geisha`),
  ]);

  assert.equal(servicesRes.status, 200);
  const servicesJson = await servicesRes.json();
  assert.ok(servicesJson.data.length >= 6);

  assert.equal(specialtiesRes.status, 200);
  const specialtiesJson = await specialtiesRes.json();
  assert.ok(specialtiesJson.data.items.length >= 4);
  assert.ok(
    specialtiesJson.data.items.every((p) => p.dietaryTags.includes("vegano")),
  );

  assert.equal(aboutRes.status, 200);
  const aboutJson = await aboutRes.json();
  assert.ok(aboutJson.data.milestones.length >= 5);
  assert.ok(aboutJson.data.gallery.length >= 6);

  assert.equal(pricesRes.status, 200);
  const pricesJson = await pricesRes.json();
  assert.equal(pricesJson.data.categories.length, 1);
  assert.match(pricesJson.data.categories[0].items[0].name, /Geisha/);
  assert.ok(pricesJson.data.combos.length >= 4);
});

test("POST /api/contact validates payloads and stores valid submissions", async () => {
  const invalid = await fetch(`${baseUrl}/api/contact`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ full_name: "A", email: "bad" }),
  });
  assert.equal(invalid.status, 400);

  const valid = await fetch(`${baseUrl}/api/contact`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      full_name: "Camila Mendoza",
      email: "camila@ejemplo.com",
      phone: "+591 70011223",
      inquiry_type: "reserva",
      subject: "Cata del sábado",
      message: "Quisiera reservar dos lugares para la cata sensorial de este sábado.",
    }),
  });
  assert.equal(valid.status, 201);
  const body = await valid.json();
  assert.equal(body.success, true);
  assert.equal(body.data.status, "nuevo");
});

test("POST /api/chatbot/message injects live coffee catalog context into Ollama and persists history", async () => {
  const originalFetch = global.fetch;
  let capturedOllamaBody;

  global.fetch = async (url, options) => {
    if (typeof url === "string" && url.includes("11434/api/chat")) {
      capturedOllamaBody = JSON.parse(options.body);
      return {
        ok: true,
        json: async () => ({
          model: "gemma3:4b",
          message: {
            role: "assistant",
            content:
              "Nuestro Flat White de la Casa Grande (12 oz) tiene un precio promocional de Bs 26 y contamos con opciones veganas como Oat Velvet Latte.",
          },
        }),
      };
    }
    return originalFetch(url, options);
  };

  try {
    const res = await fetch(`${baseUrl}/api/chatbot/message`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        sessionId: "test-session-001",
        message: "¿Cuánto cuesta el Flat White grande y tienen leche vegetal?",
      }),
    });
    assert.equal(res.status, 200);
    const json = await res.json();
    assert.equal(json.success, true);
    assert.equal(json.data.sessionId, "test-session-001");
    assert.match(json.data.reply, /Flat White/);
    assert.match(
      capturedOllamaBody.messages[0].content,
      /\[DATOS EN VIVO DE LA CAFETERÍA\]/,
    );
    assert.match(capturedOllamaBody.messages[0].content, /Flat White de la Casa/);

    const historyRes = await fetch(
      `${baseUrl}/api/chatbot/history/test-session-001`,
    );
    assert.equal(historyRes.status, 200);
    const historyJson = await historyRes.json();
    assert.equal(historyJson.data.messages.length, 2);
  } finally {
    global.fetch = originalFetch;
  }
});

test("POST /api/chatbot/message returns friendly 503 with fallbackReply when Ollama is offline", async () => {
  const originalFetch = global.fetch;
  global.fetch = async (url, options) => {
    if (typeof url === "string" && url.includes("11434/api/chat")) {
      throw new Error("connect ECONNREFUSED 127.0.0.1:11434");
    }
    return originalFetch(url, options);
  };

  try {
    const res = await fetch(`${baseUrl}/api/chatbot/message`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        sessionId: "test-session-offline",
        message: "¿Qué horarios tienen hoy?",
      }),
    });
    assert.equal(res.status, 503);
    const json = await res.json();
    assert.equal(json.success, false);
    assert.equal(json.error.code, "OLLAMA_UNAVAILABLE");
    assert.match(json.error.fallbackReply, /Av\. España 1420/);
  } finally {
    global.fetch = originalFetch;
  }
});
