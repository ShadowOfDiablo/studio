import { useState, useEffect, useRef } from 'react'
import { useStore } from '../store.jsx'
import { fetchContentFromGitHub } from './importFromGithub.js'
import { checkOllama, generateContent } from './aiRecreate.js'

export default function ImportDialog({ onClose }) {
  const { activeProject, githubToken, importContent } = useStore()
  const [mode, setMode] = useState('github')

  // GitHub import
  const [fetching, setFetching] = useState(false)
  const [fetchErr, setFetchErr] = useState(null)
  const [preview, setPreview] = useState(null)

  // AI recreate
  const [ollamaStatus, setOllamaStatus] = useState(null)
  const [selectedModel, setSelectedModel] = useState('')
  const [sourceText, setSourceText] = useState('')
  const [generating, setGenerating] = useState(false)
  const [genChars, setGenChars] = useState(0)
  const [genErr, setGenErr] = useState(null)
  const [aiPreview, setAiPreview] = useState(null)
  const [loadingSource, setLoadingSource] = useState(false)
  const abortRef = useRef(null)

  const hasGitUrl = !!activeProject?.gitUrl

  useEffect(() => {
    if (mode === 'ai' && ollamaStatus === null) {
      checkOllama().then(s => {
        setOllamaStatus(s)
        if (s.models.length) setSelectedModel(s.models[0])
      })
    }
  }, [mode, ollamaStatus])

  async function handleGitHubFetch() {
    setFetching(true); setFetchErr(null); setPreview(null)
    try {
      const content = await fetchContentFromGitHub({
        token: githubToken,
        gitUrl: activeProject.gitUrl,
        contentPath: activeProject.contentPath || 'public/content.json',
        branch: activeProject.branch || 'main'
      })
      setPreview(content)
    } catch (e) {
      setFetchErr(e.message)
    } finally {
      setFetching(false)
    }
  }

  async function handleLoadSource() {
    setLoadingSource(true); setGenErr(null)
    try {
      const content = await fetchContentFromGitHub({
        token: githubToken,
        gitUrl: activeProject.gitUrl,
        contentPath: activeProject.contentPath || 'public/content.json',
        branch: activeProject.branch || 'main'
      })
      setSourceText(JSON.stringify(content, null, 2))
    } catch (e) {
      setGenErr(e.message)
    } finally {
      setLoadingSource(false)
    }
  }

  async function handleGenerate() {
    if (!sourceText.trim()) { setGenErr('Въведете или заредете изходно съдържание.'); return }
    if (!selectedModel) { setGenErr('Изберете модел.'); return }
    const ctrl = new AbortController()
    abortRef.current = ctrl
    setGenerating(true); setGenErr(null); setAiPreview(null); setGenChars(0)
    try {
      const result = await generateContent({
        model: selectedModel,
        sourceContent: sourceText,
        onChunk: text => setGenChars(text.length),
        signal: ctrl.signal
      })
      setAiPreview(result)
    } catch (e) {
      if (e.name !== 'AbortError') setGenErr(e.message)
    } finally {
      setGenerating(false)
      abortRef.current = null
    }
  }

  function applyAndClose(content) {
    importContent(content)
    onClose()
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal modal-wide" onClick={e => e.stopPropagation()}>
        <header className="modal-head">
          <h2>Импортиране · {activeProject?.name}</h2>
          <button className="link-btn" onClick={onClose}>✕</button>
        </header>

        <div className="import-tabs">
          <button
            className={`import-tab${mode === 'github' ? ' active' : ''}`}
            onClick={() => { setMode('github'); setPreview(null); setFetchErr(null) }}
          >
            📥 Импорт от GitHub
          </button>
          <button
            className={`import-tab${mode === 'ai' ? ' active' : ''}`}
            onClick={() => setMode('ai')}
          >
            🤖 Пресъздай с AI
          </button>
        </div>

        {/* ── GitHub import ── */}
        {mode === 'github' && (
          <div className="import-panel">
            {!hasGitUrl ? (
              <p className="import-hint">
                Проектът няма свързано GitHub репо.
                Добавете URL в <strong>Настройки на проекта</strong>.
              </p>
            ) : preview ? (
              <div className="import-preview">
                <p className="import-preview-label">
                  Намерено съдържание от <code>{activeProject.gitUrl}</code>:
                </p>
                <pre className="import-json-preview">
                  {JSON.stringify(preview, null, 2).slice(0, 900)}
                  {JSON.stringify(preview, null, 2).length > 900 ? '\n…' : ''}
                </pre>
                <div className="row">
                  <button className="btn btn-primary-dark" onClick={() => applyAndClose(preview)}>
                    ✓ Зареди в студиото
                  </button>
                  <button className="btn btn-outline" onClick={() => setPreview(null)}>Назад</button>
                </div>
              </div>
            ) : (
              <div className="import-github-body">
                <p>
                  Ще изтегли{' '}
                  <code>{activeProject.contentPath || 'public/content.json'}</code>{' '}
                  от репото и ще го зареди в текущата страница.
                </p>
                <p className="import-hint">
                  Полезно когато сте редактирали файловете директно в GitHub и искате да
                  синхронизирате студиото с последната версия.
                </p>
                {fetchErr && <div className="modal-error">⚠ {fetchErr}</div>}
                <button
                  className="btn btn-primary-dark"
                  onClick={handleGitHubFetch}
                  disabled={fetching}
                  style={{ alignSelf: 'flex-start' }}
                >
                  {fetching ? 'Изтегляне…' : '📥 Изтегли от GitHub'}
                </button>
              </div>
            )}
          </div>
        )}

        {/* ── AI recreate ── */}
        {mode === 'ai' && (
          <div className="import-panel">
            {ollamaStatus === null && (
              <p className="import-hint">Проверка за Ollama…</p>
            )}

            {ollamaStatus !== null && !ollamaStatus.available && (
              <div className="ollama-setup">
                <p>
                  <strong>Ollama не е открита</strong> на{' '}
                  <code>localhost:11434</code>.
                </p>
                <p>Инсталирайте я безплатно и изберете модел:</p>
                <pre className="ollama-cmd">{`# 1. Изтеглете Ollama от https://ollama.com
# 2. Отворете терминал и изпълнете:
ollama pull gemma3
# (или llama3.2, mistral, и др.)

# 3. Стартирайте:
ollama serve`}</pre>
                <button
                  className="btn btn-outline"
                  onClick={() => {
                    setOllamaStatus(null)
                    checkOllama().then(s => {
                      setOllamaStatus(s)
                      if (s.models.length) setSelectedModel(s.models[0])
                    })
                  }}
                >
                  Провери отново
                </button>
              </div>
            )}

            {ollamaStatus?.available && (
              aiPreview ? (
                <div className="import-preview">
                  <p className="import-preview-label">AI генерира ново съдържание:</p>
                  <pre className="import-json-preview">
                    {JSON.stringify(aiPreview, null, 2).slice(0, 900)}
                    {JSON.stringify(aiPreview, null, 2).length > 900 ? '\n…' : ''}
                  </pre>
                  <div className="row">
                    <button className="btn btn-primary-dark" onClick={() => applyAndClose(aiPreview)}>
                      ✓ Приложи резултата
                    </button>
                    <button
                      className="btn btn-outline"
                      onClick={() => { setAiPreview(null); setGenChars(0) }}
                    >
                      Генерирай отново
                    </button>
                  </div>
                </div>
              ) : (
                <div className="ai-body">
                  <div className="field">
                    <label className="field-label">Модел</label>
                    <select
                      value={selectedModel}
                      onChange={e => setSelectedModel(e.target.value)}
                      className="ai-model-select"
                    >
                      {ollamaStatus.models.map(m => (
                        <option key={m} value={m}>{m}</option>
                      ))}
                    </select>
                    <small className="field-hint">
                      Препоръчва се <strong>gemma3</strong> или <strong>llama3.2</strong>.
                    </small>
                  </div>

                  <div className="field">
                    <label className="field-label">Изходно съдържание</label>
                    {hasGitUrl && (
                      <button
                        type="button"
                        className="btn btn-outline"
                        style={{ alignSelf: 'flex-start', marginBottom: '0.5rem', fontSize: '0.8rem', padding: '0.35rem 0.75rem' }}
                        onClick={handleLoadSource}
                        disabled={loadingSource}
                      >
                        {loadingSource ? 'Зареждане…' : '↓ Зареди текущото от GitHub'}
                      </button>
                    )}
                    <textarea
                      rows={9}
                      value={sourceText}
                      onChange={e => setSourceText(e.target.value)}
                      placeholder={
                        hasGitUrl
                          ? 'Натиснете бутона по-горе за да заредите от GitHub, или поставете HTML / текст от стария сайт…'
                          : 'Поставете HTML, текст или JSON от стария си сайт…'
                      }
                      className="import-textarea"
                    />
                    <small className="field-hint">
                      AI ще прочете това и ще генерира ново content.json по структурата на студиото.
                    </small>
                  </div>

                  {generating && (
                    <div className="gen-progress">
                      <span className="gen-dot" />
                      Генерира… {genChars > 0 ? `(${genChars} символа)` : ''}
                      <button className="link-btn" style={{ marginLeft: 'auto' }} onClick={() => abortRef.current?.abort()}>
                        Спри
                      </button>
                    </div>
                  )}

                  {genErr && <div className="modal-error">⚠ {genErr}</div>}

                  <button
                    className="btn btn-primary-dark"
                    onClick={handleGenerate}
                    disabled={generating || !sourceText.trim()}
                    style={{ alignSelf: 'flex-start' }}
                  >
                    {generating ? 'Генерира…' : '🤖 Пресъздай с AI'}
                  </button>
                </div>
              )
            )}
          </div>
        )}
      </div>
    </div>
  )
}
