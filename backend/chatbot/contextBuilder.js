const { businessModel, serviceModel, catalogModel } = require("../Models");

function formatCurrency(amount, currency = "BOB") {
  const symbol = currency === "BOB" ? "Bs" : currency;
  return `${symbol} ${Number(amount).toFixed(0)}`;
}

async function buildLiveContext() {
  const [business, services, catalog] = await Promise.all([
    businessModel.getBusinessInfo(),
    serviceModel.findAll(),
    catalogModel.getPricesCatalog(),
  ]);

  const hoursLines = Object.entries(business.openingHours || {})
    .map(([day, hours]) => `  - ${day.replace("_", " a ")}: ${hours}`)
    .join("\n");

  const serviceLines = services
    .map(
      (s) =>
        `  - ${s.title}: ${s.shortDescription} | Disponibilidad: ${s.availabilityNote || "Consultar"} | Desde ${s.startingPrice !== null ? formatCurrency(s.startingPrice) : "A consultar"}${s.requiresReservation ? " (Requiere reserva)" : ""}`,
    )
    .join("\n");

  const productLines = catalog.categories
    .flatMap((cat) =>
      cat.items.map((p) => {
        const variantsText = p.variants
          .map((v) => {
            const effective = v.promoPrice ?? v.price;
            const promoTag = v.promoPrice ? ` (promo antes ${formatCurrency(v.price, v.currency)})` : "";
            return `${v.label}: ${formatCurrency(effective, v.currency)}${promoTag}`;
          })
          .join(" / ");
        const tags = p.dietaryTags?.length ? ` | Etiquetas: ${p.dietaryTags.join(", ")}` : "";
        const origin = p.origin ? ` | Origen: ${p.origin}` : "";
        const notes = p.tastingNotes ? ` | Notas: ${p.tastingNotes}` : "";
        return `  - [${cat.name}] ${p.name}${origin}${notes}${tags} | Precios -> ${variantsText}`;
      }),
    )
    .join("\n");

  const comboLines = catalog.combos
    .map(
      (c) =>
        `  - ${c.name} (${formatCurrency(c.price, c.currency)}): ${c.itemsIncluded.join(" + ")}`,
    )
    .join("\n");

  const block = [
    "[DATOS EN VIVO DE LA CAFETERÍA]",
    `Nombre: ${business.brandName}`,
    `Eslogan: ${business.slogan}`,
    `Dirección: ${business.address}, ${business.city}`,
    `Teléfono: ${business.phone} | WhatsApp: ${business.whatsapp || business.phone} | Email: ${business.email}`,
    "Horarios:",
    hoursLines,
    "Servicios:",
    serviceLines,
    "Carta y Precios:",
    productLines,
    "Combos y Paquetes:",
    comboLines,
    "[/DATOS EN VIVO DE LA CAFETERÍA]",
  ].join("\n");

  return {
    business,
    services,
    catalog,
    block,
  };
}

function buildLocalFallbackReply(message, snapshot) {
  const q = message.toLowerCase();
  const { business, services, catalog } = snapshot;
  const allProducts = catalog.categories.flatMap((c) => c.items);

  if (q.includes("horario") || q.includes("abierto") || q.includes("direccion") || q.includes("ubicacion") || q.includes("donde")) {
    const hours = business.openingHours || {};
    return `Nos encuentras en ${business.address}, ${business.city}. Atendemos lunes a viernes de ${hours.lunes_viernes}, sábados de ${hours.sabado} y domingos de ${hours.domingo}.`;
  }

  if (q.includes("vegan") || q.includes("lactosa") || q.includes("tacc") || q.includes("gluten")) {
    const veganItems = allProducts.filter((p) => p.dietaryTags.includes("vegano"));
    const list = veganItems
      .slice(0, 4)
      .map((p) => `${p.name} (desde ${formatCurrency(p.startingPrice, p.currency)})`)
      .join(", ");
    return `Sí, contamos con opciones vegetales y veganas en carta: ${list}. También ofrecemos leche de avena barista y almendras en toda nuestra barra espresso.`;
  }

  if (q.includes("servicio") || q.includes("coworking") || q.includes("cata") || q.includes("taller") || q.includes("evento")) {
    const summary = services
      .slice(0, 3)
      .map((s) => `${s.title} (${s.availabilityNote})`)
      .join("; ");
    return `En ${business.brandName} ofrecemos: ${summary}. Puedes consultarnos desde la sección Contactos o por WhatsApp al ${business.whatsapp}.`;
  }

  const matchedProduct = allProducts.find((p) =>
    q.includes(p.name.toLowerCase().split(" ")[0]) ||
    p.slug.split("-").some((part) => part.length > 3 && q.includes(part)),
  );
  if (matchedProduct) {
    const prices = matchedProduct.variants
      .map((v) => `${v.label}: ${formatCurrency(v.promoPrice ?? v.price, v.currency)}`)
      .join(" · ");
    return `${matchedProduct.name} (${matchedProduct.origin || matchedProduct.categoryName}) tiene notas de ${matchedProduct.tastingNotes}. Variantes disponibles: ${prices}.`;
  }

  if (q.includes("precio") || q.includes("cuanto") || q.includes("cuesta") || q.includes("carta") || q.includes("combo")) {
    const topCombos = catalog.combos
      .slice(0, 2)
      .map((c) => `${c.name} (${formatCurrency(c.price, c.currency)})`)
      .join(" y ");
    return `Nuestra barra espresso parte desde Bs 20 y filtrados V60 desde Bs 30. También destacan nuestros combos ${topCombos}. Revisa la pestaña Precios para ver todos los tamaños y gramajes.`;
  }

  const featured = allProducts.filter((p) => p.isFeatured).slice(0, 3);
  const picks = featured
    .map((p) => `${p.name} (${formatCurrency(p.startingPrice, p.currency)})`)
    .join(", ");
  return `¡Bienvenido a ${business.brandName}! Hoy te recomiendo explorar ${picks}. Si buscas un perfil frutal en V60, prueba nuestro Etiopía Guji Natural.`;
}

module.exports = {
  buildLiveContext,
  buildLocalFallbackReply,
};
