# HeroUI Migration Plan

## Overview

This document outlines the migration strategy from Radix UI to HeroUI for the agent-platform project. The migration aims to consolidate the UI library to a single, comprehensive design system while maintaining functionality and improving developer experience.

## Current State Analysis

### Radix UI Dependencies (18 packages)

- `@radix-ui/react-accordion` - Accordion component
- `@radix-ui/react-avatar` - Avatar component
- `@radix-ui/react-checkbox` - Checkbox component
- `@radix-ui/react-context-menu` - Context menu component
- `@radix-ui/react-dialog` - Dialog/modal component
- `@radix-ui/react-dropdown-menu` - Dropdown menu component
- `@radix-ui/react-hover-card` - Hover card component
- `@radix-ui/react-label` - Label component
- `@radix-ui/react-popover` - Popover component
- `@radix-ui/react-radio-group` - Radio group component
- `@radix-ui/react-scroll-area` - Scroll area component
- `@radix-ui/react-select` - Select component
- `@radix-ui/react-separator` - Separator component
- `@radix-ui/react-slot` - Slot component for composition
- `@radix-ui/react-switch` - Switch component
- `@radix-ui/react-tabs` - Tabs component
- `@radix-ui/react-toggle` - Toggle component
- `@radix-ui/react-tooltip` - Tooltip component

### UI Components to Migrate (42 files)

Located in `src/components/ui/`:

- Direct Radix wrappers: button.tsx, dialog.tsx, dropdown-menu.tsx, etc.
- Custom components: CodeBlock.tsx, count-animation.tsx, etc.
- Icon components: discord-icon.tsx, github-icon.tsx, etc.

## Migration Strategy

### Phase 1: Setup and Infrastructure

1. **Install HeroUI and Dependencies with yarn**
2. **Configure TailwindCSS v4 for HeroUI**
3. **Setup HeroUI Provider**
4. **Create Migration Framework**

### Phase 2: Core Components

Direct replacements for commonly used components:

- Button → HeroUI Button
- Dialog → HeroUI Modal
- Avatar → HeroUI Avatar
- Badge → HeroUI Badge
- Checkbox → HeroUI Checkbox
- Switch → HeroUI Switch
- Tabs → HeroUI Tabs
- Accordion → HeroUI Accordion

### Phase 3: Advanced Components

Components requiring more complex migration:

- Dropdown Menu → HeroUI Dropdown
- Context Menu → HeroUI Dropdown (with right-click trigger)
- Select → HeroUI Select
- Popover → HeroUI Popover
- Tooltip → HeroUI Tooltip
- Radio Group → HeroUI RadioGroup

### Phase 4: Complex/Custom Components

- Scroll Area → HeroUI ScrollShadow or custom solution
- Separator → HeroUI Divider
- Label → HeroUI component or custom
- Hover Card → Custom solution using HeroUI Popover
- Slot → Custom composition solution

### Phase 5: Cleanup

- Remove Radix dependencies

## Detailed Implementation Plan

### Phase 1: Setup and Infrastructure

#### 1.1 Install HeroUI Dependencies

```bash
yarn add @heroui/react framer-motion
```

#### 1.2 Update TailwindCSS v4 Configuration

Create `hero.ts`:

```typescript
// hero.ts
import { heroui } from "@heroui/react";
export default heroui();
```

Update CSS file:

```css
@import "tailwindcss";
@plugin './hero.ts';
@source '../../node_modules/@heroui/theme/dist/**/*.{js,ts,jsx,tsx}';
@custom-variant dark (&:**is**(.dark *));
```

#### 1.3 Setup HeroUI Provider

Update `src/app/layout.tsx`:

```typescript
import { HeroUIProvider } from "@heroui/react";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <HeroUIProvider>
          {children}
        </HeroUIProvider>
      </body>
    </html>
  );
}
```

### Phase 2: Core Components Migration

#### 2.1 Button Component

**File**: `src/components/ui/button.tsx`

**Before** (Radix):

```typescript
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
```

**After** (HeroUI):

```typescript
import { Button as HeroUIButton } from "@heroui/react";
import { forwardRef } from "react";
```

**Migration Steps**:

1. Replace Radix Slot usage with HeroUI Button
2. Map CVA variants to HeroUI variants
3. Update prop types and default values

#### 2.2 Dialog Component

**File**: `src/components/ui/dialog.tsx`

**Before** (Radix):

```typescript
import * as DialogPrimitive from "@radix-ui/react-dialog";
```

**After** (HeroUI):

```typescript
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  useDisclosure
} from "@heroui/react";
```

**Migration Steps**:

1. Replace DialogPrimitive with HeroUI Modal components
2. Update trigger pattern to use useDisclosure hook
3. Map overlay and content styling
4. Update close button implementation

#### 2.3 Avatar Component

**File**: `src/components/ui/avatar.tsx`

**Before** (Radix):

```typescript
import * as AvatarPrimitive from "@radix-ui/react-avatar";
```

**After** (HeroUI):

```typescript
import { Avatar as HeroUIAvatar } from "@heroui/react";
```

**Migration Steps**:

1. Replace Radix Avatar with HeroUI Avatar
2. Map size variants
3. Update fallback and image props

### Phase 3: Advanced Components Migration

#### 3.1 Dropdown Menu Component

**File**: `src/components/ui/dropdown-menu.tsx`

**Before** (Radix):

```typescript
import * as DropdownMenuPrimitive from "@radix-ui/react-dropdown-menu";
```

**After** (HeroUI):

```typescript
import {
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
  DropdownSection
} from "@heroui/react";
```

**Migration Steps**:

1. Replace Radix DropdownMenu with HeroUI Dropdown
2. Map menu items to DropdownItem components
3. Update keyboard navigation
4. Handle selection states
5. Map separators to sections

#### 3.2 Context Menu Component

**File**: `src/components/ui/context-menu.tsx`

**Strategy**: Use HeroUI Dropdown with right-click trigger

**Implementation**:

```typescript
import { Dropdown, DropdownTrigger, DropdownMenu, DropdownItem } from "@heroui/react";

const ContextMenu = ({ children, items, ...props }) => {
  return (
    <Dropdown trigger="longPress" {...props}>
      <DropdownTrigger>
        {children}
      </DropdownTrigger>
      <DropdownMenu>
        {items.map((item) => (
          <DropdownItem key={item.key} onAction={item.onAction}>
            {item.label}
          </DropdownItem>
        ))}
      </DropdownMenu>
    </Dropdown>
  );
};
```

### Phase 4: Complex/Custom Components

#### 4.1 Scroll Area Component

**File**: `src/components/ui/scroll-area.tsx`

**Strategy**: Use HeroUI ScrollShadow or create custom solution

**Implementation**:

```typescript
import { ScrollShadow } from "@heroui/react";

const ScrollArea = ({ children, className, ...props }) => {
  return (
    <ScrollShadow
      className={className}
      hideScrollBar
      {...props}
    >
      {children}
    </ScrollShadow>
  );
};
```

#### 4.2 Hover Card Component

**File**: `src/components/ui/hover-card.tsx`

**Strategy**: Custom implementation using HeroUI Popover

**Implementation**:

```typescript
import { Popover, PopoverTrigger, PopoverContent } from "@heroui/react";

const HoverCard = ({ children, content, ...props }) => {
  return (
    <Popover placement="top" {...props}>
      <PopoverTrigger>
        {children}
      </PopoverTrigger>
      <PopoverContent>
        {content}
      </PopoverContent>
    </Popover>
  );
};
```

## Component Mapping Reference

| Radix Component | HeroUI Equivalent | Migration Complexity | Notes |
|-----------------|-------------------|---------------------|-------|
| Accordion | Accordion | Low | Direct replacement |
| Avatar | Avatar | Low | Direct replacement |
| Badge | Badge | Low | Direct replacement |
| Button | Button | Low | Direct replacement |
| Checkbox | Checkbox | Low | Direct replacement |
| Dialog | Modal | Medium | Different API pattern |
| Dropdown Menu | Dropdown | Medium | More feature-rich |
| Switch | Switch | Low | Direct replacement |
| Tabs | Tabs | Low | Direct replacement |
| Tooltip | Tooltip | Low | Direct replacement |
| Context Menu | Dropdown | Medium | Use with right-click trigger |
| Select | Select | Medium | Different API |
| Popover | Popover | Medium | Similar functionality |
| Radio Group | RadioGroup | Medium | Different grouping |
| Scroll Area | ScrollShadow | Medium | Custom implementation |
| Separator | Divider | Low | Direct replacement |
| Label | Built-in or custom | Low | May not need separate component |
| Hover Card | Popover | High | Custom implementation |
| Slot | Custom solution | High | Composition pattern |
| Toggle | Switch/Checkbox | Medium | Depends on usage |
