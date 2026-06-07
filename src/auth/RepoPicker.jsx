import { useState, useEffect } from 'react'
import { useStore } from '../store.jsx'
import { fetchUserRepos, createRepo } from './github.js'

export default function RepoPicker({ currentUrl, onSelect }) {
  const { githubToken } = useStore()
  const [repos, setRepos] = useState(null) // null = not loaded
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [search, setSearch] = useState('')
  const [creating, setCreating] = useState(false)
  const [newName, setNewName] = useState('')
  const [newPrivate, setNewPrivate] = useState(false)
  const [createErr, setCreateErr] = useState(null)
  const [showCreate, setShowCreate] = useState(false)

  useEffect(() => {
    if (!githubToken || repos !== null) return
    setLoading(true)
    fetchUserRepos(githubToken)
      .then(setRepos)
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }, [githubToken]) // eslint-disable-line react-hooks/exhaustive-deps

  async function handleCreate(e) {
    e.preventDefault()
    if (!newName.trim()) return
    setCreating(true); setCreateErr(null)
    try {
      const { cloneUrl, defaultBranch } = await createRepo(githubToken, {
        name: newName.trim(),
        isPrivate: newPrivate,
        description: 'Created with Gradinko Studio'
      })
      onSelect({ url: cloneUrl, branch: defaultBranch })
      // Add to list
      setRepos(prev => [{ id: Date.now(), full_name: newName, clone_url: cloneUrl, default_branch: defaultBranch, private: newPrivate }, ...(prev || [])])
      setShowCreate(false)
      setNewName('')
    } catch (e) {
      setCreateErr(e.message)
    } finally {
      setCreating(false)
    }
  }

  const filtered = (repos || []).filter(r =>
    r.full_name.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="repo-picker">
      <div className="repo-picker-head">
        <input
          className="repo-search"
          placeholder="🔍 Търси репозиторио…"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        <button
          type="button"
          className={`repo-create-toggle${showCreate ? ' active' : ''}`}
          onClick={() => setShowCreate(v => !v)}
          title="Ново репо"
        >
          + Ново
        </button>
      </div>

      {showCreate && (
        <form className="repo-create-form" onSubmit={handleCreate}>
          <input
            autoFocus
            value={newName}
            onChange={e => setNewName(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
            placeholder="my-website"
            required
          />
          <label className="checkbox-label small">
            <input type="checkbox" checked={newPrivate} onChange={e => setNewPrivate(e.target.checked)} />
            Частно
          </label>
          <button className="btn btn-primary-dark btn-sm" type="submit" disabled={creating}>
            {creating ? 'Създаване…' : 'Създай'}
          </button>
          {createErr && <div className="create-err">⚠ {createErr}</div>}
        </form>
      )}

      {loading && <p className="field-hint" style={{ padding: '0.5rem' }}>Зарежда репозитории…</p>}
      {error && <div className="create-err" style={{ margin: '0.5rem' }}>⚠ {error}</div>}

      {!loading && repos !== null && (
        <div className="repo-list">
          {filtered.length === 0 && (
            <p className="field-hint" style={{ padding: '0.5rem 0.75rem' }}>
              {search ? 'Нищо не е намерено.' : 'Нямате репозитории.'}
            </p>
          )}
          {filtered.map(repo => (
            <button
              key={repo.id}
              type="button"
              className={`repo-item${currentUrl === repo.clone_url ? ' selected' : ''}`}
              onClick={() => onSelect({ url: repo.clone_url, branch: repo.default_branch || 'main' })}
            >
              <span className="repo-priv">{repo.private ? '🔒' : '📦'}</span>
              <span className="repo-name">{repo.full_name}</span>
              {currentUrl === repo.clone_url && <span className="repo-check">✓</span>}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
