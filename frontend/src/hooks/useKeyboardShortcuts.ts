import { useEffect } from 'react';

interface KeyboardShortcut {
  key: string;
  ctrlKey?: boolean;
  shiftKey?: boolean;
  metaKey?: boolean;
  altKey?: boolean;
  callback: () => void;
  description?: string;
}

export function useKeyboardShortcuts(shortcuts: KeyboardShortcut[]) {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      for (const shortcut of shortcuts) {
        const keyMatch = event.key.toLowerCase() === shortcut.key.toLowerCase();
        const ctrlMatch = !!shortcut.ctrlKey === event.ctrlKey;
        const shiftMatch = !!shortcut.shiftKey === event.shiftKey;
        const metaMatch = !!shortcut.metaKey === event.metaKey;
        const altMatch = !!shortcut.altKey === event.altKey;

        if (keyMatch && ctrlMatch && shiftMatch && metaMatch && altMatch) {
          event.preventDefault();
          shortcut.callback();
          break;
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [shortcuts]);
}

// Common shortcuts
export const createLogoutShortcut = (callback: () => void): KeyboardShortcut => ({
  key: 'l',
  ctrlKey: true,
  shiftKey: true,
  callback,
  description: 'Ctrl+Shift+L: Sign out'
});

export const createLogoutShortcutMac = (callback: () => void): KeyboardShortcut => ({
  key: 'l',
  metaKey: true,
  shiftKey: true,
  callback,
  description: 'Cmd+Shift+L: Sign out'
});
