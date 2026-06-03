export async function createGitHubRepo({ token, name, isPrivate = false, description = '' }) {
  const slug = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 100) || 'my-site'

  const res = await fetch('https://api.github.com/user/repos', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      name: slug,
      description: description || 'Studio project',
      private: isPrivate,
      auto_init: true
    })
  })

  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    throw new Error(data.message || `GitHub API грешка ${res.status}`)
  }

  return {
    repoUrl: data.clone_url,
    htmlUrl: data.html_url,
    defaultBranch: data.default_branch || 'main'
  }
}
