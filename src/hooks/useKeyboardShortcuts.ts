import { useEffect, useCallback } from "react";

interface ShortcutConfig {
  key: string;
  ctrl?: boolean;
  meta?: boolean;
  shift?: boolean;
  alt?: boolean;
  action: () => void;
  description?: string;
}

export function useKeyboardShortcuts(shortcuts: ShortcutConfig[]) {
  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      // Don't trigger shortcuts when typing in input fields
      const target = event.target as HTMLElement;
      const isInputField =
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.isContentEditable;

      for (const shortcut of shortcuts) {
        const keyMatches = event.key.toLowerCase() === shortcut.key.toLowerCase();
        const ctrlMatches = shortcut.ctrl ? event.ctrlKey || event.metaKey : true;
        const metaMatches = shortcut.meta ? event.metaKey : true;
        const shiftMatches = shortcut.shift ? event.shiftKey : !event.shiftKey;
        const altMatches = shortcut.alt ? event.altKey : !event.altKey;

        // Special handling for Escape - works even in input fields
        const isEscape = shortcut.key.toLowerCase() === "escape";
        
        if (keyMatches && ctrlMatches && metaMatches && shiftMatches && altMatches) {
          if (!isInputField || isEscape || shortcut.ctrl || shortcut.meta) {
            event.preventDefault();
            shortcut.action();
            return;
          }
        }
      }
    },
    [shortcuts]
  );

  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);
}

// Predefined shortcuts for the app
export const APP_SHORTCUTS = {
  NEW_CHAT: { key: "n", ctrl: true, description: "New Chat" },
  TOGGLE_SIDEBAR: { key: "/", ctrl: true, description: "Toggle Sidebar" },
  SEARCH: { key: "k", ctrl: true, description: "Search" },
  SETTINGS: { key: ",", ctrl: true, description: "Settings" },
  CLOSE: { key: "Escape", description: "Close" },
} as const;
