# better-cmdk

A beautiful command palette component for React, built on [cmdk](https://github.com/dip/cmdk) and [Radix UI](https://www.radix-ui.com/). Styled with Tailwind CSS v4 using the shadcn/ui design system.

## Installation

```bash
npm install better-cmdk
# or
pnpm add better-cmdk
# or
bun add better-cmdk
```

### Peer Dependencies

This library requires React 18+ and Tailwind CSS v4:

```bash
npm install react react-dom tailwindcss
```

## Setup

### 1. Configure Tailwind to scan the package

Add the package to your Tailwind CSS sources in your main CSS file:

```css
@import "tailwindcss";
@source "node_modules/better-cmdk";
```

### 2. Add CSS variables

Add the required CSS variables to your global styles:

```css
:root {
  --background: 0 0% 100%;
  --foreground: 240 10% 3.9%;
  --popover: 0 0% 100%;
  --popover-foreground: 240 10% 3.9%;
  --primary: 240 5.9% 10%;
  --primary-foreground: 0 0% 98%;
  --muted: 240 4.8% 95.9%;
  --muted-foreground: 240 3.8% 46.1%;
  --accent: 240 4.8% 95.9%;
  --accent-foreground: 240 5.9% 10%;
  --border: 240 5.9% 90%;
  --input: 240 5.9% 90%;
  --ring: 240 5.9% 10%;
  --radius: 0.5rem;
}

@theme inline {
  --color-background: hsl(var(--background));
  --color-foreground: hsl(var(--foreground));
  --color-popover: hsl(var(--popover));
  --color-popover-foreground: hsl(var(--popover-foreground));
  --color-primary: hsl(var(--primary));
  --color-primary-foreground: hsl(var(--primary-foreground));
  --color-muted: hsl(var(--muted));
  --color-muted-foreground: hsl(var(--muted-foreground));
  --color-accent: hsl(var(--accent));
  --color-accent-foreground: hsl(var(--accent-foreground));
  --color-border: hsl(var(--border));
  --color-input: hsl(var(--input));
  --color-ring: hsl(var(--ring));
}
```

## Usage

```tsx
"use client";

import { useState, useEffect } from "react";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from "better-cmdk";

export function CommandPalette() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };

    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput placeholder="Type a command or search..." />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>
        <CommandGroup heading="Suggestions">
          <CommandItem>
            <span>Calendar</span>
          </CommandItem>
          <CommandItem>
            <span>Search</span>
          </CommandItem>
        </CommandGroup>
        <CommandSeparator />
        <CommandGroup heading="Settings">
          <CommandItem>
            <span>Profile</span>
            <CommandShortcut>⌘P</CommandShortcut>
          </CommandItem>
          <CommandItem>
            <span>Settings</span>
            <CommandShortcut>⌘S</CommandShortcut>
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}
```

## Components

### CommandDialog

The main dialog wrapper. Opens as a modal command palette.

```tsx
<CommandDialog
  open={open}
  onOpenChange={setOpen}
  title="Command Palette" // optional, for accessibility
  description="Search commands" // optional, for accessibility
>
  {children}
</CommandDialog>
```

### CommandInput

Search input with built-in search icon.

```tsx
<CommandInput placeholder="Search..." />
```

### CommandList

Scrollable container for command items.

```tsx
<CommandList>{children}</CommandList>
```

### CommandGroup

Groups related commands with an optional heading.

```tsx
<CommandGroup heading="Actions">{children}</CommandGroup>
```

### CommandItem

Individual selectable command item.

```tsx
<CommandItem onSelect={() => console.log("Selected!")}>
  <Icon className="mr-2 h-4 w-4" />
  <span>Label</span>
</CommandItem>
```

### CommandShortcut

Displays keyboard shortcut hints.

```tsx
<CommandShortcut>⌘K</CommandShortcut>
```

### CommandSeparator

Visual separator between groups.

```tsx
<CommandSeparator />
```

### CommandEmpty

Shown when no results match the search.

```tsx
<CommandEmpty>No results found.</CommandEmpty>
```

## Subpath Exports

Import specific components directly:

```tsx
import { Command, CommandDialog } from "better-cmdk/command";
import { Dialog, DialogContent } from "better-cmdk/dialog";
import { Button } from "better-cmdk/button";
import { cn } from "better-cmdk/utils";
```

## Styling

The component uses Tailwind CSS with the shadcn/ui design tokens. Customize by:

1. Overriding CSS variables
2. Passing `className` props to components
3. Using the `cn()` utility for conditional classes

## License

MIT
