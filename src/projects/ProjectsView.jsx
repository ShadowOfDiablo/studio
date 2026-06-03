import { useState } from 'react'
import { useStore } from '../store.jsx'
import ProjectDialog from './ProjectDialog.jsx'

export default function ProjectsView() {
  const { projects, openProject, deleteProject } = useStore()
  const [dialog, setDialog] = useState(null) // null | 'new' | existing project object

  return (
    <div className="projects-page">
      <header className="projects-header">
        <div className="brand-mark large">
          <span className="dot" />
          Studio
        </div>
        <button className="btn btn-primary-dark" onClick={() => setDialog('new')}>+ Нов проект</button>
      </header>

      <div className="projects-grid">
        {projects.length === 0 ? (
          <div className="projects-empty">
            <div className="projects-empty-icon">🗂️</div>
            <p>Нямате проекти. Създайте първия си проект.</p>
            <button className="btn btn-primary-dark" onClick={() => setDialog('new')}>+ Нов проект</button>
          </div>
        ) : projects.map(proj => (
          <div key={proj.id} className="project-card">
            <div className="project-card-body" onClick={() => openProject(proj.id)}>
              <div className="project-icon">🌐</div>
              <h3>{proj.name}</h3>
              {proj.gitUrl && <small className="project-git">{proj.gitUrl}</small>}
              <span className="project-pages">
                {proj.pages.length} {proj.pages.length === 1 ? 'страница' : 'страници'}
              </span>
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

      {dialog && (
        <ProjectDialog
          project={dialog === 'new' ? null : dialog}
          onClose={() => setDialog(null)}
        />
      )}
    </div>
  )
}
