const { businessModel } = require("../Models");
const { hydrateMediaAsset, hydrateImageField } = require("./mediaHelper");

async function getAbout(req, res) {
  const [business, milestones, storeGallery] = await Promise.all([
    businessModel.getBusinessInfo(),
    businessModel.getHistoryMilestones(),
    businessModel.getMediaBySection("nosotros", "gallery_store"),
  ]);

  res.json({
    success: true,
    data: {
      business,
      milestones: milestones.map((m) => hydrateImageField(req, m)),
      gallery: storeGallery.map((g) => hydrateMediaAsset(req, g)),
    },
  });
}

module.exports = { getAbout };
