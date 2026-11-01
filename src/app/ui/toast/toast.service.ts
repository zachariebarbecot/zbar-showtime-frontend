import { Injectable, signal } from '@angular/core';

const DISPLAY_MS = 5000;

@Injectable({ providedIn: 'root' })
export class ToastService {
  private timer?: ReturnType<typeof setTimeout>;

  readonly message = signal<string | null>(null);

  show(message: string): void {
    this.message.set(message);
    clearTimeout(this.timer);
    this.timer = setTimeout(() => this.dismiss(), DISPLAY_MS);
  }

  dismiss(): void {
    this.message.set(null);
  }
}
