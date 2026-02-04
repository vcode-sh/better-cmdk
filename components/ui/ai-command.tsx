"use client"

import * as React from "react"
import { Command as CommandPrimitive } from "cmdk"
import { SearchIcon, SparklesIcon, SendIcon } from "lucide-react"
import { Dialog as DialogPrimitive } from "radix-ui"
import type { UIMessage } from "ai"

import { cn } from "../../lib/utils"
import {
  Dialog,
  DialogDescription,
  DialogHeader,
  DialogPortal,
  DialogTitle,
} from "./dialog"
import {
  AICommandProvider,
  useAICommandContext,
  type AICommandMode,
} from "../../context/ai-command-context"
import { ChatMessageList, ChatMessage, ChatLoading, ChatEmpty } from "./chat"

interface AICommandDialogProps
  extends Omit<React.ComponentProps<typeof Dialog>, "children"> {
  title?: string
  description?: string
  className?: string
  chatEndpoint?: string | null
  askAILabel?: string
  onModeChange?: (mode: AICommandMode) => void
  children:
    | React.ReactNode
    | ((context: {
        mode: AICommandMode
        messages: UIMessage[]
        status: "idle" | "submitted" | "streaming" | "error"
        isEnabled: boolean
      }) => React.ReactNode)
}

function AICommandDialogContent({
  className,
  children,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Content>) {
  return (
    <DialogPortal data-slot="dialog-portal">
      <DialogPrimitive.Content
        data-slot="dialog-content"
        className={cn(
          "bg-background fixed top-1/3 left-[50%] z-50 grid w-full max-w-[calc(100%-2rem)] translate-x-[-50%] translate-y-[-50%] overflow-hidden rounded-xl border-none p-2 shadow-2xl ring-4 ring-neutral-200/80 duration-200 outline-none sm:max-w-lg dark:bg-neutral-900 dark:ring-neutral-800",
          className
        )}
        {...props}
      >
        {children}
      </DialogPrimitive.Content>
    </DialogPortal>
  )
}

function AICommandDialogInner({
  title = "Command Palette",
  description = "Search for a command to run...",
  children,
  className,
  ...props
}: Omit<AICommandDialogProps, "chatEndpoint" | "onModeChange">) {
  const { mode, status, switchToCommand, messages, isEnabled } = useAICommandContext()

  const renderChildren = () => {
    if (typeof children === "function") {
      return children({
        mode,
        messages,
        status,
        isEnabled,
      })
    }
    return children
  }

  const handleEscapeKeyDown = (e: KeyboardEvent) => {
    if (mode === "chat") {
      e.preventDefault()
      switchToCommand()
    }
  }

  return (
    <Dialog {...props}>
      <AICommandDialogContent className={className} onEscapeKeyDown={handleEscapeKeyDown}>
        <DialogHeader className="sr-only">
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <CommandPrimitive
          data-slot="command"
          className={cn(
            "**:data-[slot=command-input-wrapper]:bg-input/50 **:data-[slot=command-input-wrapper]:border-input rounded-none bg-transparent **:data-[slot=command-input]:!h-9 **:data-[slot=command-input]:py-0 **:data-[slot=command-input-wrapper]:mb-0 **:data-[slot=command-input-wrapper]:!h-9 **:data-[slot=command-input-wrapper]:rounded-md **:data-[slot=command-input-wrapper]:border",
            "bg-popover text-popover-foreground flex h-full w-full flex-col overflow-hidden rounded-md"
          )}
        >
          {renderChildren()}
        </CommandPrimitive>
      </AICommandDialogContent>
    </Dialog>
  )
}

function AICommandDialog({
  chatEndpoint = null,
  onModeChange,
  ...props
}: AICommandDialogProps) {
  return (
    <AICommandProvider chatEndpoint={chatEndpoint} onModeChange={onModeChange}>
      <AICommandDialogInner {...props} />
    </AICommandProvider>
  )
}

interface AICommandInputProps
  extends Omit<React.ComponentProps<typeof CommandPrimitive.Input>, "value" | "onValueChange"> {
  showSendButton?: boolean
}

function AICommandInput({
  className,
  showSendButton = false,
  ...props
}: AICommandInputProps) {
  const { mode, inputValue, setInputValue, sendMessage, isLoading, switchToChat } = useAICommandContext()

  const handleSend = () => {
    if (inputValue.trim() && mode === "chat") {
      sendMessage(inputValue)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Cmd+Enter or Ctrl+Enter to start chat mode
    if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
      e.preventDefault()
      if (mode === "command" && inputValue.trim()) {
        switchToChat()
        sendMessage(inputValue)
      } else if (mode === "chat" && inputValue.trim()) {
        sendMessage(inputValue)
      }
      return
    }

    // Enter in chat mode sends message
    if (mode === "chat" && e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      if (inputValue.trim()) {
        sendMessage(inputValue)
      }
      return
    }
  }

  return (
    <div
      data-slot="command-input-wrapper"
      className="flex h-9 items-center gap-2 border-b px-3"
    >
      {mode === "command" ? (
        <SearchIcon className="size-4 shrink-0 opacity-50" />
      ) : (
        <SparklesIcon className="size-4 shrink-0 text-primary" />
      )}
      <CommandPrimitive.Input
        data-slot="command-input"
        value={inputValue}
        onValueChange={setInputValue}
        onKeyDown={handleKeyDown}
        className={cn(
          "placeholder:text-muted-foreground flex h-10 w-full rounded-md bg-transparent py-3 text-sm outline-hidden disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
        {...props}
      />
      {showSendButton && mode === "chat" && (
        <button
          type="button"
          onClick={handleSend}
          disabled={!inputValue.trim() || isLoading}
          className="flex items-center justify-center size-6 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <SendIcon className="size-3" />
        </button>
      )}
    </div>
  )
}

interface AICommandEmptyProps extends React.ComponentProps<typeof CommandPrimitive.Item> {
  label?: string
  description?: string
}

function AICommandEmpty({
  label = "Ask AI...",
  description = "Press Enter to ask AI.",
  className,
  ...props
}: AICommandEmptyProps) {
  const { inputValue, switchToChat, sendMessage, isEnabled } = useAICommandContext()

  const handleAskAI = () => {
    if (!isEnabled) return
    switchToChat()
    if (inputValue.trim()) {
      sendMessage(inputValue)
    }
  }

  if (!isEnabled) {
    return (
      <CommandPrimitive.Empty
        data-slot="command-empty"
        className={cn("text-muted-foreground py-6 text-center text-sm", className)}
      >
        No results found.
      </CommandPrimitive.Empty>
    )
  }

  return (
    <CommandPrimitive.Group forceMount>
      <CommandPrimitive.Item
        data-slot="command-item"
        value="ask-ai"
        onSelect={handleAskAI}
        className={cn(
          "data-[selected=true]:border-input data-[selected=true]:bg-input/50 relative flex cursor-default items-center gap-3 rounded-md border border-transparent px-3 py-2 text-sm outline-hidden select-none",
          className
        )}
        {...props}
      >
        <SparklesIcon className="size-4 shrink-0 text-primary" />
        <div className="flex flex-col items-start gap-0.5">
          <span className="font-medium">{label}</span>
          <span className="text-xs text-muted-foreground">{description}</span>
        </div>
      </CommandPrimitive.Item>
    </CommandPrimitive.Group>
  )
}

function AICommandList({
  className,
  children,
  ...props
}: React.ComponentProps<typeof CommandPrimitive.List>) {
  const { mode, status, messages } = useAICommandContext()

  if (mode === "chat") {
    return (
      <div
        data-slot="command-list"
        className={cn("max-h-[300px] overflow-hidden", className)}
      >
        {messages.length === 0 ? (
          <ChatEmpty />
        ) : (
          <ChatMessageList className="max-h-[300px]">
            {messages.map((message) => (
              <ChatMessage key={message.id} message={message} />
            ))}
            {status === "streaming" && <ChatLoading />}
          </ChatMessageList>
        )}
      </div>
    )
  }

  return (
    <CommandPrimitive.List
      data-slot="command-list"
      className={cn("max-h-[300px] overflow-x-hidden overflow-y-auto", className)}
      {...props}
    >
      {children}
    </CommandPrimitive.List>
  )
}

export {
  AICommandDialog,
  AICommandDialogContent,
  AICommandInput,
  AICommandEmpty,
  AICommandList,
}
export type { AICommandDialogProps, AICommandInputProps, AICommandEmptyProps }
