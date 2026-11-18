const { catalogModel } = require("../Models");
const { hydrateImageField } = require("./mediaHelper");

async function listSpecialties(req, res) {
  const tag = typeof req.query.tag === "string" ? req.query.tag.trim() : undefined;
  const category =
    typeof req.query.category === "string"
      ? req.query.category.trim()
      : undefined;

  const [specialties, categories] = await Promise.all([
    catalogModel.getSpecialties({ tag, category }),
    catalogModel.getCategories(),
  ]);

  res.json({
    success: true,
    data: {
      categories,
      items: specialties.map((item) => hydrateImageField(req, item)),
    },
  });
}

module.exports = { listSpecialties };
