const { pool, memoryStore, isDbConnected } = require("../config/database");

function mapService(row) {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    shortDescription: row.short_description,
    fullDescription: row.full_description,
    iconName: row.icon_name,
    imageUrl: row.image_url,
    availabilityNote: row.availability_note,
    startingPrice:
      row.starting_price !== null && row.starting_price !== undefined
        ? Number(row.starting_price)
        : null,
    requiresReservation: Boolean(row.requires_reservation),
    isFeatured: Boolean(row.is_featured),
    displayOrder: row.display_order,
  };
}

async function findAll({ featured } = {}) {
  if (await isDbConnected()) {
    let sql =
      "SELECT id, slug, title, short_description, full_description, icon_name, image_url, availability_note, starting_price, requires_reservation, is_featured, display_order FROM services WHERE is_active = 1";
    const params = [];
    if (featured) {
      sql += " AND is_featured = 1";
    }
    sql += " ORDER BY display_order, id";
    const [rows] = await pool.execute(sql, params);
    return rows.map(mapService);
  }

  return memoryStore.services
    .filter((item) => item.is_active === 1 && (!featured || item.is_featured === 1))
    .sort((a, b) => a.display_order - b.display_order || a.id - b.id)
    .map(mapService);
}

async function findBySlug(slug) {
  if (await isDbConnected()) {
    const [rows] = await pool.execute(
      "SELECT id, slug, title, short_description, full_description, icon_name, image_url, availability_note, starting_price, requires_reservation, is_featured, display_order FROM services WHERE is_active = 1 AND slug = ? LIMIT 1",
      [slug],
    );
    return rows[0] ? mapService(rows[0]) : null;
  }

  const found = memoryStore.services.find(
    (item) => item.is_active === 1 && item.slug === slug,
  );
  return found ? mapService(found) : null;
}

module.exports = { findAll, findBySlug };
