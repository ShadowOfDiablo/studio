import { useEffect, useState } from 'react'
import { useStore } from './store.jsx'
import ProjectsView from './projects/ProjectsView.jsx'
import StudioView from './StudioView.jsx'
import { exchangeCode, fetchGithubUser, oauthAvailable } from './auth/github.js'

export default function App() {
  const { activeProjectId, setGithubToken, setGithubUser, githubToken, githubUser } = useStore()
  const [exchanging, setExchanging] = useState(false)

  // Handle OAuth callback: GitHub redirects back with ?code=
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const code = params.get('code')
    if (!code || !oauthAvailable()) return
    // Clear URL immediately so a page refresh doesn't re-use the code
    window.history.replaceState({}, document.title, window.location.pathname)
    setExchanging(true)
    exchangeCode(code)
      .then(token => {
        setGithubToken(token)
        return fetchGithubUser(token)
      })
      .then(user => setGithubUser(user))
      .catch(err => console.warn('GitHub OAuth failed:', err))
      .finally(() => setExchanging(false))
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Auto-fetch user info when a token is loaded but user info is missing
  // (covers the case where a PAT was stored previously)
  useEffect(() => {
    if (githubToken && !githubUser) {
      fetchGithubUser(githubToken)
        .then(user => setGithubUser(user))
        .catch(() => {}) // ignore — PAT may lack read:user scope
    }
  }, [githubToken]) // eslint-disable-line react-hooks/exhaustive-deps

  if (exchanging) {
    return (
      <div className="oauth-loading">
        <div className="oauth-loading-box">
          <div className="oauth-spin" />
          <p>Влизане с GitHub…</p>
        </div>
      </div>
    )
  }

  return activeProjectId ? <StudioView /> : <ProjectsView />
}
