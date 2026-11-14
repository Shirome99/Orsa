# ORSA

> ⚠️ **Projet privé.** Ce dépôt n'est pas destiné à être partagé publiquement.
>
> ⚠️ **ORSA n'est pas une méthode de contraception.** Les estimations (règles, fenêtre fertile, ovulation) ne doivent jamais être utilisées pour éviter une grossesse. ORSA ne remplace pas un·e professionnel·le de santé et ne pose aucun diagnostic.

ORSA est une application de suivi du cycle menstruel et de la santé hormonale, pensée **local-first** : elle fonctionne sans compte, sans publicité ni tracking, et les données restent sur l'appareil.

Axes forts : confidentialité, personnalisation, compréhension du cycle, cycles irréguliers, SOPK et endométriose, suivi des symptômes, prédictions prudentes et explicables (« Pourquoi cette estimation ? », avec niveau de confiance), export facile des données.

## Stack

- [Expo](https://expo.dev) SDK 58 + React Native 0.88 + React 19
- TypeScript strict, Expo Router (routage par fichiers dans `src/app/`)
- Rendu web via react-native-web — **web d'abord**, puis Android et iOS avec la même base de code
- Stockage local : AsyncStorage (localStorage sur le web) derrière une interface `Repository` (`src/data/`)
- Tests : Jest (`jest-expo`)

Organisation :

| Dossier | Contenu |
|---|---|
| `src/app/` | Écrans (Aujourd'hui, Calendrier, Journal, Analyses, Réglages) |
| `src/components/` | Composants d'interface et design system (`ui/`) |
| `src/domain/` | Logique métier pure : cycle, prédictions, modes de vie, dates (+ tests) |
| `src/data/` | Repository et couche de stockage (+ tests) |
| `src/i18n/` | Textes de l'interface en français (dont tous les textes médicaux, à faire relire) |
| `src/theme/` | Tokens de design, thème clair / sombre |
| `docs/` | Cahier des charges |

## Installer et lancer (web)

Prérequis : Node.js 20 ou plus récent, npm.

```bash
npm install
npx expo start --web
```

L'app s'ouvre sur http://localhost:8081.

Pour désactiver la télémétrie de la CLI Expo (statistiques d'usage de l'outil, aucune donnée de l'app) : définir la variable d'environnement `EXPO_NO_TELEMETRY=1`.

Autres commandes :

```bash
npm test            # tests unitaires
npm run typecheck   # vérification TypeScript (tsc --noEmit)
```

## État d'avancement

Premier MVP web (phases 0 à 9) terminé : onboarding, écran Aujourd'hui, calendrier, saisie des règles, journal de symptômes personnalisable, stockage local persistant, algorithme du cycle selon le mode de vie hormonal.

Prochaines étapes : cycles irréguliers et confirmation de l'ovulation, SOPK, douleurs détaillées / endométriose, analyses et tendances, export / import des données, verrouillage et chiffrement local, PWA, puis passage au mobile (Android / iOS).

## Confidentialité

- Aucune donnée de santé ne doit être commitée : pas d'exports réels, de captures d'écran ou de jeux de données non fictifs. Le `.gitignore` exclut les exports (`*.csv`, `*.pdf`, `*export*.json`…) hors des dossiers de tests / fixtures.
- Sur le web, les données sont pour l'instant stockées **en clair** dans le navigateur ; le verrouillage et le chiffrement local sont prévus en phase 16.
