import { useState } from 'react'
import { useStore } from '../store.jsx'

export default function ProjectDialog({ project, onClose }) {
  const { createAndOpenProject, updateProject } = useStore()
  const isNew = !project

  const [name, setName] = useState(project?.name || '')
  const [gitUrl, setGitUrl] = useState(project?.gitUrl || '')
  const [branch, setBranch] = useState(project?.branch || 'main')
  const [contentPath, setContentPath] = useState(project?.contentPath || 'public/content.json')
  const [imagesPath, setImagesPath] = useState(project?.imagesPath || 'public/images/')

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
              placeholder="напр. Gradinko"
              autoFocus
            />
          </div>

          <div className="field">
            <label className="field-label">Git репозитори URL</label>
            <input
              value={gitUrl}
              onChange={e => setGitUrl(e.target.value)}
              placeholder="https://github.com/user/repo.git"
            />
            <small className="field-hint">Позволява публикуване директно в GitHub при Експорт.</small>
          </div>

          <div className="row">
            <div className="field">
              <label className="field-label">Клон (branch)</label>
              <input value={branch} onChange={e => setBranch(e.target.value)} placeholder="main" />
            </div>
          </div>

          <div className="field">
            <label className="field-label">Път до content.json в репото</label>
            <input value={contentPath} onChange={e => setContentPath(e.target.value)} placeholder="public/content.json" />
            <small className="field-hint">Обикновено public/content.json за Vite/CRA проекти.</small>
          </div>

          <div className="field">
            <label className="field-label">Папка за снимки в репото</label>
            <input value={imagesPath} onChange={e => setImagesPath(e.target.value)} placeholder="public/images/" />
          </div>

          <div className="row">
            <button className="btn btn-primary-dark" type="submit">
              {isNew ? 'Създаване' : 'Запазване'}
            </button>
            <button className="btn btn-outline" type="button" onClick={onClose}>Отказ</button>
          </div>
        </form>
      </div>
    </div>
  )
}
