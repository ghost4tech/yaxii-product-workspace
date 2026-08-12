import { DialogFrame } from "../../components/DialogFrame";

interface ShortcutsDialogProps {
  onClose: () => void;
  open: boolean;
  portalRoot: HTMLElement;
}

const SHORTCUTS = [
  { keys: ["Ctrl", "K"], label: "Open command menu" },
  { keys: ["Ctrl", "S"], label: "Save browser-session draft" },
  { keys: ["G", "E"], label: "Go to Entry" },
  { keys: ["G", "P"], label: "Go to Preferences" },
  { keys: ["?"], label: "Show keyboard shortcuts" },
] as const;

export function ShortcutsDialog({ onClose, open, portalRoot }: ShortcutsDialogProps) {
  return (
    <DialogFrame
      description="Every listed shortcut is active. Product saving is not included."
      onClose={onClose}
      open={open}
      portalRoot={portalRoot}
      title="Keyboard shortcuts"
    >
      <ul className="ypw-shortcut-list">
        {SHORTCUTS.map((shortcut) => (
          <li key={shortcut.label}>
            <span>{shortcut.label}</span>
            <span className="ypw-shortcut-keys">
              {shortcut.keys.map((key) => <kbd key={key}>{key}</kbd>)}
            </span>
          </li>
        ))}
      </ul>
    </DialogFrame>
  );
}
