import { Icon, iconKeys } from '../../../gradinko/src/icons.jsx'

const LABELS = {
  mower: 'Косачка',
  hedge: 'Жив плет',
  rake: 'Гребло',
  clock: 'Часовник'
}

export default function IconPicker({ value, onChange }) {
  return (
    <div className="icon-picker">
      {iconKeys.map(k => (
        <button
          key={k}
          type="button"
          className={`icon-option${value === k ? ' active' : ''}`}
          onClick={() => onChange(k)}
          aria-label={LABELS[k]}
        >
          <Icon name={k} />
          <span>{LABELS[k]}</span>
        </button>
      ))}
    </div>
  )
}
