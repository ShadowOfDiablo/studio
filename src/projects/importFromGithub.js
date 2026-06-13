function parseGitHubRepo(url) {
  const match = url.match(/github\.com[/:]([^/]+)\/([^/.]+?)(?:\.git)?(?:\/.*)?$/)
  if (!match) throw new Error(`Невалиден GitHub URL: ${url}`)
  return { owner: match[1], repo: match[2] }
}

export async function fetchContentFromGitHub({ token, gitUrl, contentPath, branch = 'main' }) {
  const { owner, repo } = parseGitHubRepo(gitUrl)
  const headers = {
    // raw+json returns the file bytes directly — no base64 decode needed
    Accept: 'application/vnd.github.raw+json',
    'X-GitHub-Api-Version': '2022-11-28',
  }
  if (token) headers.Authorization = `Bearer ${token}`

  const branches = branch === 'main' ? ['main', 'master'] : [branch]
  let text = null
  let lastError = null

  for (const b of branches) {
    const res = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/contents/${contentPath}?ref=${b}`,
      { headers }
    )
    if (res.ok) { text = await res.text(); break }
    const err = await res.json().catch(() => ({}))
    lastError = err.message || `HTTP ${res.status}`
  }

  if (text === null) throw new Error(`Файлът "${contentPath}" не е намерен. ${lastError || ''}`)

  try {
    return JSON.parse(text)
  } catch (e) {
    throw new Error(`Файлът "${contentPath}" съдържа невалиден JSON: ${e.message}`)
  }
}
