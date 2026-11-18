# Origen & Crema · Coffee Lab

Aplicación Full-Stack para cafetería de especialidad y tostaduría, inspirada en el editorialismo técnico de **Onyx Coffee Lab** y construida con **Angular 22** + **Node.js / Express 5** + **MySQL 8** + **Ollama (`gemma3:4b`)**.

## Estructura del Proyecto

```text
app web c/
├── backend/                  # API REST Express 5 + MySQL + Módulo Barista IA
│   ├── App.js                # Entry point del servidor (puerto 3000)
│   ├── config/database.js    # Pool MySQL con respaldo automático en memoria
│   ├── database/             # schema.sql, seed-data.js y seed.js
│   ├── Models/               # Modelos de negocio, catálogo, contacto y chat
│   ├── Middleware/           # CORS, logger, rate limiter, validadores, errores
│   ├── Controllers/          # Controladores REST
│   ├── chatbot/              # Cliente Ollama (gemma3:4b) + RAG sobre MySQL
│   ├── routes/apiRoutes.js   # Rutas /api/*
│   └── public/               # Video loop Pexels y fotos de tienda/carta
└── frontend/                 # SPA Angular 22 Standalone + Signals + SCSS
    └── src/app/
        ├── core/             # Modelos, interceptor HTTP y servicios API
        ├── shared/           # Navbar, Footer, ChatbotWidget, RevealDirective
        └── features/         # Inicio, Servicios, Especialidades, Nosotros, Precios, Contactos
```

## Puesta en marcha rápida

### 1. Base de Datos MySQL (opcional si deseas persistencia en MySQL)
```bash
cd backend
npm run seed
```
*(Si MySQL no está iniciado localmente, el backend utiliza de forma automática y transparente el almacén en memoria inicializado con `database/seed-data.js`.)*

### 2. Ollama + Gemma 3 (opcional para IA local)
```bash
ollama pull gemma3:4b
ollama serve
```

### 3. Iniciar el BackEnd
```bash
cd backend
npm start
# Pruebas unitarias e integración:
npm test
```
Disponible en `http://127.0.0.1:3000`.

### 4. Iniciar el FrontEnd
```bash
cd frontend
npm start
```
Disponible en `http://127.0.0.1:4200`.
