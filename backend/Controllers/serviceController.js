const { serviceModel } = require("../Models");
const { hydrateImageField } = require("./mediaHelper");

async function listServices(req, res) {
  const featuredOnly =
    req.query.featured === "1" || req.query.featured === "true";
  const services = await serviceModel.findAll({ featured: featuredOnly });

  res.json({
    success: true,
    data: services.map((service) => hydrateImageField(req, service)),
  });
}

module.exports = { listServices };
