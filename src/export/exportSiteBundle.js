import JSZip from 'jszip'

// Builds a full deployable static site ZIP:
//   - copies every file from /template/ (the gradinko build)
//   - injects content.json at the root
//   - drops user-uploaded images into /images/
// User can unzip and deploy directly to Vercel / Netlify / any static host.

function extFromType(type) {
  if (!type) return 'bin'
  const m = type.match(/^image\/(\w+)$/)
  if (!m) return 'bin'
  return m[1] === 'jpeg' ? 'jpg' : m[1]
}

// Hardcoded list of files in the template. Generated at template-prep time
// would be more robust; for v1, we fetch a manifest the prepare-template
// script writes alongside the template.
async function listTemplateFiles() {
  const res = await fetch('./template/manifest.json', { cache: 'no-store' })
  if (!res.ok) throw new Error('Template manifest not found. Run `npm run prepare-template`.')
  return res.json()
}

export async function exportSiteBundle({ content, images }) {
  const zip = new JSZip()

  // 1. Copy template files
  const files = await listTemplateFiles()
  for (const path of files) {
    const r = await fetch(`./template/${path}`)
    if (!r.ok) continue
    const blob = await r.blob()
    zip.file(path, blob)
  }

  // 2. Write images
  const pathById = new Map()
  for (const [id, { blob, type }] of images) {
    const filename = `${id}.${extFromType(type)}`
    pathById.set(id, `/images/${filename}`)
    zip.file(`images/${filename}`, blob)
  }

  // 3. Build published content.json
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
    'Gradinko — пълен сайт\n' +
    '----------------------\n' +
    'Качете съдържанието на този ZIP в корена на Vercel / Netlify / друг хостинг.\n' +
    'Това е статичен сайт — няма нужда от сървър или бекенд.\n')

  return zip.generateAsync({ type: 'blob' })
}
