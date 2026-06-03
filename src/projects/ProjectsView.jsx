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

function OnboardingWizard({ onNew, onImport }) {
  return (
    <div className="onboarding">
      <div className="onboarding-hero">
        <div className="onboarding-logo">
          <span className="dot large" />
          <span className="onboarding-logo-text">Gradinko Studio</span>
        </div>
        <h1 className="onboarding-title">Добре дошли!</h1>
        <p className="onboarding-sub">
          Създавайте и публикувайте сайтове без писане на код.<br />
          Просто попълнете информацията и натиснете „Експорт".
        </p>
      </div>

      <div className="onboarding-steps">
        <div className="onboarding-step">
          <div className="step-num">1</div>
          <div className="step-body">
            <strong>Създайте проект</strong>
            <span>Дайте му име и по желание свържете GitHub репо.</span>
          </div>
        </div>
        <div className="onboarding-step-arrow">→</div>
        <div className="onboarding-step">
          <div className="step-num">2</div>
          <div className="step-body">
            <strong>Напълнете с съдържание</strong>
            <span>Редактирайте текстове и снимки, или оставете AI да го направи.</span>
          </div>
        </div>
        <div className="onboarding-step-arrow">→</div>
        <div className="onboarding-step">
          <div className="step-num">3</div>
          <div className="step-body">
            <strong>Публикувайте</strong>
            <span>Натиснете Експорт и сайтът се качва в GitHub → Vercel автоматично.</span>
          </div>
        </div>
      </div>

      <div className="onboarding-actions">
        <button className="btn btn-primary-dark onboarding-cta" onClick={onNew}>
          ✨ Създай нов сайт
        </button>
        <button className="btn btn-outline onboarding-cta-sec" onClick={onImport}>
          📥 Импортирай от GitHub
        </button>
      </div>
    </div>
  )
}

export default function ProjectsView() {
  const { projects, openProject, deleteProject } = useStore()
  const [dialog, setDialog] = useState(null) // null | 'new' | project object
  const [showImportWizard, setShowImportWizard] = useState(false)

  const sorted = [...projects].sort((a, b) => (b.lastOpenedAt || 0) - (a.lastOpenedAt || 0))
  const recent = sorted.filter(p => p.lastOpenedAt).slice(0, 3)

  if (projects.length === 0) {
    return (
      <>
        <OnboardingWizard
          onNew={() => setDialog('new')}
          onImport={() => setDialog('new')}
        />
        {dialog && (
          <ProjectDialog
            project={null}
            onClose={() => setDialog(null)}
          />
        )}
      </>
    )
  }

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
