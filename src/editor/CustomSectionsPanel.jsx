import { useStore } from '../store.jsx'
import { Text, Area, Card, Row } from './Fields.jsx'
import ImageUploader from './ImageUploader.jsx'
import SortableList from './SortableList.jsx'

function uid(p = 's') { return p + '_' + Math.random().toString(36).slice(2, 9) }

export default function CustomSectionsPanel() {
  const { content, update } = useStore()
  const sections = content.customSections || []

  const setField = (i, key) => (v) => update(c => { c.customSections[i][key] = v })
  const removeSection = (i) => update(c => c.customSections.splice(i, 1))
  const addSection = () => update(c => {
    c.customSections = c.customSections || []
    c.customSections.push({ id: uid('sec'), title: 'Нова секция', text: '', images: [] })
  })
  const reorder = (next) => update(c => { c.customSections = next })

  const addImage = (sIdx) => update(c => {
    c.customSections[sIdx].images = c.customSections[sIdx].images || []
    c.customSections[sIdx].images.push({ id: uid('img'), imageId: null, caption: '' })
  })
  const setSectionImage = (sIdx, iIdx, field) => (v) => update(c => {
    c.customSections[sIdx].images[iIdx][field] = v
  })
  const removeImage = (sIdx, iIdx) => update(c => {
    c.customSections[sIdx].images.splice(iIdx, 1)
  })

  return (
    <div className="panel-body">
      <p className="panel-intro">
        Свои секции — например „Промоции“, „Често задавани въпроси“ или конкретен пакет услуги.
        Появяват се между Галерия и Контакти.
      </p>

      <SortableList
        items={sections}
        getKey={s => s.id}
        onReorder={reorder}
        renderItem={({ item, index, dragHandleProps }) => (
          <Card
            title={
              <span className="row-head">
                <span className="grip" {...dragHandleProps}>⋮⋮</span>
                Секция #{index + 1}
              </span>
            }
            onRemove={() => removeSection(index)}
          >
            <Text label="Заглавие" value={item.title} onChange={setField(index, 'title')} />
            <Area label="Текст (празен ред = нов параграф)" rows={4}
              value={item.text || ''} onChange={setField(index, 'text')} />

            <div className="field-label">Снимки (по избор)</div>
            {(item.images || []).map((img, iIdx) => (
              <Row key={img.id || iIdx}>
                <div style={{ width: '8rem' }}>
                  <ImageUploader
                    compact
                    imageId={img.imageId}
                    onChange={setSectionImage(index, iIdx, 'imageId')}
                  />
                </div>
                <Text label="Подпис (по избор)" value={img.caption || ''}
                  onChange={setSectionImage(index, iIdx, 'caption')} />
                <button className="link-btn danger" onClick={() => removeImage(index, iIdx)}>×</button>
              </Row>
            ))}
            <button className="link-btn" onClick={() => addImage(index)}>+ добави снимка</button>
          </Card>
        )}
      />

      <button className="btn btn-primary" onClick={addSection}>+ Нова секция</button>
    </div>
  )
}
