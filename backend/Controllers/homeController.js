const { businessModel, serviceModel, catalogModel } = require("../Models");
const { hydrateMediaAsset, hydrateImageField } = require("./mediaHelper");

async function getHome(req, res) {
  const [heroVideo, business, featuredServices, featuredSpecialties] =
    await Promise.all([
      businessModel.getHeroVideo(),
      businessModel.getBusinessInfo(),
      serviceModel.findAll({ featured: true }),
      catalogModel.getSpecialties({ featuredOnly: true }),
    ]);

  res.json({
    success: true,
    data: {
      heroVideo: hydrateMediaAsset(req, heroVideo),
      business,
      featuredServices: featuredServices
        .slice(0, 3)
        .map((s) => hydrateImageField(req, s)),
      featuredSpecialties: featuredSpecialties
        .slice(0, 4)
        .map((p) => hydrateImageField(req, p)),
    },
  });
}

module.exports = { getHome };
