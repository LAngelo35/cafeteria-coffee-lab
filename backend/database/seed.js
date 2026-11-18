const fs = require("node:fs/promises");
const path = require("node:path");
const mysql = require("mysql2/promise");
const seedData = require("./seed-data");

require("dotenv").config({
  path: path.resolve(__dirname, "../.env"),
});

async function seedDatabase() {
  const host = process.env.DB_HOST || "127.0.0.1";
  const port = Number(process.env.DB_PORT || 3306);
  const user = process.env.DB_USER || "root";
  const password = process.env.DB_PASSWORD || "";
  const dbName = process.env.DB_NAME || "cafeteria_db";

  const connection = await mysql.createConnection({
    host,
    port,
    user,
    password,
    multipleStatements: true,
  });

  try {
    const schemaPath = path.resolve(__dirname, "schema.sql");
    const schemaSql = await fs.readFile(schemaPath, "utf8");
    await connection.query(schemaSql);
    await connection.query(`USE \`${dbName}\``);
    await connection.beginTransaction();

    const b = seedData.businessInfo;
    await connection.execute(
      `INSERT INTO business_info
        (id, brand_name, slogan, short_about, full_history, address, city, phone, whatsapp, email, latitude, longitude, opening_hours, social_links)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
        brand_name = VALUES(brand_name),
        slogan = VALUES(slogan),
        short_about = VALUES(short_about),
        full_history = VALUES(full_history),
        address = VALUES(address),
        city = VALUES(city),
        phone = VALUES(phone),
        whatsapp = VALUES(whatsapp),
        email = VALUES(email),
        latitude = VALUES(latitude),
        longitude = VALUES(longitude),
        opening_hours = VALUES(opening_hours),
        social_links = VALUES(social_links)`,
      [
        b.id,
        b.brand_name,
        b.slogan,
        b.short_about,
        b.full_history,
        b.address,
        b.city,
        b.phone,
        b.whatsapp,
        b.email,
        b.latitude,
        b.longitude,
        JSON.stringify(b.opening_hours),
        JSON.stringify(b.social_links),
      ],
    );

    for (const m of seedData.mediaAssets) {
      await connection.execute(
        `INSERT INTO media_assets
          (id, asset_type, section_key, title, caption, media_url, poster_url, pexels_id, pexels_url, pexels_author, display_order, is_active)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE
          asset_type = VALUES(asset_type),
          section_key = VALUES(section_key),
          title = VALUES(title),
          caption = VALUES(caption),
          media_url = VALUES(media_url),
          poster_url = VALUES(poster_url),
          pexels_id = VALUES(pexels_id),
          pexels_url = VALUES(pexels_url),
          pexels_author = VALUES(pexels_author),
          display_order = VALUES(display_order),
          is_active = VALUES(is_active)`,
        [
          m.id,
          m.asset_type,
          m.section_key,
          m.title,
          m.caption,
          m.media_url,
          m.poster_url,
          m.pexels_id,
          m.pexels_url,
          m.pexels_author,
          m.display_order,
          m.is_active,
        ],
      );
    }

    for (const h of seedData.historyMilestones) {
      await connection.execute(
        `INSERT INTO history_milestones
          (id, milestone_year, title, description, image_url, display_order, is_active)
         VALUES (?, ?, ?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE
          milestone_year = VALUES(milestone_year),
          title = VALUES(title),
          description = VALUES(description),
          image_url = VALUES(image_url),
          display_order = VALUES(display_order),
          is_active = VALUES(is_active)`,
        [
          h.id,
          h.milestone_year,
          h.title,
          h.description,
          h.image_url,
          h.display_order,
          h.is_active,
        ],
      );
    }

    for (const s of seedData.services) {
      await connection.execute(
        `INSERT INTO services
          (id, slug, title, short_description, full_description, icon_name, image_url, availability_note, starting_price, requires_reservation, is_featured, display_order, is_active)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE
          slug = VALUES(slug),
          title = VALUES(title),
          short_description = VALUES(short_description),
          full_description = VALUES(full_description),
          icon_name = VALUES(icon_name),
          image_url = VALUES(image_url),
          availability_note = VALUES(availability_note),
          starting_price = VALUES(starting_price),
          requires_reservation = VALUES(requires_reservation),
          is_featured = VALUES(is_featured),
          display_order = VALUES(display_order),
          is_active = VALUES(is_active)`,
        [
          s.id,
          s.slug,
          s.title,
          s.short_description,
          s.full_description,
          s.icon_name,
          s.image_url,
          s.availability_note,
          s.starting_price,
          s.requires_reservation,
          s.is_featured,
          s.display_order,
          s.is_active,
        ],
      );
    }

    for (const c of seedData.categories) {
      await connection.execute(
        `INSERT INTO categories
          (id, name, slug, description, category_group, display_order, is_active)
         VALUES (?, ?, ?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE
          name = VALUES(name),
          slug = VALUES(slug),
          description = VALUES(description),
          category_group = VALUES(category_group),
          display_order = VALUES(display_order),
          is_active = VALUES(is_active)`,
        [
          c.id,
          c.name,
          c.slug,
          c.description,
          c.category_group,
          c.display_order,
          c.is_active,
        ],
      );
    }

    for (const p of seedData.products) {
      await connection.execute(
        `INSERT INTO products
          (id, category_id, name, slug, description, tasting_notes, origin, roast_level, brew_method, image_url, dietary_tags, is_specialty, is_featured, is_available, display_order)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE
          category_id = VALUES(category_id),
          name = VALUES(name),
          slug = VALUES(slug),
          description = VALUES(description),
          tasting_notes = VALUES(tasting_notes),
          origin = VALUES(origin),
          roast_level = VALUES(roast_level),
          brew_method = VALUES(brew_method),
          image_url = VALUES(image_url),
          dietary_tags = VALUES(dietary_tags),
          is_specialty = VALUES(is_specialty),
          is_featured = VALUES(is_featured),
          is_available = VALUES(is_available),
          display_order = VALUES(display_order)`,
        [
          p.id,
          p.category_id,
          p.name,
          p.slug,
          p.description,
          p.tasting_notes,
          p.origin,
          p.roast_level,
          p.brew_method,
          p.image_url,
          JSON.stringify(p.dietary_tags),
          p.is_specialty,
          p.is_featured,
          p.is_available,
          p.display_order,
        ],
      );
    }

    for (const v of seedData.productVariants) {
      await connection.execute(
        `INSERT INTO product_variants
          (id, product_id, variant_label, price, promo_price, currency, display_order, is_available)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE
          product_id = VALUES(product_id),
          variant_label = VALUES(variant_label),
          price = VALUES(price),
          promo_price = VALUES(promo_price),
          currency = VALUES(currency),
          display_order = VALUES(display_order),
          is_available = VALUES(is_available)`,
        [
          v.id,
          v.product_id,
          v.variant_label,
          v.price,
          v.promo_price,
          v.currency,
          v.display_order,
          v.is_available,
        ],
      );
    }

    for (const combo of seedData.combosPackages) {
      await connection.execute(
        `INSERT INTO combos_packages
          (id, name, badge, description, items_included, price, currency, display_order, is_active)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE
          name = VALUES(name),
          badge = VALUES(badge),
          description = VALUES(description),
          items_included = VALUES(items_included),
          price = VALUES(price),
          currency = VALUES(currency),
          display_order = VALUES(display_order),
          is_active = VALUES(is_active)`,
        [
          combo.id,
          combo.name,
          combo.badge,
          combo.description,
          JSON.stringify(combo.items_included),
          combo.price,
          combo.currency,
          combo.display_order,
          combo.is_active,
        ],
      );
    }

    await connection.commit();
    console.log("Base de datos cafeteria_db sembrada correctamente.");
  } catch (error) {
    try {
      await connection.rollback();
    } catch {
      // ignore rollback error
    }
    throw error;
  } finally {
    await connection.end();
  }
}

if (require.main === module) {
  seedDatabase().catch((error) => {
    console.error("Error al sembrar cafeteria_db:", error.message);
    process.exitCode = 1;
  });
}

module.exports = seedDatabase;
