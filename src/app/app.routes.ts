import { Routes } from '@angular/router';
import { authGuard } from './core/auth/auth.guard';
import { guestGuard } from './core/auth/guest.guard';

const placeholder = () => import('./features/placeholder/placeholder').then((m) => m.Placeholder);

export const routes: Routes = [
  { path: '', pathMatch: 'full', loadComponent: placeholder, canActivate: [guestGuard] },
  { path: 'connexion', loadComponent: placeholder, canActivate: [guestGuard] },
  { path: 'inscription', loadComponent: placeholder, canActivate: [guestGuard] },
  { path: 'accueil', loadComponent: placeholder, canActivate: [authGuard] },
  { path: '**', loadComponent: placeholder },
];
