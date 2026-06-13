function parseGitHubRepo(url) {
  const match = url.match(/github\.com[/:]([^/]+)\/([^/.]+?)(?:\.git)?(?:\/.*)?$/)
  if (!match) throw new Error(`Невалиден GitHub URL: ${url}`)
  return { owner: match[1], repo: match[2] }
}

// "/images/img_abc123.jpg" → "img_abc123"
function imageIdFromPath(src) {
  return src.split('/').pop().replace(/\.[^.]+$/, '')
}

// Convert pushed content (image paths) back to studio format (imageId fields)
function restoreImageIds(content) {
  const c = JSON.parse(JSON.stringify(content))

  if (c.gallery?.items) {
    c.gallery.items = c.gallery.items.map(item => {
      if (item.image?.startsWith('/images/')) {
        const { image, ...rest } = item
        return { ...rest, imageId: imageIdFromPath(image) }
      }
      return item
    })
  }

  if (Array.isArray(c.customSections)) {
    c.customSections = c.customSections.map(s => ({
      ...s,
      images: (s.images || []).map(img => {
        if (img.src?.startsWith('/images/')) {
          return { imageId: imageIdFromPath(img.src), caption: img.caption }
        }
        return img
      })
    }))
  }

  return c
}

export async function pullProjectFromGitHub({ token, gitUrl, pages, contentPath, imagesPath, branch = 'main', onProgress }) {
  const { owner, repo } = parseGitHubRepo(gitUrl)
  const apiBase = `https://api.github.com/repos/${owner}/${repo}`
  const apiHeaders = {
    Accept: 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
    ...(token ? { Authorization: `Bearer ${token}` } : {})
  }

  // Resolve branch (try main then master)
  let resolvedBranch = branch
  if (branch === 'main') {
    const test = await fetch(`${apiBase}/branches/master`, { headers: apiHeaders })
    const mainTest = await fetch(`${apiBase}/branches/main`, { headers: apiHeaders })
    if (!mainTest.ok && test.ok) resolvedBranch = 'master'
  }

  function decodeBase64(b64) {
    const bytes = Uint8Array.from(atob(b64.replace(/\n/g, '')), c => c.charCodeAt(0))
    return new TextDecoder().decode(bytes)
  }

  // 1. Fetch content JSON for each local page
  onProgress('Изтегляне на съдържание…')
  const contentByPageId = new Map()

  for (const page of pages) {
    const filePath = page.slug
      ? contentPath.replace(/content\.json$/, `content-${page.slug}.json`)
      : contentPath

    const res = await fetch(
      `${apiBase}/contents/${filePath}?ref=${resolvedBranch}`,
      { headers: apiHeaders }
    )
    if (!res.ok) continue
    const data = await res.json()
    const parsed = JSON.parse(decodeBase64(data.content))
    contentByPageId.set(page.id, restoreImageIds(parsed))
  }

  if (contentByPageId.size === 0) {
    throw new Error('Не са намерени файлове с съдържание в репото.')
  }

  // 2. List and download images directory
  const imageMap = new Map()
  const repoImgDir = (imagesPath || 'public/images/').replace(/\/$/, '')

  const dirRes = await fetch(
    `${apiBase}/contents/${repoImgDir}?ref=${resolvedBranch}`,
    { headers: apiHeaders }
  )

  if (dirRes.ok) {
    const entries = await dirRes.json()
    const imageFiles = Array.isArray(entries)
      ? entries.filter(f => f.type === 'file' && /\.(jpe?g|png|gif|webp|svg)$/i.test(f.name))
      : []

    for (let i = 0; i < imageFiles.length; i++) {
      const file = imageFiles[i]
      onProgress(`Снимки: ${i + 1} / ${imageFiles.length}…`)
      try {
        const dlHeaders = token ? { Authorization: `Bearer ${token}` } : {}
        const dlRes = await fetch(file.download_url, { headers: dlHeaders })
        if (!dlRes.ok) continue
        const blob = await dlRes.blob()
        const id = file.name.replace(/\.[^.]+$/, '')
        const type = blob.type || `image/${file.name.split('.').pop().replace('jpg', 'jpeg')}`
        imageMap.set(id, { blob, name: file.name, type })
      } catch {
        // skip individual image failures
      }
    }
  }

  return {
    contentByPageId,
    imageMap,
    stats: { pages: contentByPageId.size, images: imageMap.size }
  }
}
