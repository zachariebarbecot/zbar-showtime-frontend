import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { Meta } from '@angular/platform-browser';
import { AuthService } from '../../core/auth/auth.service';
import { Button } from '../../ui/button/button';
import { Logo } from '../../ui/logo/logo';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-not-found',
  imports: [Button, Logo],
  templateUrl: './not-found.html',
  styleUrl: './not-found.css',
})
export class NotFound {
  private readonly auth = inject(AuthService);

  protected readonly home = computed(() => (this.auth.isAuthenticated() ? '/accueil' : '/'));
  protected readonly bulbs = Array.from({ length: 9 }, (_, index) => index);

  constructor() {
    inject(Meta).updateTag({ name: 'robots', content: 'noindex' });
  }
}
