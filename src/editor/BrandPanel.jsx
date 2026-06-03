import { useStore } from '../store.jsx'
import { Text, Row } from './Fields.jsx'

export default function BrandPanel() {
  const { content, update } = useStore()
  const b = content.brand

  const set = (key) => (v) => update(c => { c.brand[key] = v })
  const setPhone = (v) => update(c => {
    c.brand.phone = v
    c.brand.phoneHref = 'tel:' + v.replace(/\s+/g, '')
  })

  return (
    <div className="panel-body">
      <p className="panel-intro">Името и контактите на бранда. Появяват се в логото, хедъра, контактите и футъра.</p>
      <Row>
        <Text label="Име на бранда" value={b.name} onChange={set('name')} />
        <Text label="Слоган (под логото)" value={b.tagline} onChange={set('tagline')} />
      </Row>
      <Row>
        <Text label="Телефон" value={b.phone} onChange={setPhone} placeholder="0877 092 322" />
        <Text label="Имейл" value={b.email} onChange={set('email')} placeholder="example@abv.bg" />
      </Row>
      <Row>
        <Text label="Зона на работа" value={b.area} onChange={set('area')} />
        <Text label="Работно време" value={b.hours} onChange={set('hours')} />
      </Row>
    </div>
  )
}
