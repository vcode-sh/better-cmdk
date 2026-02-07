"use client";

import * as React from "react";
import { Command as CommandPrimitive, useCommandState, defaultFilter } from "cmdk";
import { SearchIcon, SparklesIcon, CornerDownLeftIcon } from "lucide-react";
import { Dialog as DialogPrimitive } from "radix-ui";
import type { UIMessage } from "ai";

import { cn } from "../../lib/utils";
import {
  Dialog,
  DialogDescription,
  DialogHeader,
  DialogPortal,
  DialogTitle,
} from "./dialog";
import { CommandGroup, CommandItem } from "./command";
import {
  CommandMenuProvider,
  useCommandMenuContext,
  type CommandMenuMode,
  type ExternalChat,
} from "../../context/command-menu-context";
import { ChatMessageList, ChatLoading, ChatEmpty } from "./chat";
import { AssistantMessages } from "./assistant-messages";

const noopApproval = (_r: { id: string; approved: boolean }) => {};

interface CommandMenuProps extends Omit<
  React.ComponentProps<typeof Dialog>,
  "children"
> {
  title?: string;
  description?: string;
  className?: string;
  chatEndpoint?: string | null;
  chat?: ExternalChat;
  askAILabel?: string;
  onModeChange?: (mode: CommandMenuMode) => void;
  children?:
    | React.ReactNode
    | ((context: {
        mode: CommandMenuMode;
        messages: UIMessage[];
        status: "idle" | "submitted" | "streaming" | "error";
        isEnabled: boolean;
      }) => React.ReactNode);
}

function CommandMenuContent({
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
          className,
        )}
        {...props}
      >
        {children}
      </DialogPrimitive.Content>
    </DialogPortal>
  );
}

const defaultChildren = (
  <>
    <CommandMenuInput placeholder="Search or ask AI..." showSendButton />
    <CommandMenuList>
      <CommandMenuEmpty />
    </CommandMenuList>
  </>
);

function CommandMenuInner({
  title = "Command Palette",
  description = "Search for a command to run...",
  children,
  className,
  ...props
}: Omit<CommandMenuProps, "chatEndpoint" | "chat" | "onModeChange">) {
  const { mode, status, switchToCommand, messages, isEnabled, sendMessage, addToolApprovalResponse } =
    useCommandMenuContext();

  const renderChildren = () => {
    if (typeof children === "function") {
      return children({
        mode,
        messages,
        status,
        isEnabled,
      });
    }
    return children ?? defaultChildren;
  };

  const handleEscapeKeyDown = (e: KeyboardEvent) => {
    if (mode === "chat") {
      e.preventDefault();
      switchToCommand();
    }
  };

  return (
    <Dialog {...props}>
      <CommandMenuContent
        className={className}
        onEscapeKeyDown={handleEscapeKeyDown}
      >
        <DialogHeader className="sr-only">
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <CommandPrimitive
          data-slot="command"
          className={cn(
            "**:data-[slot=command-input-wrapper]:bg-input/50 **:data-[slot=command-input-wrapper]:border-input rounded-none bg-transparent **:data-[slot=command-input]:!h-9 **:data-[slot=command-input]:py-0 **:data-[slot=command-input-wrapper]:mb-0 **:data-[slot=command-input-wrapper]:!h-9 **:data-[slot=command-input-wrapper]:rounded-md **:data-[slot=command-input-wrapper]:border",
            "bg-popover text-popover-foreground flex h-full w-full flex-col overflow-hidden rounded-md",
          )}
        >
          {renderChildren()}
        </CommandPrimitive>
      </CommandMenuContent>
    </Dialog>
  );
}

function CommandMenu({
  chatEndpoint = null,
  chat,
  onModeChange,
  onOpenChange,
  ...props
}: CommandMenuProps) {
  return (
    <CommandMenuProvider chatEndpoint={chatEndpoint} chat={chat} onModeChange={onModeChange} onOpenChange={onOpenChange}>
      <CommandMenuInner onOpenChange={onOpenChange} {...props} />
    </CommandMenuProvider>
  );
}

interface CommandMenuInputProps extends Omit<
  React.ComponentProps<typeof CommandPrimitive.Input>,
  "value" | "onValueChange"
> {
  showSendButton?: boolean;
}

function CommandMenuInput({
  className,
  showSendButton = false,
  ...props
}: CommandMenuInputProps) {
  const {
    mode,
    inputValue,
    setInputValue,
    sendMessage,
    isLoading,
    switchToChat,
  } = useCommandMenuContext();

  const handleSend = () => {
    if (inputValue.trim() && mode === "chat") {
      sendMessage(inputValue);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Cmd+Enter or Ctrl+Enter to start chat mode
    if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
      e.preventDefault();
      if (mode === "command" && inputValue.trim()) {
        switchToChat();
        sendMessage(inputValue);
      } else if (mode === "chat" && inputValue.trim()) {
        sendMessage(inputValue);
      }
      return;
    }

    // Enter in chat mode sends message
    if (mode === "chat" && e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (inputValue.trim()) {
        sendMessage(inputValue);
      }
      return;
    }
  };

  return (
    <div
      data-slot="command-input-wrapper"
      className="order-2 flex h-9 items-center gap-2 border-t px-3 mt-2"
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
          className,
        )}
        {...props}
        placeholder={mode === "chat" ? "Ask AI..." : props.placeholder}
      />
      {showSendButton && mode === "chat" && (
        <button
          type="button"
          onClick={handleSend}
          disabled={!inputValue.trim() || isLoading}
          className="flex items-center justify-center size-6 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <CornerDownLeftIcon className="size-3" />
        </button>
      )}
    </div>
  );
}

interface CommandMenuEmptyProps extends React.ComponentProps<
  typeof CommandPrimitive.Item
> {
  label?: string;
  description?: string;
}

function CommandMenuEmpty({
  label = "Ask AI",
  className,
  ...props
}: CommandMenuEmptyProps) {
  const { inputValue, setInputValue, switchToChat, sendMessage, isEnabled } =
    useCommandMenuContext();

  // cmdk's filtered.count excludes forceMount items (like ask-ai), so
  // count === 0 means no regular commands matched the search query.
  const filteredCount = useCommandState((state) => state.filtered.count);

  const handleAskAI = () => {
    if (!isEnabled) return;
    switchToChat();
    if (inputValue.trim()) {
      // Don't send if other commands matched (user was browsing results)
      // or if the input itself matches "ask-ai" (user was searching for this command).
      const inputMatchesAskAI = defaultFilter("ask-ai", inputValue.trim()) > 0;
      if (filteredCount === 0 && !inputMatchesAskAI) {
        sendMessage(inputValue);
      } else {
        setInputValue("");
      }
    }
  };

  if (!isEnabled) {
    return (
      <CommandPrimitive.Empty
        data-slot="command-empty"
        className={cn(
          "text-muted-foreground py-6 text-center text-sm",
          className,
        )}
      >
        No results found.
      </CommandPrimitive.Empty>
    );
  }

  return (
    <CommandPrimitive.Group forceMount>
      <CommandPrimitive.Item
        data-slot="command-item"
        value="ask-ai"
        onSelect={handleAskAI}
        className={cn(
          "data-[selected=true]:border-input data-[selected=true]:bg-input/50 relative flex cursor-default items-center gap-3 rounded-md border border-transparent px-3 py-2 text-sm outline-hidden select-none",
          className,
        )}
        {...props}
      >
        <SparklesIcon className="size-4 shrink-0 text-primary" />
        <div className="flex flex-col items-start gap-0.5">
          <span className="font-medium">{label}</span>
        </div>
      </CommandPrimitive.Item>
    </CommandPrimitive.Group>
  );
}

/**
 * Describes a single option/parameter for an action.
 * Compatible with ActionOption from modifywithai.
 */
export interface CommandActionOption {
  type: string
  description?: string
  required?: boolean
}

/**
 * Minimal action interface compatible with ActionDefinition from modifywithai.
 * Only `name` and `execute` are needed — all other ActionDefinition fields are ignored.
 */
export interface CommandAction {
  name: string
  label?: string
  options?: Record<string, CommandActionOption>
  execute?: (options: Record<string, unknown>) => void
}

interface CommandMenuListProps extends React.ComponentProps<typeof CommandPrimitive.List> {
  /** Actions to render as CommandItems. Compatible with ActionDefinition[]. */
  actions?: CommandAction[]
  /** Heading for the auto-rendered actions group */
  actionsHeading?: string
}

function CommandMenuList({
  className,
  children,
  actions,
  actionsHeading = "Actions",
  ...props
}: CommandMenuListProps) {
  const { mode, status, messages, sendMessage, addToolApprovalResponse, availableActions, requestClose } = useCommandMenuContext();

  const stableSendMessage = React.useCallback(
    (msg: { text: string }) => sendMessage(msg.text),
    [sendMessage],
  );
  const stableApproval = addToolApprovalResponse ?? noopApproval;

  if (mode === "chat") {
    return (
      <div
        data-slot="command-list"
        className={cn(
          "order-1 max-h-[300px] min-h-0 flex-1 overflow-hidden",
          className,
        )}
      >
        {messages.length === 0 ? (
          <ChatEmpty />
        ) : (
          <ChatMessageList className="max-h-[300px]">
            <div className="px-3 py-2 space-y-4">
              <AssistantMessages
                messages={messages}
                sendMessage={stableSendMessage}
                addToolApprovalResponse={stableApproval}
              />
            </div>
            {status === "streaming" && <ChatLoading />}
          </ChatMessageList>
        )}
      </div>
    );
  }

  const orderedChildren = React.Children.toArray(children);
  const askAIChildren: React.ReactNode[] = [];
  const otherChildren: React.ReactNode[] = [];

  orderedChildren.forEach((child) => {
    if (
      React.isValidElement(child) &&
      (child.type === CommandMenuEmpty ||
        (child.type as { displayName?: string }).displayName ===
          "CommandMenuEmpty")
    ) {
      askAIChildren.push(child);
    } else {
      otherChildren.push(child);
    }
  });

  const resolvedActions = actions ?? availableActions;
  const executableActions = resolvedActions?.filter((a) => a.execute);

  const handleActionSelect = (action: CommandAction) => {
    const label = action.label ?? action.name;
    sendMessage(label);
    requestClose?.();
  };

  return (
    <CommandPrimitive.List
      data-slot="command-list"
      className={cn(
        "order-1 max-h-[300px] min-h-0 flex-1 overflow-x-hidden overflow-y-auto",
        className,
      )}
      {...props}
    >
      {otherChildren}
      {executableActions && executableActions.length > 0 && (
        <CommandGroup heading={actionsHeading}>
          {executableActions.map((action) => (
            <CommandItem
              key={action.name}
              value={action.label ?? action.name}
              onSelect={() => handleActionSelect(action)}
            >
              {action.label ?? action.name}
            </CommandItem>
          ))}
        </CommandGroup>
      )}
      {askAIChildren}
    </CommandPrimitive.List>
  );
}

export {
  CommandMenu,
  CommandMenuContent,
  CommandMenuInput,
  CommandMenuEmpty,
  CommandMenuList,
};
export type { CommandMenuProps, CommandMenuInputProps, CommandMenuEmptyProps, CommandMenuListProps };

CommandMenuEmpty.displayName = "CommandMenuEmpty";
