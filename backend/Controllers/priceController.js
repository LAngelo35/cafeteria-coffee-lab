const { catalogModel } = require("../Models");
const { hydrateImageField } = require("./mediaHelper");

async function getPrices(req, res) {
  const category =
    typeof req.query.category === "string"
      ? req.query.category.trim()
      : undefined;
  const search =
    typeof req.query.search === "string" ? req.query.search.trim() : undefined;

  const catalog = await catalogModel.getPricesCatalog({ category, search });

  res.json({
    success: true,
    data: {
      categories: catalog.categories.map((cat) => ({
        ...cat,
        items: cat.items.map((item) => hydrateImageField(req, item)),
      })),
      combos: catalog.combos,
    },
  });
}

module.exports = { getPrices };
