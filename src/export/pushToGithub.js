// Pushes files to a GitHub repo as a single commit using the Git Data API.
// This avoids creating one commit per file (unlike the Contents API).

function parseGitHubRepo(url) {
  const match = url.match(/github\.com[/:]([^/]+)\/([^/.]+?)(?:\.git)?(?:\/.*)?$/)
  if (!match) throw new Error(`Невалиден GitHub URL: ${url}`)
  return { owner: match[1], repo: match[2] }
}

async function ghFetch(path, token, options = {}) {
  const res = await fetch(`https://api.github.com${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
      'Content-Type': 'application/json',
      ...(options.headers || {})
    }
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    const msg = data.message || `GitHub API грешка ${res.status}`
    throw new Error(msg)
  }
  return data
}

function blobToBase64Str(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result.split(',')[1])
    reader.onerror = reject
    reader.readAsDataURL(blob)
  })
}

/**
 * Push files to GitHub as a single commit.
 *
 * @param {object} opts
 * @param {string} opts.token   - GitHub Personal Access Token (needs repo write scope)
 * @param {string} opts.repoUrl - Full GitHub repo URL (https or git)
 * @param {string} opts.branch  - Branch to push to (default: 'main')
 * @param {Array}  opts.files   - Array of { path, content (string | Blob), encoding? }
 * @param {string} opts.commitMessage
 * @param {Function} opts.onProgress - (message: string) => void
 */
export async function pushToGitHub({ token, repoUrl, branch = 'main', files, commitMessage, onProgress }) {
  const { owner, repo } = parseGitHubRepo(repoUrl)
  const base = `/repos/${owner}/${repo}`

  onProgress?.('Свързване с репозитория…')

  // 1. Resolve branch ref → latest commit SHA
  let latestSha
  try {
    const ref = await ghFetch(`${base}/git/ref/heads/${branch}`, token)
    latestSha = ref.object.sha
  } catch (e) {
    // Try 'master' as fallback if 'main' was not found
    if (branch === 'main') {
      try {
        const ref = await ghFetch(`${base}/git/ref/heads/master`, token)
        latestSha = ref.object.sha
        branch = 'master'
      } catch {
        throw new Error(`Клонът "${branch}" не е намерен в репото. Проверете настройките на проекта.`)
      }
    } else {
      throw new Error(`Клонът "${branch}" не е намерен в репото.`)
    }
  }

  // 2. Get base tree SHA from latest commit
  const commit = await ghFetch(`${base}/git/commits/${latestSha}`, token)
  const baseTreeSha = commit.tree.sha

  onProgress?.(`Подготовка на ${files.length} файла…`)

  // 3. Create blobs for all files
  const treeItems = []
  for (let i = 0; i < files.length; i++) {
    const { path, content, encoding } = files[i]
    onProgress?.(`Качване ${i + 1}/${files.length}: ${path}`)

    let blobContent = content
    let blobEncoding = encoding || 'utf-8'

    if (content instanceof Blob) {
      blobContent = await blobToBase64Str(content)
      blobEncoding = 'base64'
    }

    const blob = await ghFetch(`${base}/git/blobs`, token, {
      method: 'POST',
      body: JSON.stringify({ content: blobContent, encoding: blobEncoding })
    })

    treeItems.push({ path, mode: '100644', type: 'blob', sha: blob.sha })
  }

  onProgress?.('Създаване на commit…')

  // 4. Create new tree on top of the base tree
  const newTree = await ghFetch(`${base}/git/trees`, token, {
    method: 'POST',
    body: JSON.stringify({ base_tree: baseTreeSha, tree: treeItems })
  })

  // 5. Create commit
  const newCommit = await ghFetch(`${base}/git/commits`, token, {
    method: 'POST',
    body: JSON.stringify({
      message: commitMessage || 'Studio: update content',
      tree: newTree.sha,
      parents: [latestSha]
    })
  })

  // 6. Fast-forward the branch ref
  await ghFetch(`${base}/git/refs/heads/${branch}`, token, {
    method: 'PATCH',
    body: JSON.stringify({ sha: newCommit.sha })
  })

  onProgress?.('Готово!')
  return {
    commitSha: newCommit.sha,
    repoUrl: `https://github.com/${owner}/${repo}`,
    branch
  }
}
