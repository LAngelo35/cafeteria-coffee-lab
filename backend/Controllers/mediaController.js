const { businessModel } = require("../Models");
const { hydrateMediaAsset } = require("./mediaHelper");

async function fetchPexelsCoffeeHero(apiKey) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 5000);
  try {
    const response = await fetch(
      "https://api.pexels.com/videos/search?query=espresso+coffee+barista&orientation=landscape&size=medium&per_page=5",
      {
        headers: { Authorization: apiKey },
        signal: controller.signal,
      },
    );
    if (!response.ok) {
      return null;
    }
    const payload = await response.json();
    const video = Array.isArray(payload?.videos) ? payload.videos[0] : null;
    if (!video) {
      return null;
    }

    const files = Array.isArray(video.video_files) ? video.video_files : [];
    const hdFile =
      files.find((f) => f.file_type === "video/mp4" && f.width >= 1280) ||
      files.find((f) => f.file_type === "video/mp4");

    if (!hdFile) {
      return null;
    }

    return {
      title: "Extracción artesanal de espresso (Pexels Live)",
      caption: "Sincronizado desde Pexels Videos API",
      mediaUrl: hdFile.link,
      posterUrl: video.image || null,
      pexelsId: String(video.id),
      pexelsSourceUrl: video.url,
      pexelsAuthor: video.user?.name || "Pexels Creator",
    };
  } catch {
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

async function getHeroMedia(req, res) {
  const shouldRefresh = req.query.refresh === "true";
  const pexelsApiKey = process.env.PEXELS_API_KEY;

  if (shouldRefresh && pexelsApiKey) {
    const freshAsset = await fetchPexelsCoffeeHero(pexelsApiKey);
    if (freshAsset) {
      const saved = await businessModel.upsertHeroVideo(freshAsset);
      return res.json({
        success: true,
        data: hydrateMediaAsset(req, saved),
      });
    }
  }

  const heroVideo = await businessModel.getHeroVideo();
  return res.json({
    success: true,
    data: hydrateMediaAsset(req, heroVideo),
  });
}

module.exports = { getHeroMedia };
