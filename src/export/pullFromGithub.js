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
  const auth = token ? { Authorization: `Bearer ${token}` } : {}

  // jsonHeaders: for metadata endpoints (branches, directory listings)
  const jsonHeaders = { Accept: 'application/vnd.github+json', 'X-GitHub-Api-Version': '2022-11-28', ...auth }
  // rawHeaders: for file content — returns bytes directly, no base64 decode needed
  const rawHeaders = { Accept: 'application/vnd.github.raw+json', 'X-GitHub-Api-Version': '2022-11-28', ...auth }

  // Resolve branch (try main then master)
  let resolvedBranch = branch
  if (branch === 'main') {
    const mainTest = await fetch(`${apiBase}/branches/main`, { headers: jsonHeaders })
    if (!mainTest.ok) {
      const masterTest = await fetch(`${apiBase}/branches/master`, { headers: jsonHeaders })
      if (masterTest.ok) resolvedBranch = 'master'
    }
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
      { headers: rawHeaders }
    )
    if (!res.ok) continue
    const text = await res.text()
    try {
      contentByPageId.set(page.id, restoreImageIds(JSON.parse(text)))
    } catch {
      // skip pages whose content.json is invalid on GitHub
    }
  }

  if (contentByPageId.size === 0) {
    throw new Error('Не са намерени файлове с съдържание в репото.')
  }

  // 2. List and download images directory
  const imageMap = new Map()
  const repoImgDir = (imagesPath || 'public/images/').replace(/\/$/, '')

  const dirRes = await fetch(
    `${apiBase}/contents/${repoImgDir}?ref=${resolvedBranch}`,
    { headers: jsonHeaders }
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
        const dlRes = await fetch(file.download_url, { headers: auth })
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
