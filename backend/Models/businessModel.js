const {
  pool,
  memoryStore,
  isDbConnected,
  parseJsonColumn,
} = require("../config/database");

function mapBusinessInfo(row) {
  if (!row) {
    return null;
  }

  return {
    id: row.id,
    brandName: row.brand_name,
    slogan: row.slogan,
    shortAbout: row.short_about,
    fullHistory: row.full_history,
    address: row.address,
    city: row.city,
    phone: row.phone,
    whatsapp: row.whatsapp,
    email: row.email,
    latitude: row.latitude !== null ? Number(row.latitude) : null,
    longitude: row.longitude !== null ? Number(row.longitude) : null,
    openingHours: parseJsonColumn(row.opening_hours, {}),
    socialLinks: parseJsonColumn(row.social_links, {}),
  };
}

function mapMediaAsset(row) {
  return {
    id: row.id,
    assetType: row.asset_type,
    sectionKey: row.section_key,
    title: row.title,
    caption: row.caption,
    mediaUrl: row.media_url,
    posterUrl: row.poster_url,
    pexelsId: row.pexels_id,
    pexelsSourceUrl: row.pexels_url,
    pexelsAuthor: row.pexels_author,
    displayOrder: row.display_order,
  };
}

function mapMilestone(row) {
  return {
    id: row.id,
    year: row.milestone_year,
    title: row.title,
    description: row.description,
    imageUrl: row.image_url,
    displayOrder: row.display_order,
  };
}

async function getBusinessInfo() {
  if (await isDbConnected()) {
    const [rows] = await pool.query(
      "SELECT id, brand_name, slogan, short_about, full_history, address, city, phone, whatsapp, email, latitude, longitude, opening_hours, social_links FROM business_info ORDER BY id LIMIT 1",
    );
    return mapBusinessInfo(rows[0] || memoryStore.businessInfo);
  }
  return mapBusinessInfo(memoryStore.businessInfo);
}

async function getMediaBySection(sectionKey, assetType) {
  if (await isDbConnected()) {
    let sql =
      "SELECT id, asset_type, section_key, title, caption, media_url, poster_url, pexels_id, pexels_url, pexels_author, display_order FROM media_assets WHERE is_active = 1 AND section_key = ?";
    const params = [sectionKey];
    if (assetType) {
      sql += " AND asset_type = ?";
      params.push(assetType);
    }
    sql += " ORDER BY display_order, id";
    const [rows] = await pool.execute(sql, params);
    return rows.map(mapMediaAsset);
  }

  return memoryStore.mediaAssets
    .filter(
      (item) =>
        item.is_active === 1 &&
        item.section_key === sectionKey &&
        (!assetType || item.asset_type === assetType),
    )
    .sort((a, b) => a.display_order - b.display_order || a.id - b.id)
    .map(mapMediaAsset);
}

async function getHeroVideo() {
  const videos = await getMediaBySection("inicio", "video_hero");
  return videos[0] || null;
}

async function upsertHeroVideo(videoAsset) {
  if (await isDbConnected()) {
    await pool.execute(
      "UPDATE media_assets SET is_active = 0 WHERE section_key = 'inicio' AND asset_type = 'video_hero'",
    );
    const [result] = await pool.execute(
      `INSERT INTO media_assets
        (asset_type, section_key, title, caption, media_url, poster_url, pexels_id, pexels_url, pexels_author, display_order, is_active)
       VALUES ('video_hero', 'inicio', ?, ?, ?, ?, ?, ?, ?, 1, 1)`,
      [
        videoAsset.title,
        videoAsset.caption || null,
        videoAsset.mediaUrl,
        videoAsset.posterUrl || null,
        videoAsset.pexelsId || null,
        videoAsset.pexelsSourceUrl || null,
        videoAsset.pexelsAuthor || null,
      ],
    );
    return { ...videoAsset, id: result.insertId };
  }

  memoryStore.mediaAssets.forEach((item) => {
    if (item.section_key === "inicio" && item.asset_type === "video_hero") {
      item.is_active = 0;
    }
  });
  const created = {
    id: memoryStore.mediaAssets.length + 1,
    asset_type: "video_hero",
    section_key: "inicio",
    title: videoAsset.title,
    caption: videoAsset.caption || null,
    media_url: videoAsset.mediaUrl,
    poster_url: videoAsset.posterUrl || null,
    pexels_id: videoAsset.pexelsId || null,
    pexels_url: videoAsset.pexelsSourceUrl || null,
    pexels_author: videoAsset.pexelsAuthor || null,
    display_order: 1,
    is_active: 1,
  };
  memoryStore.mediaAssets.unshift(created);
  return mapMediaAsset(created);
}

async function getHistoryMilestones() {
  if (await isDbConnected()) {
    const [rows] = await pool.query(
      "SELECT id, milestone_year, title, description, image_url, display_order FROM history_milestones WHERE is_active = 1 ORDER BY display_order, milestone_year",
    );
    return rows.map(mapMilestone);
  }

  return memoryStore.historyMilestones
    .filter((item) => item.is_active === 1)
    .sort((a, b) => a.display_order - b.display_order || a.milestone_year - b.milestone_year)
    .map(mapMilestone);
}

module.exports = {
  getBusinessInfo,
  getMediaBySection,
  getHeroVideo,
  upsertHeroVideo,
  getHistoryMilestones,
};
