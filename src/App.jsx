import { useStore } from './store.jsx'
import ProjectsView from './projects/ProjectsView.jsx'
import StudioView from './StudioView.jsx'

export default function App() {
  const { activeProjectId } = useStore()
  return activeProjectId ? <StudioView /> : <ProjectsView />
}
