// FocusTrap utility for Angular/Ionic modals/dialogs
// Usage: Call trapFocus(modalElement: HTMLElement) after modal is opened.
// Call releaseFocus() when modal is closed.

let previouslyFocusedElement: HTMLElement | null = null;
let focusTrapRoot: HTMLElement | null = null;
let focusableElements: HTMLElement[] = [];
let focusTrapListener: ((e: KeyboardEvent) => void) | null = null;

function getFocusableElements(root: HTMLElement): HTMLElement[] {
  return Array.from(
    root.querySelectorAll<HTMLElement>(
      'a[href], area[href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), button:not([disabled]), [tabindex]:not([tabindex="-1"]), ion-button:not([disabled])'
    )
  ).filter(el => !el.hasAttribute('disabled') && !el.getAttribute('aria-hidden'));
}

export function trapFocus(modalElement: HTMLElement): void {
  releaseFocus();
  focusTrapRoot = modalElement;
  previouslyFocusedElement = document.activeElement as HTMLElement;
  focusableElements = getFocusableElements(modalElement);
  if (focusableElements.length) {
    focusableElements[0].focus();
  }
  focusTrapListener = (e: KeyboardEvent) => {
    if (e.key !== 'Tab' || !focusTrapRoot) return;
    focusableElements = getFocusableElements(focusTrapRoot);
    const first = focusableElements[0];
    const last = focusableElements[focusableElements.length - 1];
    if (e.shiftKey) {
      if (document.activeElement === first) {
        e.preventDefault();
        last.focus();
      }
    } else {
      if (document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }
  };
  document.addEventListener('keydown', focusTrapListener, true);
}

export function releaseFocus(): void {
  if (focusTrapListener) {
    document.removeEventListener('keydown', focusTrapListener, true);
    focusTrapListener = null;
  }
  if (previouslyFocusedElement) {
    previouslyFocusedElement.focus();
    previouslyFocusedElement = null;
  }
  focusTrapRoot = null;
  focusableElements = [];
}
