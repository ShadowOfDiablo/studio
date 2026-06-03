import { useState, useEffect } from 'react'
import { useStore } from './store.jsx'
import Preview from './preview/Preview.jsx'
import ExportDialog from './export/ExportDialog.jsx'
import ImportDialog from './projects/ImportDialog.jsx'
import BrandPanel from './editor/BrandPanel.jsx'
import HeroPanel from './editor/HeroPanel.jsx'
import ServicesPanel from './editor/ServicesPanel.jsx'
import AboutPanel from './editor/AboutPanel.jsx'
import GalleryPanel from './editor/GalleryPanel.jsx'
import CustomSectionsPanel from './editor/CustomSectionsPanel.jsx'
import FreeCodePanel from './editor/FreeCodePanel.jsx'
import ContactPanel from './editor/ContactPanel.jsx'
import FooterPanel from './editor/FooterPanel.jsx'

const SECTIONS = [
  { id: 'brand', label: 'Бранд', Panel: BrandPanel },
  { id: 'hero', label: 'Начало', Panel: HeroPanel },
  { id: 'services', label: 'Услуги', Panel: ServicesPanel },
  { id: 'about', label: 'За нас', Panel: AboutPanel },
  { id: 'gallery', label: 'Галерия', Panel: GalleryPanel },
  { id: 'custom', label: 'Секции', Panel: CustomSectionsPanel },
  { id: 'freecode', label: 'Свободен код', Panel: FreeCodePanel },
  { id: 'contact', label: 'Контакти', Panel: ContactPanel },
  { id: 'footer', label: 'Футър', Panel: FooterPanel }
]

export default function StudioView() {
  const { activeProject, activePage, activePageId, setActivePageId, reset, closeProject, createPage, deletePage, clearIsNew } = useStore()
  const [active, setActive] = useState('brand')
  const [showExport, setShowExport] = useState(false)
  const [showImport, setShowImport] = useState(false)
  const [addingPage, setAddingPage] = useState(false)
  const [newPageName, setNewPageName] = useState('')

  // Auto-show import dialog for brand-new projects
  useEffect(() => {
    if (activeProject?.isNew) {
      clearIsNew(activeProject.id)
      setShowImport(true)
    }
  }, [activeProject?.id]) // only on project switch

  const ActivePanel = SECTIONS.find(s => s.id === active)?.Panel || SECTIONS[0].Panel

  function handleAddPage(e) {
    e.preventDefault()
    if (!newPageName.trim()) return
    const slug = newPageName.trim().toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
    createPage(newPageName.trim(), slug)
    setNewPageName('')
    setAddingPage(false)
    setActive('brand')
  }

  return (
    <div className="studio">
      <aside className="sidebar">
        <div className="sidebar-head">
          <button className="back-btn" onClick={closeProject}>← Проекти</button>
          <div className="brand-mark">
            <span className="dot" />
            {activeProject?.name}
          </div>
          <small>Редактор · v2</small>
        </div>

        <div className="pages-section">
          <div className="pages-header">
            <span>Страници</span>
            <button className="icon-btn" onClick={() => setAddingPage(v => !v)} title="Нова страница">+</button>
          </div>
          {activeProject?.pages.map(page => (
            <div key={page.id} className={`page-item${page.id === activePageId ? ' active' : ''}`}>
              <button
                className="page-name-btn"
                onClick={() => { setActivePageId(page.id); setActive('brand') }}
              >
                {page.name}
              </button>
              {activeProject.pages.length > 1 && (
                <button
                  className="page-del-btn"
                  title="Изтрий страница"
                  onClick={() => { if (confirm(`Изтриване на страница "${page.name}"?`)) deletePage(page.id) }}
                >✕</button>
              )}
            </div>
          ))}
          {addingPage && (
            <form className="add-page-form" onSubmit={handleAddPage}>
              <input
                autoFocus
                value={newPageName}
                onChange={e => setNewPageName(e.target.value)}
                placeholder="Им на страницата"
              />
              <button type="submit">OK</button>
              <button type="button" onClick={() => setAddingPage(false)}>✕</button>
            </form>
          )}
        </div>

        <nav className="sidebar-nav">
          {SECTIONS.map(s => (
            <button
              key={s.id}
              className={`nav-item${active === s.id ? ' active' : ''}`}
              onClick={() => setActive(s.id)}
            >
              {s.label}
              {s.id === 'freecode' && <span className="nav-badge">{'</>'}</span>}
            </button>
          ))}
        </nav>

        <div className="sidebar-foot">
          <button className="btn btn-primary" onClick={() => setShowExport(true)}>
            Експорт ↑
          </button>
          <button className="btn btn-ghost" onClick={() => setShowImport(true)}>
            Импорт / AI ↓
          </button>
          <button className="btn btn-ghost" onClick={reset}>Изчисти</button>
          <small className="autosave-hint">Автоматично записване</small>
        </div>
      </aside>

      <main className="main">
        <header className="main-head">
          <h1>{SECTIONS.find(s => s.id === active)?.label}</h1>
          {activePage && <span className="page-badge">{activePage.name}</span>}
        </header>
        <div className="panel">
          <ActivePanel />
        </div>
      </main>

      <section className="preview-pane">
        <header className="preview-head">
          <span>Предварителен преглед · {activePage?.name}</span>
        </header>
        <Preview />
      </section>

      {showExport && <ExportDialog onClose={() => setShowExport(false)} />}
      {showImport && <ImportDialog onClose={() => setShowImport(false)} />}
    </div>
  )
}
