import { useStore } from '../store.jsx'
import { Text, Area, Row, Card } from './Fields.jsx'

export default function FooterPanel() {
  const { content, update } = useStore()
  const f = content.footer

  const setLinkField = (which, i, key) => (v) => update(c => { c.footer[which][i][key] = v })
  const removeLink = (which, i) => update(c => c.footer[which].splice(i, 1))
  const addLink = (which) => update(c => c.footer[which].push({ label: 'Нов линк', href: '#' }))

  return (
    <div className="panel-body">
      <Area label="Кратко описание (под логото)" rows={2}
        value={f.description}
        onChange={v => update(c => { c.footer.description = v })} />

      <Card title="Линкове към услугите">
        {f.serviceLinks.map((l, i) => (
          <Row key={i}>
            <Text label="Етикет" value={l.label} onChange={setLinkField('serviceLinks', i, 'label')} />
            <Text label="Линк" value={l.href} onChange={setLinkField('serviceLinks', i, 'href')} />
            <button className="link-btn danger" onClick={() => removeLink('serviceLinks', i)}>×</button>
          </Row>
        ))}
        <button className="link-btn" onClick={() => addLink('serviceLinks')}>+ добави</button>
      </Card>

      <Card title="Бързи връзки">
        {f.quickLinks.map((l, i) => (
          <Row key={i}>
            <Text label="Етикет" value={l.label} onChange={setLinkField('quickLinks', i, 'label')} />
            <Text label="Линк" value={l.href} onChange={setLinkField('quickLinks', i, 'href')} />
            <button className="link-btn danger" onClick={() => removeLink('quickLinks', i)}>×</button>
          </Row>
        ))}
        <button className="link-btn" onClick={() => addLink('quickLinks')}>+ добави</button>
      </Card>

      <Text label="Copyright текст ({year} се заменя автоматично)" value={f.copyright}
        onChange={v => update(c => { c.footer.copyright = v })} />
      <Text label="Финален ред (под copyright)" value={f.tagline}
        onChange={v => update(c => { c.footer.tagline = v })} />
    </div>
  )
}
