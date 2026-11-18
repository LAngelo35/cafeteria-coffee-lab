function getBaseUrl(req) {
  const configured = process.env.PUBLIC_BASE_URL;
  if (configured) {
    return configured.replace(/\/+$/, "");
  }
  const host = req.get("host") || `127.0.0.1:${process.env.PORT || 3000}`;
  return `${req.protocol}://${host}`;
}

function resolveAssetUrl(req, assetPath) {
  if (!assetPath) {
    return null;
  }
  if (/^https?:\/\//i.test(assetPath)) {
    return assetPath;
  }
  const normalized = assetPath.startsWith("/") ? assetPath : `/${assetPath}`;
  return `${getBaseUrl(req)}${normalized}`;
}

function hydrateMediaAsset(req, asset) {
  if (!asset) {
    return null;
  }
  return {
    ...asset,
    mediaUrl: resolveAssetUrl(req, asset.mediaUrl),
    posterUrl: resolveAssetUrl(req, asset.posterUrl),
  };
}

function hydrateImageField(req, item) {
  if (!item) {
    return item;
  }
  return {
    ...item,
    imageUrl: resolveAssetUrl(req, item.imageUrl),
  };
}

module.exports = {
  resolveAssetUrl,
  hydrateMediaAsset,
  hydrateImageField,
};
