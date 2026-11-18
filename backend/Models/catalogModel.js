const {
  pool,
  memoryStore,
  isDbConnected,
  parseJsonColumn,
} = require("../config/database");

function mapCategory(row) {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    description: row.description,
    categoryGroup: row.category_group,
    displayOrder: row.display_order,
  };
}

function mapVariant(row) {
  return {
    id: row.id,
    productId: row.product_id,
    label: row.variant_label,
    price: Number(row.price),
    promoPrice:
      row.promo_price !== null && row.promo_price !== undefined
        ? Number(row.promo_price)
        : null,
    currency: row.currency || "BOB",
    displayOrder: row.display_order,
  };
}

function mapProduct(row, categoryMap, variantsByProduct) {
  const category = categoryMap.get(row.category_id);
  const variants = variantsByProduct.get(row.id) || [];
  const effectivePrices = variants.map((v) => v.promoPrice ?? v.price);

  return {
    id: row.id,
    categoryId: row.category_id,
    categoryName: category ? category.name : "",
    categorySlug: category ? category.slug : "",
    categoryGroup: category ? category.categoryGroup : "",
    name: row.name,
    slug: row.slug,
    description: row.description,
    tastingNotes: row.tasting_notes,
    origin: row.origin,
    roastLevel: row.roast_level,
    brewMethod: row.brew_method,
    imageUrl: row.image_url,
    dietaryTags: parseJsonColumn(row.dietary_tags, []),
    isSpecialty: Boolean(row.is_specialty),
    isFeatured: Boolean(row.is_featured),
    displayOrder: row.display_order,
    startingPrice: effectivePrices.length > 0 ? Math.min(...effectivePrices) : null,
    currency: variants[0]?.currency || "BOB",
    variants,
  };
}

function mapCombo(row) {
  return {
    id: row.id,
    name: row.name,
    badge: row.badge,
    description: row.description,
    itemsIncluded: parseJsonColumn(row.items_included, []),
    price: Number(row.price),
    currency: row.currency || "BOB",
    displayOrder: row.display_order,
  };
}

async function loadRawCatalog() {
  if (await isDbConnected()) {
    const [categories] = await pool.query(
      "SELECT id, name, slug, description, category_group, display_order FROM categories WHERE is_active = 1 ORDER BY display_order, id",
    );
    const [products] = await pool.query(
      "SELECT id, category_id, name, slug, description, tasting_notes, origin, roast_level, brew_method, image_url, dietary_tags, is_specialty, is_featured, display_order FROM products WHERE is_available = 1 ORDER BY display_order, id",
    );
    const [variants] = await pool.query(
      "SELECT id, product_id, variant_label, price, promo_price, currency, display_order FROM product_variants WHERE is_available = 1 ORDER BY display_order, id",
    );
    return {
      categories: categories.map(mapCategory),
      products,
      variants: variants.map(mapVariant),
    };
  }

  return {
    categories: memoryStore.categories
      .filter((c) => c.is_active === 1)
      .sort((a, b) => a.display_order - b.display_order || a.id - b.id)
      .map(mapCategory),
    products: memoryStore.products
      .filter((p) => p.is_available === 1)
      .sort((a, b) => a.display_order - b.display_order || a.id - b.id),
    variants: memoryStore.productVariants
      .filter((v) => v.is_available === 1)
      .sort((a, b) => a.display_order - b.display_order || a.id - b.id)
      .map(mapVariant),
  };
}

async function getCategories() {
  const { categories } = await loadRawCatalog();
  return categories;
}

async function getAllProducts() {
  const { categories, products, variants } = await loadRawCatalog();
  const categoryMap = new Map(categories.map((c) => [c.id, c]));
  const variantsByProduct = new Map();

  for (const variant of variants) {
    if (!variantsByProduct.has(variant.productId)) {
      variantsByProduct.set(variant.productId, []);
    }
    variantsByProduct.get(variant.productId).push(variant);
  }

  return products.map((p) => mapProduct(p, categoryMap, variantsByProduct));
}

async function getSpecialties({ tag, category, featuredOnly } = {}) {
  const all = await getAllProducts();
  return all.filter((item) => {
    if (!item.isSpecialty) {
      return false;
    }
    if (featuredOnly && !item.isFeatured) {
      return false;
    }
    if (category && item.categorySlug !== category) {
      return false;
    }
    if (tag && !item.dietaryTags.includes(tag)) {
      return false;
    }
    return true;
  });
}

async function getCombos() {
  if (await isDbConnected()) {
    const [rows] = await pool.query(
      "SELECT id, name, badge, description, items_included, price, currency, display_order FROM combos_packages WHERE is_active = 1 ORDER BY display_order, id",
    );
    return rows.map(mapCombo);
  }

  return memoryStore.combosPackages
    .filter((c) => c.is_active === 1)
    .sort((a, b) => a.display_order - b.display_order || a.id - b.id)
    .map(mapCombo);
}

async function getPricesCatalog({ category, search } = {}) {
  const [categories, allProducts, combos] = await Promise.all([
    getCategories(),
    getAllProducts(),
    getCombos(),
  ]);

  const normalizedSearch = typeof search === "string" ? search.trim().toLowerCase() : "";

  const grouped = categories
    .filter((cat) => !category || cat.slug === category)
    .map((cat) => {
      const items = allProducts.filter((product) => {
        if (product.categoryId !== cat.id) {
          return false;
        }
        if (!normalizedSearch) {
          return true;
        }
        const haystack = [
          product.name,
          product.description,
          product.tastingNotes || "",
          product.origin || "",
          product.brewMethod || "",
        ]
          .join(" ")
          .toLowerCase();
        return haystack.includes(normalizedSearch);
      });
      return {
        ...cat,
        items,
      };
    })
    .filter((cat) => cat.items.length > 0 || (!normalizedSearch && !category));

  return {
    categories: grouped,
    combos,
  };
}

module.exports = {
  getCategories,
  getAllProducts,
  getSpecialties,
  getPricesCatalog,
  getCombos,
};
