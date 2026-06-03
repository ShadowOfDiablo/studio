import { useStore } from '../store.jsx'
import { Text, Card } from './Fields.jsx'
import ImageUploader from './ImageUploader.jsx'
import SortableList from './SortableList.jsx'

function uid() { return 'g_' + Math.random().toString(36).slice(2, 9) }

export default function GalleryPanel() {
  const { content, update } = useStore()
  const g = content.gallery

  const setItemField = (i, key) => (v) => update(c => { c.gallery.items[i][key] = v })
  const setItemImage = (i) => (imageId) => update(c => { c.gallery.items[i].imageId = imageId })
  const removeItem = (i) => update(c => c.gallery.items.splice(i, 1))
  const addItem = () => update(c => c.gallery.items.push({
    id: uid(), title: 'Нов проект', tag: '', price: '', hue: 100
  }))
  const reorder = (next) => update(c => { c.gallery.items = next })

  return (
    <div className="panel-body">
      <Card title="Заглавие на секцията">
        <Text label="Заглавие" value={g.title}
          onChange={v => update(c => { c.gallery.title = v })} />
        <Text label="Подзаглавие" value={g.subtitle}
          onChange={v => update(c => { c.gallery.subtitle = v })} />
      </Card>

      <p className="panel-intro">
        Качи снимки на ваши проекти. Цената е по избор — оставете празно за да не се показва.
        Влачи реда за пренареждане.
      </p>

      <SortableList
        items={g.items}
        getKey={it => it.id || it.title}
        onReorder={reorder}
        renderItem={({ item, index, dragHandleProps }) => (
          <Card
            title={
              <span className="row-head">
                <span className="grip" {...dragHandleProps}>⋮⋮</span>
                Снимка #{index + 1}
              </span>
            }
            onRemove={() => removeItem(index)}
          >
            <div className="gallery-row">
              <div className="gallery-row-image">
                <ImageUploader
                  imageId={item.imageId}
                  onChange={setItemImage(index)}
                />
              </div>
              <div className="gallery-row-fields">
                <Text label="Име" value={item.title} onChange={setItemField(index, 'title')} />
                <Text label="Цена (по избор)" value={item.price || ''}
                  onChange={setItemField(index, 'price')} placeholder="напр. 80 лв." />
                <Text label="Етикет (по избор)" value={item.tag || ''}
                  onChange={setItemField(index, 'tag')} placeholder="напр. Косене" />
              </div>
            </div>
          </Card>
        )}
      />

      <button className="btn btn-primary" onClick={addItem}>+ Добави снимка</button>
    </div>
  )
}
