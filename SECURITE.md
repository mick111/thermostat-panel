# Sécurité et token

## Le token est visible côté client

Le fichier **config.js** est envoyé tel quel au navigateur. Toute personne qui peut charger la page du panneau peut donc voir le token (affichage du code source, onglet Réseau des outils de développement, etc.). C’est une limite des applications web « statiques » qui appellent une API avec un jeton dans le frontend.

## Mesures recommandées

1. **Limiter l’accès à l’URL du panneau**
   - Réserver le panneau à votre réseau local (Wi‑Fi maison, VPN) si possible.
   - Éviter de partager le lien publiquement.

2. **Utiliser un jeton dédié**
   - Créez un **Long-Lived Access Token** réservé au panneau (Profil HA → Créer un jeton, nom ex. « Thermostat panel »).
   - En cas de fuite ou de doute, révoquez ce jeton dans Home Assistant et recréez-en un.

3. **Droits minimaux**
   - Le compte HA associé au jeton peut être un utilisateur avec uniquement les droits nécessaires (accès aux entités climate concernées), pour limiter la portée en cas de compromission. Voir la section *Limiter les droits d’un utilisateur HA* ci‑dessous.

4. **Ne pas committer le token**
   - Gardez votre vrai `config.js` (avec le token) hors du dépôt Git. Utilisez `config.example.js` comme modèle et ajoutez `config.js` dans `.gitignore` si vous versionnez le projet.

## Limiter les droits d’un utilisateur HA à certaines entités

Home Assistant permet d’associer des utilisateurs à des **groupes** dont la **politique** (policy) définit quelles entités ils peuvent lire ou contrôler. En pratique :

- **Paramètres → Personnes et accès → Utilisateurs** : créez un utilisateur dédié au panneau (ou utilisez un compte existant non‑propriétaire).
- Le **propriétaire** (owner) a toujours tous les droits ; les restrictions ne s’appliquent qu’aux autres comptes.
- Les permissions sont portées par des **groupes**. Un utilisateur peut appartenir à un ou plusieurs groupes (ex. `system-users` = utilisateur standard). Les politiques des groupes sont fusionnées (si un groupe autorise une entité, l’utilisateur l’a).

### Structure des politiques (pour utilisateurs avancés)

Les politiques sont des dictionnaires JSON. Exemple pour n’autoriser que la lecture et le contrôle du thermostat :

```json
{
  "entities": {
    "entity_ids": {
      "climate.thermostat": { "read": true, "control": true }
    }
  }
}
```

Vous pouvez aussi autoriser tout un **domaine** (ex. `climate`) avec `"domains": { "climate": true }`, ou cibler des **zones** (`area_ids`) ou **appareils** (`device_ids`).

### Où configurer

- **Interface** : selon votre version de HA, une partie de la gestion des groupes/utilisateurs peut être dans **Paramètres → Personnes et accès** (onglet Utilisateurs, puis groupe de l’utilisateur). Le détail des politiques (entity_ids, domains, etc.) n’est pas toujours exposé dans l’UI.
- **Fichiers** : les groupes et leurs politiques sont stockés dans le répertoire de configuration HA, dans `.storage/auth` (et liés aux utilisateurs). Modifier ces fichiers à la main est possible mais délicat ; faites une sauvegarde et consultez la [doc développeur sur les permissions](https://developers.home-assistant.io/docs/auth_permissions).
- **Auth provider « Command line »** : si vous authentifiez des utilisateurs via un script (auth provider `command_line`), vous pouvez renvoyer `group: system-users` pour en faire un utilisateur non‑admin ; les politiques détaillées restent à définir côté groupes dans HA.

Une fois un utilisateur restreint à certaines entités, créez un **Long-Lived Access Token** depuis *son* profil (et non celui du propriétaire) et utilisez ce jeton dans le panneau. Si le token fuit, l’attaquant ne pourra agir que sur les entités autorisées pour ce compte.

**Note** : la doc officielle indique que les comptes non‑propriétaires ont, pour l’instant, le même accès que le propriétaire ; les restrictions par groupe/politique sont en cours d’évolution. Vérifiez le comportement sur votre version et les [release notes](https://www.home-assistant.io/blog/).

## Alternative (plus complexe)

Pour ne pas exposer de token dans le navigateur, il faudrait faire passer les appels API par un petit serveur (proxy) qui stocke le token côté serveur et que le frontend appelle sans token. Cela sort du cadre de ce panneau minimaliste.
