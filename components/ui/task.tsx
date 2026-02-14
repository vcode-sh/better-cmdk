"use client"

import { ChevronDownIcon, SearchIcon } from "lucide-react"
import { type ComponentProps, isValidElement, type ReactNode } from "react"
import { cn } from "../../lib/utils"
import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from "./collapsible"

export type TaskItemFileProps = Omit<ComponentProps<"div">, "className">

export function TaskItemFile({ children, ...props }: TaskItemFileProps) {
    return (
        <div
            data-slot="task-item-file"
            className="inline-flex items-center gap-1 rounded-md border bg-secondary px-1.5 py-0.5 text-xs text-foreground"
            {...props}
        >
            {children}
        </div>
    )
}

export type TaskItemProps = Omit<ComponentProps<"div">, "className">

export function TaskItem({ children, ...props }: TaskItemProps) {
    return (
        <div
            data-slot="task-item"
            className="text-sm text-muted-foreground"
            {...props}
        >
            {children}
        </div>
    )
}

export type TaskProps = Omit<ComponentProps<typeof Collapsible>, "className">

export function Task({ defaultOpen = true, ...props }: TaskProps) {
    return <Collapsible data-slot="task" defaultOpen={defaultOpen} {...props} />
}

export type TaskTriggerProps = Omit<
    ComponentProps<typeof CollapsibleTrigger>,
    "className"
> & {
    title: string
    icon?: ReactNode
}

export function TaskTrigger({
    children,
    title,
    icon,
    ...props
}: TaskTriggerProps) {
    const defaultTrigger = (
        <div className="flex w-full cursor-pointer items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground">
            {icon ?? <SearchIcon className="size-4" />}
            <p className="text-sm">{title}</p>
            <ChevronDownIcon className="size-4 transition-transform group-data-[panel-open]:rotate-180" />
        </div>
    )

    return (
        <CollapsibleTrigger
            render={isValidElement(children) ? children : defaultTrigger}
            nativeButton={false}
            className="group"
            {...props}
        />
    )
}

export type TaskContentProps = Omit<
    ComponentProps<typeof CollapsibleContent>,
    "className"
>

export function TaskContent({ children, ...props }: TaskContentProps) {
    return (
        <CollapsibleContent
            data-slot="task-content"
            className={cn(
                "text-popover-foreground outline-none",
                "data-closed:animate-out data-open:animate-in",
                "data-closed:fade-out-0 data-open:fade-in-0",
                "data-closed:slide-out-to-top-2 data-open:slide-in-from-top-2",
            )}
            {...props}
        >
            <div className="mt-4 space-y-2 border-l-2 border-muted pl-4">
                {children}
            </div>
        </CollapsibleContent>
    )
}
