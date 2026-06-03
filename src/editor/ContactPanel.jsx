import { useStore } from '../store.jsx'
import { Text } from './Fields.jsx'

export default function ContactPanel() {
  const { content, update } = useStore()
  const c = content.contact

  return (
    <div className="panel-body">
      <p className="panel-intro">
        Телефонът и имейлът идват от секция „Бранд“. Тук променете само заглавието и подзаглавието на секцията.
      </p>
      <Text label="Заглавие" value={c.title}
        onChange={v => update(ctx => { ctx.contact.title = v })} />
      <Text label="Подзаглавие" value={c.subtitle}
        onChange={v => update(ctx => { ctx.contact.subtitle = v })} />
      <Text label="FormSubmit endpoint (за специалисти)"
        value={c.formEndpoint}
        onChange={v => update(ctx => { ctx.contact.formEndpoint = v })} />
    </div>
  )
}
