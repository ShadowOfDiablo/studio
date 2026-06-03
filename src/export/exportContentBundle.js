import JSZip from 'jszip'

// Exports content.json + /images/* — for the dev to drop into gradinko/public/.
// Image references in content.json are rewritten to relative paths like
// "/images/g_abc.jpg" so they work after the dev runs `npm run build`.

function extFromType(type) {
  if (!type) return 'bin'
  const m = type.match(/^image\/(\w+)$/)
  if (!m) return 'bin'
  return m[1] === 'jpeg' ? 'jpg' : m[1]
}

export async function exportContentBundle({ content, images }) {
  const zip = new JSZip()
  const imagesDir = zip.folder('images')

  // Map imageId → final path; write each image
  const pathById = new Map()
  for (const [id, { blob, type }] of images) {
    const filename = `${id}.${extFromType(type)}`
    pathById.set(id, `/images/${filename}`)
    imagesDir.file(filename, blob)
  }

  // Build a published version of content with imageId → image paths
  const published = JSON.parse(JSON.stringify(content))
  if (published.gallery?.items) {
    published.gallery.items = published.gallery.items.map(it => {
      const path = it.imageId ? pathById.get(it.imageId) : null
      const { imageId, ...rest } = it
      return path ? { ...rest, image: path } : rest
    })
  }
  if (Array.isArray(published.customSections)) {
    published.customSections = published.customSections.map(s => ({
      ...s,
      images: (s.images || [])
        .map(img => {
          const path = img.imageId ? pathById.get(img.imageId) : null
          return path ? { src: path, caption: img.caption } : null
        })
        .filter(Boolean)
    }))
  }

  zip.file('content.json', JSON.stringify(published, null, 2))
  zip.file('README.txt',
    'Gradinko content bundle\n' +
    '------------------------\n' +
    'Дайте този ZIP на разработчика. Той трябва да:\n' +
    '  1. Извлече файловете в gradinko/public/\n' +
    '     (content.json → gradinko/public/content.json)\n' +
    '     (images/* → gradinko/public/images/)\n' +
    '  2. Изпълни `npm run build` и пусне ново деплой.\n')

  return zip.generateAsync({ type: 'blob' })
}
