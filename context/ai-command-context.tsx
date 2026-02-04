"use client"

import * as React from "react"
import { useChat } from "@ai-sdk/react"
import { DefaultChatTransport, type UIMessage } from "ai"

export type AICommandMode = "command" | "chat"

export type AICommandStatus = "idle" | "submitted" | "streaming" | "error"

export interface AICommandContextValue {
  mode: AICommandMode
  setMode: (mode: AICommandMode) => void
  inputValue: string
  setInputValue: (value: string) => void
  chatEndpoint: string | null
  status: AICommandStatus
  error: Error | null
  switchToChat: (initialQuery?: string) => void
  switchToCommand: () => void
  // Chat
  messages: UIMessage[]
  sendMessage: (content: string) => Promise<void>
  isLoading: boolean
  isEnabled: boolean
}

const AICommandContext = React.createContext<AICommandContextValue | null>(null)

export interface AICommandProviderProps {
  children: React.ReactNode
  chatEndpoint?: string | null
  onModeChange?: (mode: AICommandMode) => void
}

export function AICommandProvider({
  children,
  chatEndpoint = null,
  onModeChange,
}: AICommandProviderProps) {
  const [mode, setModeInternal] = React.useState<AICommandMode>("command")
  const [inputValue, setInputValue] = React.useState("")
  const [status, setStatus] = React.useState<AICommandStatus>("idle")
  const [error, setError] = React.useState<Error | null>(null)

  const transport = React.useMemo(() => {
    if (!chatEndpoint) return undefined
    return new DefaultChatTransport({ api: chatEndpoint })
  }, [chatEndpoint])

  const chat = useChat(
    transport
      ? {
          transport,
          onError: (err: Error) => {
            setStatus("error")
            setError(err)
          },
        }
      : {}
  )

  // Sync status from useChat
  React.useEffect(() => {
    const hookStatus = chat.status
    if (hookStatus === "streaming") {
      setStatus("streaming")
    } else if (hookStatus === "submitted") {
      setStatus("submitted")
    } else if (hookStatus === "error") {
      setStatus("error")
    } else if (hookStatus === "ready") {
      setStatus("idle")
    }
  }, [chat.status])

  const setMode = React.useCallback(
    (newMode: AICommandMode) => {
      setModeInternal(newMode)
      onModeChange?.(newMode)
    },
    [onModeChange]
  )

  const switchToChat = React.useCallback(
    (initialQuery?: string) => {
      if (!chatEndpoint) return
      setMode("chat")
      if (initialQuery) {
        setInputValue(initialQuery)
      }
    },
    [chatEndpoint, setMode]
  )

  const switchToCommand = React.useCallback(() => {
    setMode("command")
    setInputValue("")
    setStatus("idle")
    setError(null)
  }, [setMode])

  const sendMessage = React.useCallback(
    async (content: string) => {
      if (!transport || !content.trim()) return
      setStatus("submitted")
      setInputValue("")
      await chat.sendMessage({ text: content.trim() })
    },
    [chat, transport]
  )

  const emptyMessages: UIMessage[] = []
  const isLoading = status === "submitted" || status === "streaming"

  const value = React.useMemo(
    () => ({
      mode,
      setMode,
      inputValue,
      setInputValue,
      chatEndpoint,
      status,
      error,
      switchToChat,
      switchToCommand,
      messages: chat.messages ?? emptyMessages,
      sendMessage,
      isLoading,
      isEnabled: Boolean(chatEndpoint),
    }),
    [
      mode,
      setMode,
      inputValue,
      chatEndpoint,
      status,
      error,
      switchToChat,
      switchToCommand,
      chat.messages,
      sendMessage,
      isLoading,
    ]
  )

  return (
    <AICommandContext.Provider value={value}>
      {children}
    </AICommandContext.Provider>
  )
}

export function useAICommandContext() {
  const context = React.useContext(AICommandContext)
  if (!context) {
    throw new Error(
      "useAICommandContext must be used within an AICommandProvider"
    )
  }
  return context
}

export { AICommandContext }
