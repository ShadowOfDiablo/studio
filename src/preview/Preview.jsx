import { useEffect, useRef, useState } from 'react'
import { useStore } from '../store.jsx'
import { withImageURLs } from './serialize.js'

export default function Preview() {
  const { content, imageURL } = useStore()
  const iframeRef = useRef(null)
  const [ready, setReady] = useState(false)

  // Wait for the template to signal ready before pushing content
  useEffect(() => {
    const onMessage = (e) => {
      if (e.data && e.data.type === 'gradinko-ready') {
        setReady(true)
      }
    }
    window.addEventListener('message', onMessage)
    return () => window.removeEventListener('message', onMessage)
  }, [])

  // Push content to iframe on every change (once ready)
  useEffect(() => {
    if (!ready) return
    const iframe = iframeRef.current
    if (!iframe?.contentWindow) return
    const payload = withImageURLs(content, imageURL)
    iframe.contentWindow.postMessage({ type: 'gradinko-content', content: payload }, '*')
  }, [content, ready, imageURL])

  return (
    <iframe
      ref={iframeRef}
      className="preview-frame"
      src="./template/index.html"
      title="Preview"
    />
  )
}
