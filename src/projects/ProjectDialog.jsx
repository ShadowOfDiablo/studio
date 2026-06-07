import { useState } from 'react'
import { useStore } from '../store.jsx'
import GitHubConnect from '../auth/GitHubConnect.jsx'
import RepoPicker from '../auth/RepoPicker.jsx'

export default function ProjectDialog({ project, onClose }) {
  const { createAndOpenProject, updateProject, githubUser, githubToken } = useStore()
  const isNew = !project

  const [name, setName] = useState(project?.name || '')
  const [gitUrl, setGitUrl] = useState(project?.gitUrl || '')
  const [branch, setBranch] = useState(project?.branch || 'main')
  const [contentPath, setContentPath] = useState(project?.contentPath || 'public/content.json')
  const [imagesPath, setImagesPath] = useState(project?.imagesPath || 'public/images/')
  const [showGithub, setShowGithub] = useState(!!(project?.gitUrl))
  const [showAdvanced, setShowAdvanced] = useState(false)

  const isConnected = !!(githubUser || githubToken)

  function handleRepoSelect({ url, branch: br }) {
    setGitUrl(url)
    setBranch(br || 'main')
  }

  function handleSubmit(e) {
    e.preventDefault()
    if (!name.trim()) return
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
              onChange={e => setName(e.target.value)}
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
                {/* Auth status / login */}
                <GitHubConnect />

                {/* Repo selection — shown when connected */}
                {isConnected && (
                  <div className="field" style={{ marginTop: '0.75rem' }}>
                    <label className="field-label">
                      Репозиторио
                      {gitUrl && (
                        <span className="gh-selected-url"> · <code>{gitUrl.replace('https://github.com/', '').replace('.git', '')}</code></span>
                      )}
                    </label>
                    <RepoPicker currentUrl={gitUrl} onSelect={handleRepoSelect} />
                    <small className="field-hint">
                      Изберете репозиторио от списъка или създайте ново. Сайтът ще се публикува там.
                    </small>
                  </div>
                )}

                {/* Manual URL fallback when not connected */}
                {!isConnected && (
                  <div className="field" style={{ marginTop: '0.75rem' }}>
                    <label className="field-label">URL на репозиторито (по избор)</label>
                    <input
                      value={gitUrl}
                      onChange={e => setGitUrl(e.target.value)}
                      placeholder="https://github.com/потребител/репо.git"
                    />
                    <small className="field-hint">Влезте с GitHub по-горе за да изберете репо от списък.</small>
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
