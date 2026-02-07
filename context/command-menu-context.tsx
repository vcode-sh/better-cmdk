"use client"

import * as React from "react"
import { useChat } from "@ai-sdk/react"
import { DefaultChatTransport, type UIMessage } from "ai"
import type { CommandAction } from "../components/ui/command-menu"

export type CommandMenuMode = "command" | "chat"

export type CommandMenuStatus = "idle" | "submitted" | "streaming" | "error"

export interface ExternalChat {
  messages: UIMessage[]
  sendMessage: (message: { text: string }) => void
  status: "ready" | "submitted" | "streaming" | "error"
  error: Error | null
  addToolApprovalResponse?: (response: { id: string; approved: boolean }) => void
  availableActions?: CommandAction[]
}

export interface CommandMenuContextValue {
  mode: CommandMenuMode
  setMode: (mode: CommandMenuMode) => void
  inputValue: string
  setInputValue: (value: string) => void
  chatEndpoint: string | null
  status: CommandMenuStatus
  error: Error | null
  switchToChat: (initialQuery?: string) => void
  switchToCommand: () => void
  // Chat
  messages: UIMessage[]
  sendMessage: (content: string) => Promise<void>
  isLoading: boolean
  isEnabled: boolean
  addToolApprovalResponse?: (response: { id: string; approved: boolean }) => void
  availableActions?: CommandAction[]
  requestClose?: () => void
}

const CommandMenuContext = React.createContext<CommandMenuContextValue | null>(null)

export interface CommandMenuProviderProps {
  children: React.ReactNode
  chatEndpoint?: string | null
  chat?: ExternalChat
  onModeChange?: (mode: CommandMenuMode) => void
  onOpenChange?: (open: boolean) => void
}

const emptyMessages: UIMessage[] = []

export function CommandMenuProvider({
  children,
  chatEndpoint = null,
  chat: externalChat,
  onModeChange,
  onOpenChange,
}: CommandMenuProviderProps) {
  const [mode, setModeInternal] = React.useState<CommandMenuMode>("command")
  const [inputValue, setInputValue] = React.useState("")
  const [status, setStatus] = React.useState<CommandMenuStatus>("idle")
  const [error, setError] = React.useState<Error | null>(null)

  // Use refs for external chat callbacks to avoid dependency churn.
  // useAssistant() returns a new object every render, so reading
  // functions/arrays from the object directly in deps would cause
  // cascading re-renders on every streaming delta.
  const externalChatRef = React.useRef(externalChat)
  externalChatRef.current = externalChat

  const hasExternalChat = Boolean(externalChat)

  const transport = React.useMemo(() => {
    if (hasExternalChat || !chatEndpoint) return undefined
    return new DefaultChatTransport({ api: chatEndpoint })
  }, [chatEndpoint, hasExternalChat])

  const internalChatOptions = React.useMemo(
    () =>
      transport
        ? {
            transport,
            onError: (err: Error) => {
              setStatus("error")
              setError(err)
            },
          }
        : {},
    [transport],
  )

  const internalChat = useChat(internalChatOptions)

  // Sync status from external or internal chat
  const externalStatus = externalChat?.status
  const externalError = externalChat?.error ?? null

  React.useEffect(() => {
    if (hasExternalChat) {
      if (externalStatus === "ready") setStatus("idle")
      else if (externalStatus === "streaming") setStatus("streaming")
      else if (externalStatus === "submitted") setStatus("submitted")
      else if (externalStatus === "error") setStatus("error")
      setError(externalError)
    } else {
      const hookStatus = internalChat.status
      if (hookStatus === "streaming") setStatus("streaming")
      else if (hookStatus === "submitted") setStatus("submitted")
      else if (hookStatus === "error") setStatus("error")
      else if (hookStatus === "ready") setStatus("idle")
    }
  }, [externalStatus, externalError, internalChat.status, hasExternalChat])

  const setMode = React.useCallback(
    (newMode: CommandMenuMode) => {
      setModeInternal(newMode)
      onModeChange?.(newMode)
    },
    [onModeChange]
  )

  const isEnabled = Boolean(externalChat || chatEndpoint)

  const switchToChat = React.useCallback(
    (initialQuery?: string) => {
      if (!isEnabled) return
      setMode("chat")
      if (initialQuery) {
        setInputValue(initialQuery)
      }
    },
    [isEnabled, setMode]
  )

  const switchToCommand = React.useCallback(() => {
    setMode("command")
    setInputValue("")
    setStatus("idle")
    setError(null)
  }, [setMode])

  const sendMessage = React.useCallback(
    async (content: string) => {
      if (!content.trim()) return
      const ext = externalChatRef.current
      if (ext) {
        setInputValue("")
        ext.sendMessage({ text: content.trim() })
        return
      }
      if (!transport) return
      setStatus("submitted")
      setInputValue("")
      await internalChat.sendMessage({ text: content.trim() })
    },
    [internalChat, transport]
  )

  const isLoading = status === "submitted" || status === "streaming"

  const messages = externalChat
    ? externalChat.messages
    : (internalChat.messages ?? emptyMessages)

  const addToolApprovalResponse = externalChat?.addToolApprovalResponse
  const availableActions = externalChat?.availableActions

  const requestClose = React.useCallback(() => {
    onOpenChange?.(false)
  }, [onOpenChange])

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
      messages,
      sendMessage,
      isLoading,
      isEnabled,
      addToolApprovalResponse,
      availableActions,
      requestClose,
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
      messages,
      sendMessage,
      isLoading,
      isEnabled,
      addToolApprovalResponse,
      availableActions,
      requestClose,
    ]
  )

  return (
    <CommandMenuContext.Provider value={value}>
      {children}
    </CommandMenuContext.Provider>
  )
}

export function useCommandMenuContext() {
  const context = React.useContext(CommandMenuContext)
  if (!context) {
    throw new Error(
      "useCommandMenuContext must be used within a CommandMenuProvider"
    )
  }
  return context
}

export { CommandMenuContext }
