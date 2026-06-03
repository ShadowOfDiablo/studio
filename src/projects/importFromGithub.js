function parseGitHubRepo(url) {
  const match = url.match(/github\.com[/:]([^/]+)\/([^/.]+?)(?:\.git)?(?:\/.*)?$/)
  if (!match) throw new Error(`Невалиден GitHub URL: ${url}`)
  return { owner: match[1], repo: match[2] }
}

function decodeBase64UTF8(base64) {
  const bytes = Uint8Array.from(atob(base64.replace(/\n/g, '')), c => c.charCodeAt(0))
  return new TextDecoder().decode(bytes)
}

export async function fetchContentFromGitHub({ token, gitUrl, contentPath, branch = 'main' }) {
  const { owner, repo } = parseGitHubRepo(gitUrl)
  const headers = {
    Accept: 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
  }
  if (token) headers.Authorization = `Bearer ${token}`

  const branches = branch === 'main' ? ['main', 'master'] : [branch]
  let data = null
  let lastError = null

  for (const b of branches) {
    const res = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/contents/${contentPath}?ref=${b}`,
      { headers }
    )
    if (res.ok) { data = await res.json(); break }
    const err = await res.json().catch(() => ({}))
    lastError = err.message || `HTTP ${res.status}`
  }

  if (!data) throw new Error(`Файлът "${contentPath}" не е намерен. ${lastError || ''}`)

  const text = decodeBase64UTF8(data.content)
  return JSON.parse(text)
}
