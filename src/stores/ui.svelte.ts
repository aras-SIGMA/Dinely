function checkLoadedBefore(): boolean {
  try {
    return typeof window !== 'undefined' && sessionStorage.getItem('restolink_has_loaded') === 'true';
  } catch {
    return false;
  }
}

class UIStore {
  isAppReady = $state(checkLoadedBefore());

  setAppReady(ready = true) {
    this.isAppReady = ready;
    if (ready) {
      try {
        sessionStorage.setItem('restolink_has_loaded', 'true');
      } catch {}
    }
  }
}

export const uiStore = new UIStore();
