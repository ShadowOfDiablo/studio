import { useRef, useState } from 'react'
import { useStore } from '../store.jsx'

const MAX_BYTES = 3 * 1024 * 1024 // 3 MB

export default function ImageUploader({ imageId, onChange, compact = false }) {
  const { addImage, removeImage, imageURL } = useStore()
  const inputRef = useRef(null)
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState(null)

  const pickFile = () => inputRef.current?.click()

  const handleFile = async (file) => {
    setErr(null)
    if (!file) return
    if (!file.type.startsWith('image/')) {
      setErr('Файлът трябва да е изображение.')
      return
    }
    if (file.size > MAX_BYTES) {
      setErr(`Файлът е твърде голям (макс ${MAX_BYTES / 1024 / 1024} MB).`)
      return
    }
    setBusy(true)
    try {
      // Replace any existing image bound to this slot
      if (imageId) removeImage(imageId)
      const id = await addImage(file)
      onChange(id)
    } finally {
      setBusy(false)
    }
  }

  const onDrop = (e) => {
    e.preventDefault()
    const f = e.dataTransfer.files?.[0]
    if (f) handleFile(f)
  }

  const url = imageURL(imageId)

  return (
    <div className={`uploader${compact ? ' compact' : ''}`}>
      <div
        className={`uploader-drop${url ? ' has-image' : ''}`}
        onClick={pickFile}
        onDragOver={e => e.preventDefault()}
        onDrop={onDrop}
        role="button"
        tabIndex={0}
      >
        {url
          ? <img src={url} alt="" />
          : <span className="uploader-hint">{busy ? 'Качване…' : 'Кликни или влачи снимка'}</span>}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        style={{ display: 'none' }}
        onChange={e => handleFile(e.target.files?.[0])}
      />
      {imageId && (
        <button className="link-btn danger" onClick={() => { removeImage(imageId); onChange(null) }}>
          Премахни снимка
        </button>
      )}
      {err && <small className="field-error">{err}</small>}
    </div>
  )
}
