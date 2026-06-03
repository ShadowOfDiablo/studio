import { createContext, useContext, useEffect, useState, useCallback, useMemo, useRef } from 'react'
import { defaultContent } from '../../gradinko/src/content.js'

const PROJECTS_KEY = 'studio-projects-v2'
const TOKEN_KEY = 'studio-github-token'
const OLD_DRAFT_KEY = 'gradinko-studio-draft-v1'
const OLD_IMAGES_KEY = 'gradinko-studio-images-v1'

const StoreContext = createContext(null)
export const useStore = () => useContext(StoreContext)

function clone(o) { return JSON.parse(JSON.stringify(o)) }
function uid(prefix = 'i') { return `${prefix}_${Math.random().toString(36).slice(2, 10)}` }

async function blobToBase64(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result)
    reader.onerror = reject
    reader.readAsDataURL(blob)
  })
}

async function base64ToBlob(dataURL) {
  const res = await fetch(dataURL)
  return res.blob()
}

function makeDefaultProject(name = 'New Project') {
  const pageId = uid('page')
  return {
    id: uid('proj'),
    name,
    gitUrl: '',
    branch: 'main',
    contentPath: 'public/content.json',
    imagesPath: 'public/images/',
    lastOpenedAt: null,
    pages: [{ id: pageId, name: 'Home', slug: '', content: clone(defaultContent) }]
  }
}

function migrateOldGradinko(projects) {
  try {
    const oldDraft = localStorage.getItem(OLD_DRAFT_KEY)
    if (!oldDraft) return projects
    const content = JSON.parse(oldDraft)
    const projId = uid('proj')
    const pageId = uid('page')
    const proj = {
      id: projId,
      name: 'Gradinko',
      gitUrl: 'https://github.com/ShadowOfDiablo/gradinko.git',
      branch: 'main',
      contentPath: 'public/content.json',
      imagesPath: 'public/images/',
      lastOpenedAt: Date.now(),
      pages: [{ id: pageId, name: 'Home', slug: '', content }]
    }
    const oldImgs = localStorage.getItem(OLD_IMAGES_KEY)
    if (oldImgs) {
      localStorage.setItem(`studio-images-${projId}`, oldImgs)
      localStorage.removeItem(OLD_IMAGES_KEY)
    }
    localStorage.removeItem(OLD_DRAFT_KEY)
    const migrated = [...projects, proj]
    localStorage.setItem(PROJECTS_KEY, JSON.stringify(migrated))
    return migrated
  } catch (e) {
    console.warn('Gradinko migration failed', e)
    return projects
  }
}

function loadProjects() {
  try {
    const raw = localStorage.getItem(PROJECTS_KEY)
    let projects = []
    if (raw) {
      const parsed = JSON.parse(raw)
      if (Array.isArray(parsed) && parsed.length > 0) projects = parsed
    }
    return migrateOldGradinko(projects)
  } catch {}
  return []
}

function imagesKey(projectId) { return `studio-images-${projectId}` }

export function StoreProvider({ children }) {
  const [projects, setProjects] = useState(loadProjects)
  const [activeProjectId, setActiveProjectId] = useState(null)
  const [activePageId, setActivePageId] = useState(null)
  const [images, setImages] = useState(() => new Map())
  const objectURLs = useRef(new Map())
  const [githubToken, setGithubTokenState] = useState(() => localStorage.getItem(TOKEN_KEY) || '')

  const activeProject = projects.find(p => p.id === activeProjectId) || null
  const activePage = activeProject?.pages.find(p => p.id === activePageId) || null
  const content = activePage?.content || null

  // Load images when switching projects
  useEffect(() => {
    if (!activeProjectId) return
    let cancelled = false
    async function rehydrate() {
      try {
        const raw = localStorage.getItem(imagesKey(activeProjectId))
        if (!raw) { setImages(new Map()); return }
        const entries = JSON.parse(raw)
        const next = new Map()
        for (const [id, { dataURL, name, type }] of entries) {
          const blob = await base64ToBlob(dataURL)
          next.set(id, { blob, name, type })
        }
        if (!cancelled) setImages(next)
      } catch (e) {
        console.warn('Could not rehydrate images', e)
        if (!cancelled) setImages(new Map())
      }
    }
    for (const url of objectURLs.current.values()) URL.revokeObjectURL(url)
    objectURLs.current.clear()
    rehydrate()
    return () => { cancelled = true }
  }, [activeProjectId])

  // Autosave projects
  useEffect(() => {
    try { localStorage.setItem(PROJECTS_KEY, JSON.stringify(projects)) }
    catch (e) { console.warn('Could not persist projects', e) }
  }, [projects])

  // Autosave images (debounced)
  useEffect(() => {
    if (!activeProjectId) return
    const t = setTimeout(async () => {
      try {
        const entries = []
        for (const [id, { blob, name, type }] of images) {
          entries.push([id, { dataURL: await blobToBase64(blob), name, type }])
        }
        localStorage.setItem(imagesKey(activeProjectId), JSON.stringify(entries))
      } catch (e) { console.warn('Could not persist images (quota exceeded?)', e) }
    }, 500)
    return () => clearTimeout(t)
  }, [images, activeProjectId])

  useEffect(() => {
    return () => { for (const url of objectURLs.current.values()) URL.revokeObjectURL(url) }
  }, [])

  const imageURL = useCallback((id) => {
    if (!id) return null
    if (objectURLs.current.has(id)) return objectURLs.current.get(id)
    const rec = images.get(id)
    if (!rec) return null
    const url = URL.createObjectURL(rec.blob)
    objectURLs.current.set(id, url)
    return url
  }, [images])

  const addImage = useCallback(async (file) => {
    const id = uid('img')
    setImages(prev => { const next = new Map(prev); next.set(id, { blob: file, name: file.name, type: file.type }); return next })
    return id
  }, [])

  const removeImage = useCallback((id) => {
    setImages(prev => { const next = new Map(prev); next.delete(id); return next })
    if (objectURLs.current.has(id)) {
      URL.revokeObjectURL(objectURLs.current.get(id))
      objectURLs.current.delete(id)
    }
  }, [])

  const update = useCallback((updater) => {
    if (!activeProjectId || !activePageId) return
    setProjects(prev => prev.map(proj => {
      if (proj.id !== activeProjectId) return proj
      return {
        ...proj,
        pages: proj.pages.map(page => {
          if (page.id !== activePageId) return page
          const draft = clone(page.content)
          updater(draft)
          return { ...page, content: draft }
        })
      }
    }))
  }, [activeProjectId, activePageId])

  const reset = useCallback(() => {
    if (!confirm('Това ще изтрие всички промени и снимки за тази страница. Сигурни ли сте?')) return
    if (!activeProjectId || !activePageId) return
    setProjects(prev => prev.map(proj => {
      if (proj.id !== activeProjectId) return proj
      return {
        ...proj,
        pages: proj.pages.map(page => {
          if (page.id !== activePageId) return page
          return { ...page, content: clone(defaultContent) }
        })
      }
    }))
    setImages(new Map())
    localStorage.removeItem(imagesKey(activeProjectId))
  }, [activeProjectId, activePageId])

  // Project CRUD
  const createAndOpenProject = useCallback((name, gitUrl = '', branch = 'main', contentPath = 'public/content.json', imagesPath = 'public/images/') => {
    const proj = makeDefaultProject(name)
    proj.gitUrl = gitUrl
    proj.branch = branch
    proj.contentPath = contentPath
    proj.imagesPath = imagesPath
    proj.lastOpenedAt = Date.now()
    setProjects(prev => [...prev, proj])
    setActiveProjectId(proj.id)
    setActivePageId(proj.pages[0].id)
    return proj
  }, [])

  const updateProject = useCallback((id, patch) => {
    setProjects(prev => prev.map(p => p.id === id ? { ...p, ...patch } : p))
  }, [])

  const deleteProject = useCallback((id) => {
    setProjects(prev => prev.filter(p => p.id !== id))
    try { localStorage.removeItem(imagesKey(id)) } catch {}
    if (activeProjectId === id) { setActiveProjectId(null); setActivePageId(null) }
  }, [activeProjectId])

  const openProject = useCallback((id) => {
    const proj = projects.find(p => p.id === id)
    if (!proj) return
    setProjects(prev => prev.map(p => p.id === id ? { ...p, lastOpenedAt: Date.now() } : p))
    setActiveProjectId(id)
    setActivePageId(proj.pages[0]?.id || null)
  }, [projects])

  const closeProject = useCallback(() => {
    setActiveProjectId(null)
    setActivePageId(null)
    setImages(new Map())
  }, [])

  // Page CRUD
  const createPage = useCallback((name, slug) => {
    if (!activeProjectId) return null
    const page = { id: uid('page'), name, slug, content: clone(defaultContent) }
    setProjects(prev => prev.map(proj => {
      if (proj.id !== activeProjectId) return proj
      return { ...proj, pages: [...proj.pages, page] }
    }))
    setActivePageId(page.id)
    return page
  }, [activeProjectId])

  const updatePage = useCallback((pageId, patch) => {
    if (!activeProjectId) return
    setProjects(prev => prev.map(proj => {
      if (proj.id !== activeProjectId) return proj
      return { ...proj, pages: proj.pages.map(p => p.id === pageId ? { ...p, ...patch } : p) }
    }))
  }, [activeProjectId])

  const deletePage = useCallback((pageId) => {
    if (!activeProjectId) return
    setProjects(prev => prev.map(proj => {
      if (proj.id !== activeProjectId) return proj
      return { ...proj, pages: proj.pages.filter(p => p.id !== pageId) }
    }))
    if (activePageId === pageId) {
      const proj = projects.find(p => p.id === activeProjectId)
      const remaining = (proj?.pages || []).filter(p => p.id !== pageId)
      setActivePageId(remaining[0]?.id || null)
    }
  }, [activeProjectId, activePageId, projects])

  const importContent = useCallback((newContent) => {
    if (!activeProjectId || !activePageId) return
    setProjects(prev => prev.map(proj => {
      if (proj.id !== activeProjectId) return proj
      return {
        ...proj,
        pages: proj.pages.map(page => {
          if (page.id !== activePageId) return page
          return { ...page, content: clone(newContent) }
        })
      }
    }))
  }, [activeProjectId, activePageId])

  const setGithubToken = useCallback((token) => {
    setGithubTokenState(token)
    try { localStorage.setItem(TOKEN_KEY, token) } catch {}
  }, [])

  const value = useMemo(() => ({
    projects,
    activeProject,
    activeProjectId,
    openProject,
    closeProject,
    createAndOpenProject,
    updateProject,
    deleteProject,
    activePage,
    activePageId,
    setActivePageId,
    createPage,
    updatePage,
    deletePage,
    content,
    update,
    reset,
    images,
    addImage,
    removeImage,
    imageURL,
    importContent,
    githubToken,
    setGithubToken,
  }), [
    projects, activeProject, activeProjectId,
    openProject, closeProject, createAndOpenProject, updateProject, deleteProject,
    activePage, activePageId, setActivePageId, createPage, updatePage, deletePage,
    content, update, reset, importContent,
    images, addImage, removeImage, imageURL,
    githubToken, setGithubToken,
  ])

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>
}
