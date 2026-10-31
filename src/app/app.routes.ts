import { Routes } from '@angular/router';
import { authGuard } from './core/auth/auth.guard';
import { guestGuard } from './core/auth/guest.guard';

const login = () => import('./features/login/login').then((m) => m.Login);
const signup = () => import('./features/signup/signup').then((m) => m.Signup);
const home = () => import('./features/home/home').then((m) => m.Home);

export const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    loadComponent: () => import('./features/landing/landing').then((m) => m.Landing),
    canActivate: [guestGuard],
  },
  { path: 'connexion', loadComponent: login, canActivate: [guestGuard] },
  { path: 'inscription', loadComponent: signup, canActivate: [guestGuard] },
  { path: 'accueil', loadComponent: home, canActivate: [authGuard] },
  {
    path: '**',
    loadComponent: () => import('./features/not-found/not-found').then((m) => m.NotFound),
  },
];
