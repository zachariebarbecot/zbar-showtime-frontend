import { Injectable, signal } from '@angular/core';

const DISPLAY_MS = 5000;

@Injectable({ providedIn: 'root' })
export class ToastService {
  readonly message = signal<string | null>(null);

  show(message: string): void {
    this.message.set(message);
    setTimeout(() => this.dismiss(), DISPLAY_MS);
  }

  dismiss(): void {
    this.message.set(null);
  }
}
