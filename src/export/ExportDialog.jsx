import { useState } from 'react'
import { useStore } from '../store.jsx'
import { exportContentBundle } from './exportContentBundle.js'
import { exportSiteBundle } from './exportSiteBundle.js'
import { pushToGitHub } from './pushToGithub.js'
import { pullProjectFromGitHub } from './pullFromGithub.js'
import GitHubConnect from '../auth/GitHubConnect.jsx'
import RepoPicker from '../auth/RepoPicker.jsx'

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
  const { content, images, activeProject, githubToken, githubUser, updateProject, replaceAllContent } = useStore()

  const [busy, setBusy] = useState(null) // 'content' | 'site' | 'git' | null
  const [err, setErr] = useState(null)
  const [progress, setProgress] = useState('')
  const [success, setSuccess] = useState(null)
  const [pushGitUrl, setPushGitUrl] = useState(activeProject?.gitUrl || '')
  const [pushBranch, setPushBranch] = useState(activeProject?.branch || 'main')

  const hasGitUrl = !!(activeProject?.gitUrl || pushGitUrl)
  const isConnected = !!(githubUser || githubToken)
  const projectName = activeProject?.name || 'project'

  function handleRepoSelect({ url, branch }) {
    setPushGitUrl(url)
    setPushBranch(branch || 'main')
    // Persist the selection to the project
    if (activeProject) {
      updateProject(activeProject.id, { gitUrl: url, branch: branch || 'main' })
    }
  }

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
    if (!githubToken) { setErr('Влезте с GitHub за да публикувате.'); return }
    const repoUrl = activeProject?.gitUrl || pushGitUrl
    if (!repoUrl) { setErr('Изберете репозиторио по-долу.'); return }

    setBusy('git'); setErr(null); setProgress(''); setSuccess(null)

    try {
      const files = buildPushFiles({
        pages: activeProject.pages,
        images,
        contentPath: activeProject.contentPath || 'public/content.json',
        imagesPath: activeProject.imagesPath || 'public/images/'
      })

      const result = await pushToGitHub({
        token: githubToken,
        repoUrl,
        branch: activeProject?.branch || pushBranch || 'main',
        files,
        commitMessage: `Studio: update ${projectName} content`,
        onProgress: setProgress
      })

      setSuccess(result)
    } catch (e) {
      setErr(e.message || String(e))
    } finally { setBusy(null) }
  }

  const doGitPull = async () => {
    if (!githubToken) { setErr('Влезте с GitHub за да изтеглите.'); return }
    const repoUrl = activeProject?.gitUrl || pushGitUrl
    if (!repoUrl) { setErr('Проектът няма свързано репо.'); return }
    if (!confirm('Това ще замени локалното съдържание и снимките с версията от GitHub. Продължи?')) return

    setBusy('pull'); setErr(null); setProgress(''); setSuccess(null)

    try {
      const { contentByPageId, imageMap, stats } = await pullProjectFromGitHub({
        token: githubToken,
        gitUrl: repoUrl,
        pages: activeProject.pages,
        contentPath: activeProject.contentPath || 'public/content.json',
        imagesPath: activeProject.imagesPath || 'public/images/',
        branch: activeProject?.branch || pushBranch || 'main',
        onProgress: setProgress
      })
      replaceAllContent({ contentByPageId, imageMap })
      setSuccess({ type: 'pull', ...stats })
    } catch (e) {
      setErr(e.message || String(e))
    } finally { setBusy(null) }
  }

  if (success) {
    const isPull = success.type === 'pull'
    return (
      <div className="modal-backdrop" onClick={onClose}>
        <div className="modal" onClick={e => e.stopPropagation()}>
          <header className="modal-head">
            <h2>{isPull ? 'Изтеглено успешно!' : 'Публикувано успешно!'}</h2>
            <button className="link-btn" onClick={onClose}>✕</button>
          </header>
          <div className="export-success">
            <div className="export-success-icon">✅</div>
            {isPull ? (
              <>
                <p>Заредени <strong>{success.pages}</strong> {success.pages === 1 ? 'страница' : 'страници'} и <strong>{success.images}</strong> {success.images === 1 ? 'снимка' : 'снимки'} от GitHub.</p>
                <p className="export-success-hint">Студиото е синхронизирано с последната версия в репото.</p>
              </>
            ) : (
              <>
                <p>Commit <code>{success.commitSha.slice(0, 7)}</code> е качен в клон <code>{success.branch}</code>.</p>
                <p className="export-success-hint">Vercel ще разгърне новата версия автоматично след няколко секунди.</p>
              </>
            )}
            <div className="row" style={{ justifyContent: 'center' }}>
              {!isPull && (
                <a href={success.repoUrl} target="_blank" rel="noreferrer" className="btn btn-primary-dark">
                  Виж в GitHub ↗
                </a>
              )}
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

        {/* GitHub auth status */}
        <div className="export-auth-row">
          <GitHubConnect />
        </div>

        <div className={`export-options ${isConnected ? (hasGitUrl ? 'export-options-4' : 'export-options-3') : ''}`}>
          {isConnected && hasGitUrl && (
            <button className="export-card" onClick={doGitPull} disabled={busy !== null}>
              <div className="export-icon">⬇️</div>
              <h3>Изтегли от GitHub</h3>
              <p>Синхронизира студиото с последната версия в репото. Заменя локалните промени.</p>
              <strong>{busy === 'pull' ? (progress || 'Изтегляне…') : 'Pull from GitHub ↓'}</strong>
            </button>
          )}
          {isConnected && (
            <button className="export-card export-card-primary" onClick={doGitPush} disabled={busy !== null}>
              <div className="export-icon">🚀</div>
              <h3>Публикувай в GitHub</h3>
              <p>
                {hasGitUrl
                  ? 'Качва всички промени директно в репото. Vercel разгръща автоматично.'
                  : 'Изберете репозиторио по-долу и публикувайте.'}
              </p>
              <strong>{busy === 'git' ? (progress || 'Изпращане…') : 'Push to GitHub →'}</strong>
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

        {/* Repo picker — shown when connected but no repo linked yet */}
        {isConnected && !activeProject?.gitUrl && (
          <div className="export-repo-pick">
            <p className="export-repo-label">
              {pushGitUrl
                ? <>Ще публикувате в: <code>{pushGitUrl.replace('https://github.com/', '').replace('.git', '')}</code></>
                : 'Изберете репозиторио:'}
            </p>
            <RepoPicker currentUrl={pushGitUrl} onSelect={handleRepoSelect} />
          </div>
        )}

        {err && <div className="modal-error">⚠ {err}</div>}
      </div>
    </div>
  )
}
