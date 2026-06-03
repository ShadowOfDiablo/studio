import { useState } from 'react'
import { useStore } from '../store.jsx'
import { exportContentBundle } from './exportContentBundle.js'
import { exportSiteBundle } from './exportSiteBundle.js'
import { pushToGitHub } from './pushToGithub.js'

function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  setTimeout(() => URL.revokeObjectURL(url), 60_000)
}

function extFromType(type) {
  if (!type) return 'bin'
  const m = type.match(/^image\/(\w+)$/)
  if (!m) return 'bin'
  return m[1] === 'jpeg' ? 'jpg' : m[1]
}

// Build the list of files to push to GitHub for all pages of the project.
function buildPushFiles({ pages, images, contentPath, imagesPath }) {
  const files = []
  const repoImgDir = (imagesPath || 'public/images/').replace(/\/$/, '')
  const siteImgDir = '/images'

  const pathById = new Map()
  for (const [id, { blob, type }] of images) {
    const filename = `${id}.${extFromType(type)}`
    pathById.set(id, `${siteImgDir}/${filename}`)
    files.push({ path: `${repoImgDir}/${filename}`, content: blob })
  }

  for (const page of pages) {
    const pub = JSON.parse(JSON.stringify(page.content))

    if (pub.gallery?.items) {
      pub.gallery.items = pub.gallery.items.map(it => {
        const path = it.imageId ? pathById.get(it.imageId) : null
        const { imageId, ...rest } = it
        return path ? { ...rest, image: path } : rest
      })
    }
    if (Array.isArray(pub.customSections)) {
      pub.customSections = pub.customSections.map(s => ({
        ...s,
        images: (s.images || [])
          .map(img => {
            const path = img.imageId ? pathById.get(img.imageId) : null
            return path ? { src: path, caption: img.caption } : null
          })
          .filter(Boolean)
      }))
    }

    const filePath = page.slug
      ? contentPath.replace(/content\.json$/, `content-${page.slug}.json`)
      : contentPath
    files.push({ path: filePath, content: JSON.stringify(pub, null, 2), encoding: 'utf-8' })
  }

  return files
}

export default function ExportDialog({ onClose }) {
  const { content, images, activeProject, githubToken, setGithubToken } = useStore()

  const [busy, setBusy] = useState(null) // 'content' | 'site' | 'git' | null
  const [err, setErr] = useState(null)
  const [progress, setProgress] = useState('')
  const [tokenInput, setTokenInput] = useState(githubToken || '')
  const [showToken, setShowToken] = useState(!githubToken)
  const [success, setSuccess] = useState(null)

  const hasGitUrl = !!activeProject?.gitUrl
  const projectName = activeProject?.name || 'project'

  const doContent = async () => {
    setBusy('content'); setErr(null)
    try {
      const blob = await exportContentBundle({ content, images })
      downloadBlob(blob, `${projectName}-content.zip`)
      onClose()
    } catch (e) {
      setErr(e.message || String(e))
    } finally { setBusy(null) }
  }

  const doSite = async () => {
    setBusy('site'); setErr(null)
    try {
      const blob = await exportSiteBundle({ content, images })
      downloadBlob(blob, `${projectName}-site.zip`)
      onClose()
    } catch (e) {
      setErr(e.message || String(e))
    } finally { setBusy(null) }
  }

  const doGitPush = async () => {
    const token = tokenInput.trim()
    if (!token) { setShowToken(true); setErr('Въведете GitHub Personal Access Token.'); return }
    if (!activeProject?.gitUrl) {
      setErr('Няма Git URL за този проект. Добавете го в настройките на проекта.')
      return
    }

    setBusy('git'); setErr(null); setProgress(''); setSuccess(null)
    if (token !== githubToken) setGithubToken(token)

    try {
      const files = buildPushFiles({
        pages: activeProject.pages,
        images,
        contentPath: activeProject.contentPath || 'public/content.json',
        imagesPath: activeProject.imagesPath || 'public/images/'
      })

      const result = await pushToGitHub({
        token,
        repoUrl: activeProject.gitUrl,
        branch: activeProject.branch || 'main',
        files,
        commitMessage: `Studio: update ${projectName} content`,
        onProgress: setProgress
      })

      setSuccess(result)
    } catch (e) {
      setErr(e.message || String(e))
    } finally { setBusy(null) }
  }

  if (success) {
    return (
      <div className="modal-backdrop" onClick={onClose}>
        <div className="modal" onClick={e => e.stopPropagation()}>
          <header className="modal-head">
            <h2>Публикувано успешно!</h2>
            <button className="link-btn" onClick={onClose}>✕</button>
          </header>
          <div className="export-success">
            <div className="export-success-icon">✅</div>
            <p>Commit <code>{success.commitSha.slice(0, 7)}</code> е качен в клон <code>{success.branch}</code>.</p>
            <p className="export-success-hint">Vercel ще разгърне новата версия автоматично след няколко секунди.</p>
            <div className="row" style={{ justifyContent: 'center' }}>
              <a href={success.repoUrl} target="_blank" rel="noreferrer" className="btn btn-primary-dark">
                Виж в GitHub ↗
              </a>
              <button className="btn btn-outline" onClick={onClose}>Затвори</button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className={`modal ${hasGitUrl ? 'modal-wide' : ''}`} onClick={e => e.stopPropagation()}>
        <header className="modal-head">
          <h2>Експорт · {projectName}</h2>
          <button className="link-btn" onClick={onClose}>✕</button>
        </header>

        <div className={`export-options ${hasGitUrl ? 'export-options-3' : ''}`}>
          {hasGitUrl && (
            <button className="export-card export-card-primary" onClick={doGitPush} disabled={busy !== null}>
              <div className="export-icon">🚀</div>
              <h3>Push to GitHub</h3>
              <p>
                Качва всички промени директно в репото.
                Vercel разгръща автоматично след push.
              </p>
              <strong>{busy === 'git' ? (progress || 'Изпращане…') : 'Публикувай в GitHub'}</strong>
            </button>
          )}

          <button className="export-card" onClick={doSite} disabled={busy !== null}>
            <div className="export-icon">🌐</div>
            <h3>Готов сайт</h3>
            <p>ZIP с всички файлове. Качи го в Vercel / Netlify директно.</p>
            <strong>{busy === 'site' ? 'Подготвяме…' : 'Изтегли пълен сайт'}</strong>
          </button>

          <button className="export-card" onClick={doContent} disabled={busy !== null}>
            <div className="export-icon">📦</div>
            <h3>Само съдържание</h3>
            <p>content.json + снимки. За разработчика.</p>
            <strong>{busy === 'content' ? 'Подготвяме…' : 'Изтегли съдържание'}</strong>
          </button>
        </div>

        {hasGitUrl && (showToken || !githubToken) && (
          <div className="token-section">
            <div className="field">
              <label className="field-label">GitHub Personal Access Token</label>
              <input
                type="password"
                value={tokenInput}
                onChange={e => setTokenInput(e.target.value)}
                placeholder="ghp_xxxxxxxxxxxx"
                autoComplete="off"
              />
              <small className="field-hint">
                Нужни права: <strong>Contents: Read &amp; Write</strong>.
                Токенът се запазва само в браузъра.
                {githubToken && (
                  <button
                    className="link-btn"
                    style={{ marginLeft: '0.5rem', fontSize: '0.75rem' }}
                    onClick={() => setShowToken(false)}
                  >Скрий</button>
                )}
              </small>
            </div>
          </div>
        )}

        {hasGitUrl && githubToken && !showToken && (
          <div className="token-stored">
            <span>🔑 Token запазен</span>
            <button className="link-btn" onClick={() => setShowToken(true)}>Промени</button>
          </div>
        )}

        {err && <div className="modal-error">⚠ {err}</div>}
      </div>
    </div>
  )
}
