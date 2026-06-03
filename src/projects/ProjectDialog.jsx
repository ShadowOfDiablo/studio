import { useState } from 'react'
import { useStore } from '../store.jsx'
import { createGitHubRepo } from './createGithubRepo.js'

export default function ProjectDialog({ project, onClose }) {
  const { createAndOpenProject, updateProject, githubToken, setGithubToken } = useStore()
  const isNew = !project

  const [name, setName] = useState(project?.name || '')
  const [gitUrl, setGitUrl] = useState(project?.gitUrl || '')
  const [branch, setBranch] = useState(project?.branch || 'main')
  const [contentPath, setContentPath] = useState(project?.contentPath || 'public/content.json')
  const [imagesPath, setImagesPath] = useState(project?.imagesPath || 'public/images/')

  const [showGithub, setShowGithub] = useState(!!(project?.gitUrl))
  const [githubMode, setGithubMode] = useState(project?.gitUrl ? 'existing' : 'create')
  const [tokenInput, setTokenInput] = useState(githubToken || '')
  const [repoName, setRepoName] = useState('')
  const [repoPrivate, setRepoPrivate] = useState(false)
  const [creating, setCreating] = useState(false)
  const [createErr, setCreateErr] = useState(null)
  const [createSuccess, setCreateSuccess] = useState(false)
  const [showAdvanced, setShowAdvanced] = useState(false)

  const tokenSaved = githubToken && tokenInput === githubToken

  function handleSubmit(e) {
    e.preventDefault()
    if (!name.trim()) return
    const token = tokenInput.trim()
    if (token && token !== githubToken) setGithubToken(token)
    if (isNew) {
      createAndOpenProject(
        name.trim(),
        gitUrl.trim(),
        branch.trim() || 'main',
        contentPath.trim() || 'public/content.json',
        imagesPath.trim() || 'public/images/'
      )
    } else {
      updateProject(project.id, {
        name: name.trim(),
        gitUrl: gitUrl.trim(),
        branch: branch.trim() || 'main',
        contentPath: contentPath.trim() || 'public/content.json',
        imagesPath: imagesPath.trim() || 'public/images/'
      })
    }
    onClose()
  }

  async function handleCreateRepo() {
    const token = tokenInput.trim()
    if (!token) { setCreateErr('Въведете GitHub токен.'); return }
    const slug = (repoName.trim() || name.trim()).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'my-site'
    setCreating(true); setCreateErr(null)
    if (token !== githubToken) setGithubToken(token)
    try {
      const { repoUrl, defaultBranch } = await createGitHubRepo({
        token,
        name: slug,
        isPrivate: repoPrivate,
        description: name.trim() ? `Studio project: ${name.trim()}` : ''
      })
      setGitUrl(repoUrl)
      setBranch(defaultBranch || 'main')
      setCreateSuccess(true)
      setGithubMode('existing')
    } catch (e) {
      setCreateErr(e.message || String(e))
    } finally {
      setCreating(false)
    }
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <header className="modal-head">
          <h2>{isNew ? 'Нов проект' : `Настройки · ${project.name}`}</h2>
          <button className="link-btn" onClick={onClose}>✕</button>
        </header>

        <form onSubmit={handleSubmit} className="project-form">
          <div className="field">
            <label className="field-label">Име на проекта *</label>
            <input
              value={name}
              onChange={e => {
                setName(e.target.value)
                if (!repoName) {
                  setRepoName(e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, ''))
                }
              }}
              required
              placeholder="напр. Моят сайт"
              autoFocus
            />
          </div>

          {/* GitHub section */}
          <div className="github-section">
            <button
              type="button"
              className={`github-toggle${showGithub ? ' active' : ''}`}
              onClick={() => setShowGithub(v => !v)}
            >
              <span>⬡</span>
              {showGithub ? 'Скрий GitHub настройки' : 'Свържи с GitHub (за публикуване в интернет)'}
              <span className="github-toggle-caret">{showGithub ? '▲' : '▼'}</span>
            </button>

            {showGithub && (
              <div className="github-content">
                {tokenSaved ? (
                  <div className="token-stored">
                    <span>🔑 GitHub токен запазен</span>
                    <button type="button" className="link-btn" onClick={() => setTokenInput('')}>Промени</button>
                  </div>
                ) : (
                  <div className="field">
                    <label className="field-label">GitHub токен</label>
                    <input
                      type="password"
                      value={tokenInput}
                      onChange={e => setTokenInput(e.target.value)}
                      placeholder="ghp_xxxxxxxxxxxx"
                      autoComplete="off"
                    />
                    <small className="field-hint">
                      Откъде да го вземете: <strong>GitHub.com → Настройки → Developer settings → Personal access tokens → Tokens (classic)</strong>. Изберете право <strong>repo</strong>.
                    </small>
                  </div>
                )}

                <div className="github-mode-tabs">
                  <button
                    type="button"
                    className={`github-mode-tab${githubMode === 'create' ? ' active' : ''}`}
                    onClick={() => { setGithubMode('create'); setCreateSuccess(false); setCreateErr(null) }}
                  >
                    ✨ Създай ново репо
                  </button>
                  <button
                    type="button"
                    className={`github-mode-tab${githubMode === 'existing' ? ' active' : ''}`}
                    onClick={() => setGithubMode('existing')}
                  >
                    🔗 Свържи съществуващо
                  </button>
                </div>

                {githubMode === 'create' && (
                  <div className="github-create-box">
                    {createSuccess ? (
                      <div className="create-success">
                        ✅ Репозиторито е създадено!<br />
                        <code>{gitUrl}</code>
                      </div>
                    ) : (
                      <>
                        <div className="field">
                          <label className="field-label">Адрес на репозиторито (само букви и тирета)</label>
                          <input
                            value={repoName}
                            onChange={e => setRepoName(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                            placeholder={name.toLowerCase().replace(/[^a-z0-9]+/g, '-') || 'moya-stranitsa'}
                          />
                        </div>
                        <label className="checkbox-label">
                          <input type="checkbox" checked={repoPrivate} onChange={e => setRepoPrivate(e.target.checked)} />
                          Частно (само аз го виждам)
                        </label>
                        {createErr && <div className="create-err">⚠ {createErr}</div>}
                        <button
                          type="button"
                          className="btn btn-primary-dark"
                          onClick={handleCreateRepo}
                          disabled={creating}
                          style={{ alignSelf: 'flex-start' }}
                        >
                          {creating ? 'Създаване…' : '+ Създай GitHub репо'}
                        </button>
                      </>
                    )}
                  </div>
                )}

                {githubMode === 'existing' && (
                  <div className="field">
                    <label className="field-label">URL на репозиторито</label>
                    <input
                      value={gitUrl}
                      onChange={e => setGitUrl(e.target.value)}
                      placeholder="https://github.com/потребител/репо.git"
                    />
                    <small className="field-hint">Намерете го в GitHub → вашето репо → зелен бутон "Code" → HTTPS.</small>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Advanced settings */}
          <div className="advanced-section">
            <button type="button" className="advanced-toggle" onClick={() => setShowAdvanced(v => !v)}>
              Разширени настройки {showAdvanced ? '▲' : '▼'}
            </button>
            {showAdvanced && (
              <div className="advanced-content">
                <div className="field">
                  <label className="field-label">Клон (branch)</label>
                  <input value={branch} onChange={e => setBranch(e.target.value)} placeholder="main" />
                </div>
                <div className="field">
                  <label className="field-label">Път до content.json в репото</label>
                  <input value={contentPath} onChange={e => setContentPath(e.target.value)} placeholder="public/content.json" />
                  <small className="field-hint">По подразбиране: public/content.json</small>
                </div>
                <div className="field">
                  <label className="field-label">Папка за снимки в репото</label>
                  <input value={imagesPath} onChange={e => setImagesPath(e.target.value)} placeholder="public/images/" />
                </div>
              </div>
            )}
          </div>

          <div className="row">
            <button className="btn btn-primary-dark" type="submit">
              {isNew ? 'Създай проект' : 'Запазване'}
            </button>
            <button className="btn btn-outline" type="button" onClick={onClose}>Отказ</button>
          </div>
        </form>
      </div>
    </div>
  )
}
