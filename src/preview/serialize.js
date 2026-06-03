// Convert content (which references images by imageId) into a form the
// gradinko template can render — replacing imageId fields with real URLs
// (object URLs for live preview, relative paths for exported sites).

export function withImageURLs(content, resolveURL) {
  const out = JSON.parse(JSON.stringify(content))

  if (out.gallery && Array.isArray(out.gallery.items)) {
    out.gallery.items = out.gallery.items.map(it => {
      const url = it.imageId ? resolveURL(it.imageId) : null
      const { imageId, ...rest } = it
      return url ? { ...rest, image: url } : rest
    })
  }

  if (Array.isArray(out.customSections)) {
    out.customSections = out.customSections.map(s => ({
      ...s,
      images: (s.images || [])
        .map(img => {
          const url = img.imageId ? resolveURL(img.imageId) : null
          return url ? { src: url, caption: img.caption } : null
        })
        .filter(Boolean)
    }))
  }

  return out
}
