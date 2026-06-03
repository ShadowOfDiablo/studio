import { useStore } from '../store.jsx'
import { Text, Card } from './Fields.jsx'
import SortableList from './SortableList.jsx'

function uid(p = 'fc') { return p + '_' + Math.random().toString(36).slice(2, 9) }

export default function FreeCodePanel() {
  const { content, update } = useStore()
  const blocks = content.freeCode || []

  const setField = (i, key) => (v) => update(c => {
    if (!c.freeCode) c.freeCode = []
    c.freeCode[i][key] = v
  })
  const removeBlock = (i) => update(c => c.freeCode.splice(i, 1))
  const addBlock = () => update(c => {
    if (!c.freeCode) c.freeCode = []
    c.freeCode.push({ id: uid(), label: 'Нов блок', html: '', css: '', js: '' })
  })
  const reorder = (next) => update(c => { c.freeCode = next })

  return (
    <div className="panel-body">
      <p className="panel-intro">
        Свободни блокове — пишете HTML, CSS и JavaScript директно.
        Блоковете се показват преди секцията „Контакти".
        Предназначени за програмисти и напреднали потребители.
      </p>

      {blocks.length === 0 && (
        <div className="free-code-empty">
          <div className="free-code-empty-icon">{'</>'}</div>
          <p>Нямате свободни блокове.<br />Добавете първия за да вградите собствен код.</p>
        </div>
      )}

      <SortableList
        items={blocks}
        getKey={b => b.id}
        onReorder={reorder}
        renderItem={({ item, index, dragHandleProps }) => (
          <Card
            title={
              <span className="row-head">
                <span className="grip" {...dragHandleProps}>⋮⋮</span>
                {item.label || `Блок #${index + 1}`}
              </span>
            }
            onRemove={() => removeBlock(index)}
          >
            <Text label="Название (само за студиото)" value={item.label || ''} onChange={setField(index, 'label')} />

            <label className="field">
              <span className="field-label">HTML</span>
              <textarea
                className="code-textarea"
                rows={6}
                spellCheck={false}
                value={item.html || ''}
                onChange={e => setField(index, 'html')(e.target.value)}
                placeholder={'<div class="my-widget">\n  <h2>Заглавие</h2>\n</div>'}
              />
            </label>

            <label className="field">
              <span className="field-label">CSS <span className="field-hint-inline">(по избор)</span></span>
              <textarea
                className="code-textarea"
                rows={4}
                spellCheck={false}
                value={item.css || ''}
                onChange={e => setField(index, 'css')(e.target.value)}
                placeholder={'.my-widget {\n  padding: 2rem;\n  background: #f0f0f0;\n}'}
              />
            </label>

            <label className="field">
              <span className="field-label">JavaScript <span className="field-hint-inline">(по избор)</span></span>
              <textarea
                className="code-textarea"
                rows={4}
                spellCheck={false}
                value={item.js || ''}
                onChange={e => setField(index, 'js')(e.target.value)}
                placeholder={'// container = коренния DOM елемент на блока\nconsole.log("Блокът е зареден!")'}
              />
              <small className="field-hint">
                Функцията получава <code>container</code> — DOM елементът на блока.
              </small>
            </label>
          </Card>
        )}
      />

      <button className="btn btn-primary" onClick={addBlock}>+ Нов свободен блок</button>
    </div>
  )
}
