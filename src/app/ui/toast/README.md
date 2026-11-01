# Toast

Message bref et non bloquant qui prévient d'un échec sans quitter la page. Extension du design system : aucun token nouveau.

## Usage

- `ToastService.show(message)` depuis n'importe quel code ; `dismiss()` pour le fermer.
- `<app-toast />` est monté une seule fois dans `App`. Ne pas le monter ailleurs.
- Un seul toast à la fois : un nouveau message remplace l'actuel et relance les 5 s.
- Disparaît seul après 5 s ou au clic sur Fermer.
- Pas de file d'attente, pas d'action dans le toast, pas de variante succès.

## Contenu

- Une phrase qui dit ce qui a échoué et quoi faire (« L'ajout a échoué. Réessaie dans un instant. »).
- Jamais de `detail` ni de `traceId` du backend.

## Accessibilité

- La région `role="status"` (`aria-live="polite"`) reste dans le DOM, vide, entre deux toasts, pour que le message soit annoncé.
- Bouton Fermer : icône `close` (`zb-icon-btn zb-icon-btn-sm`), nom accessible « Fermer ».

## Styles (`styles/ui.css`, classe `.zb-toast`)

| Propriété       | Token                               |
| --------------- | ----------------------------------- |
| Fond            | `surface-raised`                    |
| Bordure         | `line-strong`                       |
| Texte           | `ink` (`font-sans`, 14/20)          |
| Rayon           | `radius-md`                         |
| Ombre           | `shadow-poster`                     |
| Marge à l'écran | `space-8` (`space-4` sur téléphone) |

- Au-delà de 599px : en bas à droite.
- Téléphone (`max-width: 599px`) : en bas, centré.
- Thème : uniquement des tokens, il suit le thème du design system.
