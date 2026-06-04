import { createContext, useContext, useMemo, useState } from 'react'

const ChatWidgetContext = createContext(null)

export const ChatWidgetProvider = ({ children }) => {
  const [isChatOpen, setIsChatOpen] = useState(false)
  const [isChatExpanded, setIsChatExpanded] = useState(false)

  const openChat = () => setIsChatOpen(true)
  const closeChat = () => {
    setIsChatOpen(false)
    setIsChatExpanded(false)
  }
  const toggleChat = () => setIsChatOpen((prev) => !prev)
  const toggleExpandChat = () => setIsChatExpanded((prev) => !prev)

  const value = useMemo(
    () => ({
      isChatOpen,
      isChatExpanded,
      openChat,
      closeChat,
      toggleChat,
      toggleExpandChat,
      setIsChatOpen,
      setIsChatExpanded,
    }),
    [isChatOpen, isChatExpanded]
  )

  return <ChatWidgetContext.Provider value={value}>{children}</ChatWidgetContext.Provider>
}

export const useChatWidget = () => {
  const context = useContext(ChatWidgetContext)

  if (!context) {
    throw new Error('useChatWidget must be used within ChatWidgetProvider')
  }

  return context
}