import { useState } from 'react'
import { useStore } from '../store.jsx'
import ProjectDialog from './ProjectDialog.jsx'

function timeAgo(ts) {
  if (!ts) return null
  const diff = Date.now() - ts
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'Преди малко'
  if (mins < 60) return `Преди ${mins} мин.`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `Преди ${hrs} ч.`
  const days = Math.floor(hrs / 24)
  if (days === 1) return 'Вчера'
  return `Преди ${days} дни`
}

export default function ProjectsView() {
  const { projects, openProject, deleteProject } = useStore()
  const [dialog, setDialog] = useState(null) // null | 'new' | project object

  const sorted = [...projects].sort((a, b) => (b.lastOpenedAt || 0) - (a.lastOpenedAt || 0))
  const recent = sorted.filter(p => p.lastOpenedAt).slice(0, 3)

  return (
    <div className="projects-page">
      <header className="projects-header">
        <div className="brand-mark large">
          <span className="dot" />
          Studio
        </div>
        <button className="btn btn-primary-dark" onClick={() => setDialog('new')}>+ Нов проект</button>
      </header>

      <div className="projects-body">
        {recent.length > 0 && (
          <section className="projects-section">
            <h2 className="projects-section-title">Последно работени</h2>
            <div className="projects-recent-row">
              {recent.map(proj => (
                <button key={proj.id} className="recent-card" onClick={() => openProject(proj.id)}>
                  <div className="recent-card-icon">🌐</div>
                  <div className="recent-card-info">
                    <strong>{proj.name}</strong>
                    <span>{timeAgo(proj.lastOpenedAt)}</span>
                  </div>
                  <span className="recent-card-arrow">→</span>
                </button>
              ))}
            </div>
          </section>
        )}

        <section className="projects-section">
          <h2 className="projects-section-title">
            {recent.length > 0 ? 'Всички проекти' : 'Проекти'}
          </h2>
          {projects.length === 0 ? (
            <div className="projects-empty">
              <div className="projects-empty-icon">🌱</div>
              <p>Нямате проекти все още.<br />Създайте първия си сайт — не е нужно да програмирате!</p>
              <button className="btn btn-primary-dark" onClick={() => setDialog('new')}>+ Нов проект</button>
            </div>
          ) : (
            <div className="projects-grid">
              {sorted.map(proj => (
                <div key={proj.id} className="project-card">
                  <div className="project-card-body" onClick={() => openProject(proj.id)}>
                    <div className="project-icon">🌐</div>
                    <h3>{proj.name}</h3>
                    {proj.gitUrl && <small className="project-git">{proj.gitUrl}</small>}
                    <div className="project-meta">
                      <span>{proj.pages.length} {proj.pages.length === 1 ? 'страница' : 'страници'}</span>
                      {proj.lastOpenedAt && <span>{timeAgo(proj.lastOpenedAt)}</span>}
                    </div>
                  </div>
                  <div className="project-card-foot">
                    <button className="link-btn" onClick={() => openProject(proj.id)}>Отвори →</button>
                    <button className="link-btn" onClick={e => { e.stopPropagation(); setDialog(proj) }}>Настройки</button>
                    <button
                      className="link-btn danger"
                      onClick={e => {
                        e.stopPropagation()
                        if (confirm(`Изтриване на проект "${proj.name}"? Това е необратимо.`)) deleteProject(proj.id)
                      }}
                    >Изтриване</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      {dialog && (
        <ProjectDialog
          project={dialog === 'new' ? null : dialog}
          onClose={() => setDialog(null)}
        />
      )}
    </div>
  )
}
