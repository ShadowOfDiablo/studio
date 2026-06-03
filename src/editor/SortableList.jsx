import { useState } from 'react'

// Generic native drag-and-drop list. No external dep.
// children receives ({ item, index, dragHandleProps }) and renders each row.
export default function SortableList({ items, onReorder, getKey, renderItem }) {
  const [dragIndex, setDragIndex] = useState(null)
  const [overIndex, setOverIndex] = useState(null)

  const handleDragStart = (i) => (e) => {
    setDragIndex(i)
    e.dataTransfer.effectAllowed = 'move'
    // Firefox needs data set or the drag won't start
    try { e.dataTransfer.setData('text/plain', String(i)) } catch {}
  }
  const handleDragOver = (i) => (e) => {
    e.preventDefault()
    if (overIndex !== i) setOverIndex(i)
  }
  const handleDrop = (i) => (e) => {
    e.preventDefault()
    if (dragIndex == null || dragIndex === i) {
      setDragIndex(null); setOverIndex(null); return
    }
    const next = items.slice()
    const [moved] = next.splice(dragIndex, 1)
    next.splice(i, 0, moved)
    onReorder(next)
    setDragIndex(null); setOverIndex(null)
  }
  const handleDragEnd = () => { setDragIndex(null); setOverIndex(null) }

  return (
    <ul className="sortable">
      {items.map((item, i) => (
        <li
          key={getKey(item, i)}
          className={`sortable-row${overIndex === i ? ' over' : ''}${dragIndex === i ? ' dragging' : ''}`}
          onDragOver={handleDragOver(i)}
          onDrop={handleDrop(i)}
        >
          {renderItem({
            item,
            index: i,
            dragHandleProps: {
              draggable: true,
              onDragStart: handleDragStart(i),
              onDragEnd: handleDragEnd,
              title: 'Влачи за пренареждане'
            }
          })}
        </li>
      ))}
    </ul>
  )
}
