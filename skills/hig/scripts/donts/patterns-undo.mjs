import { hit } from "./shared.mjs";

function fileHasUndo(text) {
  return (
    /\b(UndoManager|undoManager|NSUndoManager)\b/.test(text) ||
    /\bregisterUndo\b/.test(text) ||
    /data-undo/.test(text) ||
    /aria-label=["']Undo\b/i.test(text) ||
    />\s*(Undo|Redo)\s*</.test(text)
  );
}

function scanConfirmEveryDelete(files) {
  const blob = files.map((f) => f.text).join("\n");
  if (!fileHasUndo(blob)) return [];
  const out = [];
  for (const f of files) {
    if (
      /window\.confirm\s*\(|confirmationDialog|Are you sure you want to delete|role=["']alertdialog["'][\s\S]{0,240}delete/i.test(
        f.text,
      )
    ) {
      out.push(hit(f.path, "delete confirmation while Undo exists"));
    }
  }
  return out;
}

function scanSilentNavLoss(files) {
  const blob = files.map((f) => f.text).join("\n");
  if (fileHasUndo(blob)) return [];
  const out = [];
  for (const f of files) {
    const dirty = /\b(isDirty|unsaved|hasUnsavedChanges)\b/.test(f.text);
    const leaves = /\b(navigate|router\.(push|replace)|location\.href)\s*\(/.test(f.text);
    const guarded = /beforeunload|useBlocker|data-draft|saveDraft/.test(f.text);
    if (dirty && leaves && !guarded) {
      out.push(hit(f.path, "navigate away from dirty form with no undo or draft"));
    }
  }
  return out;
}

export const records = [
  {
    id: "confirm-every-delete-with-undo",
    rewrite: "marker",
    scan: scanConfirmEveryDelete,
    apply(text, file) {
      return text;
    },
  },
  {
    id: "silent-nav-data-loss",
    rewrite: "marker",
    scan: scanSilentNavLoss,
    apply(text, file) {
      return text;
    },
  },
];
