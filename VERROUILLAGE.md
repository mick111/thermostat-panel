# Verrouillage de l’iPad en mode kiosque

Pour que l’iPad ne soit utilisable **que** pour le panneau thermostat (pas Safari, pas d’autres apps, pas de sortie possible sans mot de passe), il faut combiner **Accès guidé** (iOS) et quelques réglages.

---

## 1. Accès guidé (obligatoire)

L’**Accès guidé** verrouille l’appareil sur une seule app. Tant qu’il est activé, on ne peut pas changer d’app ni quitter l’écran sans le code.

### Activer l’Accès guidé (une fois)

1. **Réglages** → **Général** → **Accessibilité** → **Accès guidé**
2. Activer **Accès guidé**
3. Définir un **code d’accès** (à retenir pour sortir du mode kiosque)
4. Optionnel : activer **Réglages d’accessibilité** si vous voulez désactiver des zones tactiles (bouton Accueil, etc.)

### Utilisation au quotidien

1. Ouvrir **Safari** (ou l’icône « Thermostat » si vous avez ajouté la page à l’écran d’accueil).
2. Aller sur l’URL du panneau thermostat (votre serveur qui sert `index.html`).
3. **Triple-clic sur le bouton principal** (Home) pour **démarrer l’Accès guidé**.
4. L’iPad reste alors bloqué sur cette page : pas de barre d’URL, pas de changement d’app.

### Sortir de l’Accès guidé

1. **Triple-clic** sur le bouton principal (Home).
2. Saisir le **code d’accès** défini pour l’Accès guidé.
3. Cliquer sur **Terminer** en haut à gauche.

---

## 2. « Ajouter à l’écran d’accueil »

Pour que le panneau ressemble à une app et s’ouvre en plein écran :

1. Dans Safari, ouvrir la page du thermostat.
2. Appuyer sur l’icône **Partager** (carré avec flèche).
3. Choisir **Sur l’écran d’accueil**.
4. Nommer par ex. « Thermostat » puis **Ajouter**.

Ensuite, lancez **cette icône** puis activez l’**Accès guidé** (triple-clic). L’iPad sera verrouillé sur cette « app » uniquement.

### Mise à jour quand la page est sur l’écran d’accueil

iOS et Safari mettent en cache les pages ajoutées à l’écran d’accueil. Après avoir mis à jour les fichiers sur le serveur (HA), vous pouvez avoir l’impression que l’ancienne version s’affiche encore.

**À faire :**

1. **Incrémenter la version dans `index.html`** : les scripts et la CSS sont chargés avec `?v=1`. Après un déploiement, changez en `?v=2`, puis `?v=3`, etc. (dans les trois endroits : `styles.css?v=…`, `config.js?v=…`, `app.js?v=…`). Recopiez `index.html` sur le serveur. Au prochain chargement, le navigateur téléchargera les nouveaux fichiers.
2. **Supprimer puis recréer le raccourci** : sur l’iPad, maintenir l’icône Thermostat sur l’écran d’accueil → **Supprimer l’app** (ou **Retirer**). Puis dans Safari, rouvrir l’URL du panneau et **Sur l’écran d’accueil** à nouveau.
3. **Effacer les données du site** (si besoin) : Réglages → Safari → Avancé → Données des sites web → chercher votre domaine → supprimer. Puis rouvrir la page et éventuellement la rajouter à l’écran d’accueil.

---

## 3. Réglages recommandés pour un panneau mural

| Réglage | Où | Valeur |
|--------|----|--------|
| **Verrouillage automatique** | Réglages → Affichage et luminosité → Verrouillage auto | **Jamais** (ou 15 min si vous préférez économiser l’écran) |
| **Ne pas déranger** | Centre de contrôle (optionnel) | Activer pour éviter les notifications |
| **Mode avion / Wi‑Fi** | — | Garder le **Wi‑Fi** activé pour que l’iPad joigne Home Assistant |
| **Blocage d’activation (Find My)** | Réglages → [votre compte] → iCloud → Localiser | À garder si vous voulez pouvoir déverrouiller à distance en cas de perte du code |

---

## 4. Résumé du flux de verrouillage

1. Mettre l’app ou la page thermostat sur l’écran d’accueil (optionnel mais pratique).
2. Ouvrir **uniquement** cette page / cette icône.
3. **Triple-clic** sur le bouton principal → **Accès guidé** activé.
4. L’utilisateur ne peut plus utiliser l’iPad pour autre chose ; pour sortir il faut le code d’Accès guidé.

Aucune autre manipulation n’est nécessaire côté application web : le verrouillage est entièrement géré par iOS via l’Accès guidé.
