import { useStore } from '../store.jsx'
import { Text, Area, Card } from './Fields.jsx'
import IconPicker from './IconPicker.jsx'
import SortableList from './SortableList.jsx'

function uid() { return 'srv_' + Math.random().toString(36).slice(2, 9) }

export default function ServicesPanel() {
  const { content, update } = useStore()
  const services = content.services

  const setField = (i, key) => (v) => update(c => { c.services[i][key] = v })
  const remove = (i) => update(c => c.services.splice(i, 1))
  const add = () => update(c => c.services.push({
    id: uid(), title: 'Нова услуга', desc: 'Описание…', iconKey: 'mower'
  }))
  const reorder = (next) => update(c => { c.services = next })

  return (
    <div className="panel-body">
      <p className="panel-intro">Картичките със услуги. Влачи за пренареждане.</p>
      <SortableList
        items={services}
        getKey={s => s.id || s.title}
        onReorder={reorder}
        renderItem={({ item, index, dragHandleProps }) => (
          <Card
            title={
              <span className="row-head">
                <span className="grip" {...dragHandleProps}>⋮⋮</span>
                Услуга #{index + 1}
              </span>
            }
            onRemove={() => remove(index)}
          >
            <Text label="Заглавие" value={item.title} onChange={setField(index, 'title')} />
            <Area label="Описание" value={item.desc} onChange={setField(index, 'desc')} rows={3} />
            <div className="field-label">Икона</div>
            <IconPicker value={item.iconKey} onChange={setField(index, 'iconKey')} />
          </Card>
        )}
      />
      <button className="btn btn-ghost" onClick={add}>+ Добави услуга</button>
    </div>
  )
}
