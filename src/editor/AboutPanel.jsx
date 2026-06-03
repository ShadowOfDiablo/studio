import { useStore } from '../store.jsx'
import { Text, Area, Row, Card } from './Fields.jsx'

export default function AboutPanel() {
  const { content, update } = useStore()
  const a = content.about

  return (
    <div className="panel-body">
      <Text label="Малък надпис" value={a.eyebrow} onChange={v => update(c => { c.about.eyebrow = v })} />
      <Text label="Заглавие" value={a.headline} onChange={v => update(c => { c.about.headline = v })} />

      <Card title="Параграфи">
        {a.paragraphs.map((p, i) => (
          <Row key={i}>
            <Area label={`Параграф #${i + 1}`} value={p} rows={3}
              onChange={v => update(c => { c.about.paragraphs[i] = v })} />
            <button className="link-btn danger"
              onClick={() => update(c => c.about.paragraphs.splice(i, 1))}>×</button>
          </Row>
        ))}
        <button className="link-btn"
          onClick={() => update(c => c.about.paragraphs.push('Нов параграф…'))}>
          + добави параграф
        </button>
      </Card>

      <Card title="Точки (с удебелен текст)">
        {a.points.map((pt, i) => (
          <Row key={i}>
            <Text label="Удебелено" value={pt.strong}
              onChange={v => update(c => { c.about.points[i].strong = v })} />
            <Text label="Описание" value={pt.text}
              onChange={v => update(c => { c.about.points[i].text = v })} />
            <button className="link-btn danger"
              onClick={() => update(c => c.about.points.splice(i, 1))}>×</button>
          </Row>
        ))}
        <button className="link-btn"
          onClick={() => update(c => c.about.points.push({ strong: 'Нова точка', text: '…' }))}>
          + добави точка
        </button>
      </Card>

      <Card title="Бутон">
        <Row>
          <Text label="Етикет" value={a.cta.label}
            onChange={v => update(c => { c.about.cta.label = v })} />
          <Text label="Линк" value={a.cta.href}
            onChange={v => update(c => { c.about.cta.href = v })} />
        </Row>
      </Card>

      <Card title="Статистики">
        {a.stats.map((s, i) => (
          <Row key={i}>
            <Text label="Число" value={s.num}
              onChange={v => update(c => { c.about.stats[i].num = v })} />
            <Text label="Етикет" value={s.label}
              onChange={v => update(c => { c.about.stats[i].label = v })} />
            <button className="link-btn danger"
              onClick={() => update(c => c.about.stats.splice(i, 1))}>×</button>
          </Row>
        ))}
        <button className="link-btn"
          onClick={() => update(c => c.about.stats.push({ num: '0', label: 'Етикет' }))}>
          + добави статистика
        </button>
      </Card>
    </div>
  )
}
