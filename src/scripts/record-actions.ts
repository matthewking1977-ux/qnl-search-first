// Save (this device), copy citation, share link, and tidy popovers.
const KEY = 'qnl.saved';
export const readSaved = (): string[] => { try { return JSON.parse(localStorage.getItem(KEY) || '[]'); } catch { return []; } };
export const writeSaved = (ids: string[]) => { try { localStorage.setItem(KEY, JSON.stringify(ids)); } catch { /* private mode: fine */ } };

function announce(msg: string) {
  let el = document.getElementById('act-live');
  if (!el) {
    el = Object.assign(document.createElement('div'), { id: 'act-live', className: 'sr-only' });
    el.setAttribute('role', 'status'); el.setAttribute('aria-live', 'polite');
    document.body.append(el);
  }
  el.textContent = '';
  requestAnimationFrame(() => (el!.textContent = msg));
}

function paintSave(b: HTMLButtonElement, on: boolean) {
  b.setAttribute('aria-pressed', String(on));
  b.querySelector('span')!.textContent = on ? b.dataset.labelSaved! : b.dataset.labelSave!;
}

export function updateSavedLinks() {
  const n = readSaved().length;
  document.querySelectorAll<HTMLAnchorElement>('[data-saved-link]').forEach((a) => {
    a.hidden = n === 0;
    a.textContent = a.dataset.template!.replace('{n}', String(n));
  });
}

let done = false;
export function initRecordActions() {
  if (done) return; done = true;
  const saved = new Set(readSaved());
  document.querySelectorAll<HTMLButtonElement>('[data-save]').forEach((b) => { b.hidden = false; paintSave(b, saved.has(b.dataset.save!)); });
  document.querySelectorAll<HTMLButtonElement>('[data-copy]').forEach((b) => { b.hidden = !navigator.clipboard; });
  document.querySelectorAll<HTMLButtonElement>('[data-share-url]').forEach((b) => { b.hidden = !(navigator.share || navigator.clipboard); });
  updateSavedLinks();

  document.addEventListener('click', async (e) => {
    const target = e.target as HTMLElement;
    const save = target.closest<HTMLButtonElement>('[data-save]');
    if (save) {
      const ids = readSaved(); const id = save.dataset.save!;
      const on = !ids.includes(id);
      writeSaved(on ? [id, ...ids] : ids.filter((x) => x !== id));
      document.querySelectorAll<HTMLButtonElement>(`[data-save="${CSS.escape(id)}"]`).forEach((b) => paintSave(b, on));
      announce(on ? save.dataset.noteSaved! : save.dataset.noteUnsaved!);
      updateSavedLinks();
      return;
    }
    const copy = target.closest<HTMLButtonElement>('[data-copy]');
    if (copy) {
      const text = document.getElementById(copy.dataset.copy!)?.textContent ?? '';
      await navigator.clipboard.writeText(text.trim());
      const label = copy.firstChild!; const before = label.textContent;
      label.textContent = copy.dataset.copied!; announce(copy.dataset.copied!);
      setTimeout(() => (label.textContent = before), 1600);
      return;
    }
    const share = target.closest<HTMLButtonElement>('[data-share-url]');
    if (share) {
      const url = share.dataset.shareUrl!;
      if (navigator.share) { try { await navigator.share({ title: share.dataset.shareTitle, url }); } catch { /* dismissed */ } return; }
      await navigator.clipboard.writeText(url);
      announce(share.dataset.noteCopied!);
      return;
    }
    // Clicking outside closes open popovers.
    document.querySelectorAll<HTMLDetailsElement>('.ract-pop[open]').forEach((d) => { if (!d.contains(target)) d.open = false; });
  });
  // One popover at a time; Escape closes and returns focus to its button.
  document.addEventListener('toggle', (e) => {
    const d = e.target as HTMLElement;
    if (d instanceof HTMLDetailsElement && d.classList.contains('ract-pop') && d.open)
      document.querySelectorAll<HTMLDetailsElement>('.ract-pop[open]').forEach((o) => { if (o !== d) o.open = false; });
  }, true);
  document.addEventListener('keydown', (e) => {
    if (e.key !== 'Escape') return;
    const d = (document.activeElement as HTMLElement | null)?.closest<HTMLDetailsElement>('.ract-pop[open]');
    if (d) { d.open = false; d.querySelector('summary')?.focus(); }
  });
}
