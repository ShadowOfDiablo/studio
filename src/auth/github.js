const CLIENT_ID = import.meta.env.VITE_GITHUB_CLIENT_ID

export function oauthAvailable() {
  return !!CLIENT_ID
}

export function getOAuthUrl() {
  const state = Math.random().toString(36).slice(2)
  sessionStorage.setItem('github_oauth_state', state)
  const params = new URLSearchParams({
    client_id: CLIENT_ID,
    scope: 'repo,read:user',
    state
  })
  return `https://github.com/login/oauth/authorize?${params}`
}

export async function exchangeCode(code) {
  const res = await fetch(`/api/github-oauth?code=${encodeURIComponent(code)}`)
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.message || `OAuth exchange failed (${res.status})`)
  }
  const data = await res.json()
  if (data.error) throw new Error(data.message || data.error)
  return data.access_token
}

export async function fetchGithubUser(token) {
  const res = await fetch('https://api.github.com/user', {
    headers: { Authorization: `Bearer ${token}`, Accept: 'application/vnd.github+json' }
  })
  if (!res.ok) throw new Error('Could not fetch GitHub user')
  return res.json() // { login, avatar_url, name, html_url }
}

export async function fetchUserRepos(token) {
  const all = []
  let page = 1
  while (true) {
    const res = await fetch(
      `https://api.github.com/user/repos?per_page=100&page=${page}&sort=updated&type=owner`,
      { headers: { Authorization: `Bearer ${token}`, Accept: 'application/vnd.github+json' } }
    )
    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      throw new Error(err.message || 'Could not load repositories')
    }
    const batch = await res.json()
    all.push(...batch)
    if (batch.length < 100) break
    page++
  }
  return all // [{ id, full_name, clone_url, default_branch, private }]
}

export async function createRepo(token, { name, isPrivate = false, description = '' }) {
  const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 100) || 'my-site'
  const res = await fetch('https://api.github.com/user/repos', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/vnd.github+json',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ name: slug, description, private: isPrivate, auto_init: true })
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(data.message || `GitHub API error ${res.status}`)
  return { cloneUrl: data.clone_url, defaultBranch: data.default_branch || 'main', htmlUrl: data.html_url }
}
