import { useStore } from '../store.jsx'
import { Text, Area, Row, Card } from './Fields.jsx'

export default function HeroPanel() {
  const { content, update } = useStore()
  const h = content.hero
  const set = (k) => (v) => update(c => { c.hero[k] = v })
  const setCta = (which, k) => (v) => update(c => { c.hero[which][k] = v })

  const addBullet = () => update(c => c.hero.bullets.push('Ново предимство'))
  const setBullet = (i) => (v) => update(c => { c.hero.bullets[i] = v })
  const removeBullet = (i) => update(c => c.hero.bullets.splice(i, 1))

  return (
    <div className="panel-body">
      <p className="panel-intro">Първото нещо, което вижда посетителят.</p>
      <Text label="Малък надпис (eyebrow)" value={h.eyebrow} onChange={set('eyebrow')} />
      <Text label="Заглавие" value={h.headline} onChange={set('headline')} />
      <Area label="Описание" value={h.paragraph} onChange={set('paragraph')} rows={3} />

      <Card title="Основен бутон">
        <Row>
          <Text label="Етикет" value={h.ctaPrimary.label} onChange={setCta('ctaPrimary', 'label')} />
          <Text label="Линк (напр. #contact)" value={h.ctaPrimary.href} onChange={setCta('ctaPrimary', 'href')} />
        </Row>
      </Card>
      <Card title="Вторичен бутон">
        <Row>
          <Text label="Етикет" value={h.ctaSecondary.label} onChange={setCta('ctaSecondary', 'label')} />
          <Text label="Линк" value={h.ctaSecondary.href} onChange={setCta('ctaSecondary', 'href')} />
        </Row>
      </Card>

      <Card title="Предимства (булети)">
        {h.bullets.map((b, i) => (
          <Row key={i}>
            <Text label={`#${i + 1}`} value={b} onChange={setBullet(i)} />
            <button className="link-btn danger" onClick={() => removeBullet(i)}>×</button>
          </Row>
        ))}
        <button className="link-btn" onClick={addBullet}>+ добави</button>
      </Card>
    </div>
  )
}
