import { DialogFrame } from "../../components/DialogFrame";
import type { Translate } from "../../core/i18n/messages";

interface ShortcutsDialogProps {
  onClose: () => void;
  open: boolean;
  portalRoot: HTMLElement;
  t: Translate;
}

export function ShortcutsDialog({ onClose, open, portalRoot, t }: ShortcutsDialogProps) {
  const shortcuts = [
    { keys: ["Ctrl", "K"], label: t("shortcutCommand") },
    { keys: ["Ctrl", "S"], label: t("shortcutDraft") },
    { keys: ["G", "E"], label: t("shortcutEntry") },
    { keys: ["G", "P"], label: t("shortcutPreferences") },
    { keys: ["?"], label: t("shortcutHelp") },
  ] as const;

  return (
    <DialogFrame
      closeLabel={t("closeDialog")}
      description={t("shortcutsDescription")}
      onClose={onClose}
      open={open}
      portalRoot={portalRoot}
      title={t("keyboardShortcuts")}
    >
      <ul className="ypw-shortcut-list">
        {shortcuts.map((shortcut) => (
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
