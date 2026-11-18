CREATE DATABASE IF NOT EXISTS cafeteria_db
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE cafeteria_db;

-- 1. Informacion institucional de la cafeteria (Nosotros, Contactos, Footer, Chatbot)
CREATE TABLE IF NOT EXISTS business_info (
  id INT AUTO_INCREMENT PRIMARY KEY,
  brand_name VARCHAR(120) NOT NULL,
  slogan VARCHAR(200) NULL,
  short_about TEXT NOT NULL,
  full_history TEXT NOT NULL,
  address VARCHAR(255) NOT NULL,
  city VARCHAR(100) NOT NULL,
  phone VARCHAR(40) NOT NULL,
  whatsapp VARCHAR(40) NULL,
  email VARCHAR(120) NOT NULL,
  latitude DECIMAL(10, 7) NULL,
  longitude DECIMAL(10, 7) NULL,
  opening_hours JSON NOT NULL COMMENT 'Ej: {"lunes_viernes":"07:30 - 20:30","sabado":"08:30 - 21:00","domingo":"09:00 - 19:00"}',
  social_links JSON NULL COMMENT 'Ej: {"instagram":"https://...","tiktok":"https://..."}',
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- 2. Videos (Pexels) y fotos de la tienda (Inicio Hero + Nosotros Galeria)
CREATE TABLE IF NOT EXISTS media_assets (
  id INT AUTO_INCREMENT PRIMARY KEY,
  asset_type ENUM('video_hero', 'gallery_store', 'section_banner') NOT NULL,
  section_key ENUM('inicio', 'nosotros', 'servicios', 'especialidades', 'precios') NOT NULL,
  title VARCHAR(150) NOT NULL,
  caption VARCHAR(255) NULL,
  media_url VARCHAR(500) NOT NULL COMMENT 'URL MP4 servida por Node.js o CDN Pexels',
  poster_url VARCHAR(500) NULL COMMENT 'Imagen previa para carga rapida del video',
  pexels_id VARCHAR(60) NULL,
  pexels_url VARCHAR(500) NULL,
  pexels_author VARCHAR(120) NULL,
  display_order INT NOT NULL DEFAULT 0,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_media_section_active (section_key, asset_type, is_active, display_order)
);

-- 3. Hitos historicos (Nosotros)
CREATE TABLE IF NOT EXISTS history_milestones (
  id INT AUTO_INCREMENT PRIMARY KEY,
  milestone_year SMALLINT NOT NULL,
  title VARCHAR(150) NOT NULL,
  description TEXT NOT NULL,
  image_url VARCHAR(500) NULL,
  display_order INT NOT NULL DEFAULT 0,
  is_active TINYINT(1) NOT NULL DEFAULT 1
);

-- 4. Servicios ofrecidos por la cafeteria (Servicios + Inicio + Chatbot)
CREATE TABLE IF NOT EXISTS services (
  id INT AUTO_INCREMENT PRIMARY KEY,
  slug VARCHAR(100) NOT NULL UNIQUE,
  title VARCHAR(140) NOT NULL,
  short_description VARCHAR(255) NOT NULL,
  full_description TEXT NOT NULL,
  icon_name VARCHAR(80) NOT NULL COMMENT 'Nombre de icono para Angular (Lucide/Material)',
  image_url VARCHAR(500) NULL,
  availability_note VARCHAR(150) NULL COMMENT 'Ej: Lunes a Domingo / Previa reserva',
  starting_price DECIMAL(10, 2) NULL,
  requires_reservation TINYINT(1) NOT NULL DEFAULT 0,
  is_featured TINYINT(1) NOT NULL DEFAULT 0,
  display_order INT NOT NULL DEFAULT 0,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  INDEX idx_services_active (is_active, is_featured, display_order)
);

-- 5. Categorias de carta (Especialidades + Precios)
CREATE TABLE IF NOT EXISTS categories (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  slug VARCHAR(100) NOT NULL UNIQUE,
  description VARCHAR(255) NULL,
  category_group ENUM('bebidas_calientes', 'bebidas_frias', 'pasteleria', 'granos', 'salados') NOT NULL,
  display_order INT NOT NULL DEFAULT 0,
  is_active TINYINT(1) NOT NULL DEFAULT 1
);

-- 6. Productos y especialidades (Especialidades + Precios + Chatbot)
CREATE TABLE IF NOT EXISTS products (
  id INT AUTO_INCREMENT PRIMARY KEY,
  category_id INT NOT NULL,
  name VARCHAR(140) NOT NULL,
  slug VARCHAR(140) NOT NULL UNIQUE,
  description TEXT NOT NULL,
  tasting_notes VARCHAR(200) NULL COMMENT 'Ej: Chocolate amargo, avellana, frutos rojos',
  origin VARCHAR(120) NULL COMMENT 'Ej: Huila, Colombia - 1850 msnm',
  roast_level ENUM('ligero', 'medio', 'medio_oscuro', 'oscuro', 'no_aplica') NOT NULL DEFAULT 'no_aplica',
  brew_method VARCHAR(100) NULL COMMENT 'Ej: Espresso, V60, Cold Brew 18h',
  image_url VARCHAR(500) NULL,
  dietary_tags JSON NULL COMMENT 'Ej: ["vegano", "sin_lactosa"]',
  is_specialty TINYINT(1) NOT NULL DEFAULT 0,
  is_featured TINYINT(1) NOT NULL DEFAULT 0,
  is_available TINYINT(1) NOT NULL DEFAULT 1,
  display_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_products_category FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE RESTRICT,
  INDEX idx_products_filter (is_available, is_specialty, is_featured, category_id)
);

-- 7. Variantes de tamano/peso y precios (Precios + Especialidades + Chatbot)
CREATE TABLE IF NOT EXISTS product_variants (
  id INT AUTO_INCREMENT PRIMARY KEY,
  product_id INT NOT NULL,
  variant_label VARCHAR(80) NOT NULL COMMENT 'Ej: Chico 8oz, Grande 12oz, Bolsa 250g',
  price DECIMAL(10, 2) NOT NULL,
  promo_price DECIMAL(10, 2) NULL,
  currency CHAR(3) NOT NULL DEFAULT 'ARS' COMMENT 'Ajustar a moneda local (ARS, USD, MXN, etc.)',
  display_order INT NOT NULL DEFAULT 0,
  is_available TINYINT(1) NOT NULL DEFAULT 1,
  CONSTRAINT fk_variants_product FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
  INDEX idx_variants_product (product_id, is_available)
);

-- 8. Combos, promociones y paquetes (Precios + Chatbot)
CREATE TABLE IF NOT EXISTS combos_packages (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(140) NOT NULL,
  badge VARCHAR(60) NULL COMMENT 'Ej: Mas pedido, Fin de semana',
  description TEXT NOT NULL,
  items_included JSON NOT NULL COMMENT 'Ej: ["2 Flat White", "2 Croissants artesanales"]',
  price DECIMAL(10, 2) NOT NULL,
  currency CHAR(3) NOT NULL DEFAULT 'ARS',
  display_order INT NOT NULL DEFAULT 0,
  is_active TINYINT(1) NOT NULL DEFAULT 1
);

-- 9. Mensajes del formulario de contacto (Contactos)
CREATE TABLE IF NOT EXISTS contact_messages (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  full_name VARCHAR(120) NOT NULL,
  email VARCHAR(150) NOT NULL,
  phone VARCHAR(40) NULL,
  inquiry_type ENUM('consulta_general', 'reserva', 'catering_eventos', 'mayorista', 'sugerencia') NOT NULL DEFAULT 'consulta_general',
  subject VARCHAR(180) NULL,
  message TEXT NOT NULL,
  status ENUM('nuevo', 'leido', 'respondido') NOT NULL DEFAULT 'nuevo',
  ip_address VARCHAR(45) NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_contact_status_date (status, created_at)
);

-- 10. Sesiones del Chatbot (Ollama + Gemma 3)
CREATE TABLE IF NOT EXISTS chat_sessions (
  id VARCHAR(64) PRIMARY KEY COMMENT 'UUID generado por el backend o cliente',
  model_name VARCHAR(80) NOT NULL DEFAULT 'gemma3:4b',
  user_agent VARCHAR(255) NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_activity_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- 11. Historial de mensajes del Chatbot
CREATE TABLE IF NOT EXISTS chat_messages (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  session_id VARCHAR(64) NOT NULL,
  role ENUM('user', 'assistant') NOT NULL,
  content TEXT NOT NULL,
  latency_ms INT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_chat_session FOREIGN KEY (session_id) REFERENCES chat_sessions(id) ON DELETE CASCADE,
  INDEX idx_chat_session_time (session_id, created_at)
);
