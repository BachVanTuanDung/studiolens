import AppRoutes from './routes/AppRoutes'
import { ChatWidgetProvider } from './context/ChatWidgetContext'

function App() {
  return (
    <ChatWidgetProvider>
      <AppRoutes />
    </ChatWidgetProvider>
  )
}

export default App