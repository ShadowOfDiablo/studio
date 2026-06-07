import { useStore } from '../store.jsx'
import { Row } from './Fields.jsx'

const PRESETS = [
  {
    label: 'Зелено (по подразбиране)',
    theme: {
      primaryDark: '#1f4220', primary: '#2d5a2d', primaryMid: '#4a7c4e',
      primaryLight: '#8bc34a', primarySoft: '#e8f0d8',
      bg: '#f6f1e0', bgAlt: '#ece5cf', text: '#1a2e1a', textSoft: '#4a5a4a',
      accent: '#e8762d'
    }
  },
  {
    label: 'Стомана / Ковано желязо',
    theme: {
      primaryDark: '#1a2533', primary: '#2c3e50', primaryMid: '#3d6080',
      primaryLight: '#5dade2', primarySoft: '#e8f4f8',
      bg: '#ffffff', bgAlt: '#f4f6f8', text: '#2c3e50', textSoft: '#7f8c8d',
      accent: '#c9a84c'
    }
  },
  {
    label: 'Тъмно / Луксозно',
    theme: {
      primaryDark: '#0a0a0a', primary: '#1a1a2e', primaryMid: '#16213e',
      primaryLight: '#e94560', primarySoft: '#2a2a4a',
      bg: '#0f0f1a', bgAlt: '#1a1a2e', text: '#e0e0e0', textSoft: '#a0a0b0',
      accent: '#e94560'
    }
  },
  {
    label: 'Топло / Занаятчийско',
    theme: {
      primaryDark: '#3d1a00', primary: '#8b4513', primaryMid: '#a0522d',
      primaryLight: '#deb887', primarySoft: '#fdf5e6',
      bg: '#fdfaf5', bgAlt: '#f5ede0', text: '#2d1a00', textSoft: '#6b4c2a',
      accent: '#cd853f'
    }
  }
]

function ColorField({ label, value, onChange }) {
  return (
    <label className="field color-field">
      <span className="field-label">{label}</span>
      <div className="color-input-row">
        <input
          type="color"
          value={value || '#000000'}
          onChange={e => onChange(e.target.value)}
          className="color-swatch"
        />
        <input
          type="text"
          value={value || ''}
          onChange={e => onChange(e.target.value)}
          placeholder="#000000"
          className="color-hex"
          maxLength={7}
        />
      </div>
    </label>
  )
}

export default function ThemePanel() {
  const { content, update } = useStore()
  const t = content.theme || {}

  const set = (key) => (v) => update(c => {
    if (!c.theme) c.theme = {}
    c.theme[key] = v
  })

  const applyPreset = (preset) => update(c => { c.theme = { ...preset.theme } })

  return (
    <div className="panel-body">
      <p className="panel-intro">Цветовата схема на сайта. Промените се виждат веднага в прегледа.</p>

      <div className="theme-presets">
        <span className="field-label">Готови теми</span>
        <div className="preset-row">
          {PRESETS.map(p => (
            <button key={p.label} className="preset-btn" onClick={() => applyPreset(p)}>
              <span
                className="preset-swatch"
                style={{ background: `linear-gradient(135deg, ${p.theme.primary} 50%, ${p.theme.accent} 50%)` }}
              />
              {p.label}
            </button>
          ))}
        </div>
      </div>

      <div className="panel-section-title">Основни цветове</div>
      <Row>
        <ColorField label="Тъмен основен" value={t.primaryDark} onChange={set('primaryDark')} />
        <ColorField label="Основен цвят" value={t.primary} onChange={set('primary')} />
      </Row>
      <Row>
        <ColorField label="Среден основен" value={t.primaryMid} onChange={set('primaryMid')} />
        <ColorField label="Светъл основен" value={t.primaryLight} onChange={set('primaryLight')} />
      </Row>
      <Row>
        <ColorField label="Много светъл" value={t.primarySoft} onChange={set('primarySoft')} />
        <ColorField label="Акцент / CTA" value={t.accent} onChange={set('accent')} />
      </Row>

      <div className="panel-section-title">Фон и текст</div>
      <Row>
        <ColorField label="Фон на страницата" value={t.bg} onChange={set('bg')} />
        <ColorField label="Алтернативен фон" value={t.bgAlt} onChange={set('bgAlt')} />
      </Row>
      <Row>
        <ColorField label="Основен текст" value={t.text} onChange={set('text')} />
        <ColorField label="Вторичен текст" value={t.textSoft} onChange={set('textSoft')} />
      </Row>
    </div>
  )
}
