export type ToastTone = 'info' | 'success' | 'error';

export type ToastItem = {
  id: number;
  message: string;
  tone: ToastTone;
};

let nextId = 1;

class ToastState {
  items = $state<ToastItem[]>([]);

  push(message: string, tone: ToastTone = 'info', duration = 4000) {
    const id = nextId++;
    this.items = [...this.items, { id, message, tone }];
    setTimeout(() => this.dismiss(id), duration);
  }

  dismiss(id: number) {
    this.items = this.items.filter((item) => item.id !== id);
  }
}

export const toastState = new ToastState();
