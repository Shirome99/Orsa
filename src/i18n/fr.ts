/**
 * French UI strings. Every text shown to the user lives here so that the
 * vocabulary can later be customised (e.g. discreet mode) or translated.
 *
 * Product rule: predictions are always worded as estimates, never as facts,
 * and nothing here may read as a medical diagnosis.
 */
import type { FlowLevel, Mood, ThemePreference } from '@/domain/types';

const plural = (n: number, one: string, many: string) => (Math.abs(n) <= 1 ? one : many);
const days = (n: number) => `${n} ${plural(n, 'jour', 'jours')}`;

export const fr = {
  appName: 'Orsa',
  nav: {
    today: "Aujourd'hui",
    calendar: 'Calendrier',
    journal: 'Journal',
    insights: 'Analyses',
    settings: 'Réglages',
  },
  screens: {
    today: { title: "Aujourd'hui" },
    calendar: { title: 'Calendrier' },
    journal: { title: 'Journal' },
    insights: { title: 'Analyses' },
    settings: { title: 'Profil et réglages' },
  },
  common: {
    comingSoon: 'Cet écran arrive bientôt.',
    loading: 'Chargement…',
    save: 'Enregistrer',
    saved: 'Enregistré',
    cancel: 'Annuler',
    notSet: 'Non renseigné',
  },
  flow: {
    label: 'Flux',
    levels: {
      none: 'Aucun',
      spotting: 'Spotting',
      light: 'Léger',
      medium: 'Moyen',
      heavy: 'Abondant',
    } satisfies Record<FlowLevel, string>,
  },
  pain: {
    label: 'Douleur',
    min: 'Aucune douleur',
    max: 'Douleur maximale',
    value: (n: number) => `${n}/10`,
  },
  mood: {
    label: 'Humeur',
    values: {
      calm: 'Calme',
      happy: 'Joyeuse',
      energetic: 'Énergique',
      sad: 'Triste',
      irritable: 'Irritable',
      anxious: 'Anxieuse',
      tired: 'Fatiguée',
    } satisfies Record<Mood, string>,
  },
  note: {
    label: 'Note',
    placeholder: 'Quelque chose à retenir sur cette journée ?',
  },
  today: {
    noCycleTitle: 'Bienvenue dans Orsa',
    noCycleBody:
      "Indique le premier jour de tes règles pour commencer. Orsa calculera ton jour de cycle et des estimations qui s'affineront avec le temps.",
    cycleDay: (n: number) => `Jour ${n} du cycle`,
    periodOngoing: (n: number) => (n === 1 ? 'Premier jour des règles' : `${n}e jour des règles`),
    quickActions: 'Actions rapides',
    logSymptoms: '+ Symptômes du jour',
    openCalendar: 'Voir le calendrier',
    summaryTitle: "Résumé d'aujourd'hui",
    summaryEmpty: "Rien n'a encore été noté aujourd'hui.",
    disclaimer:
      "Les estimations d'Orsa se basent uniquement sur les données que tu saisis. Elles ne remplacent pas l'avis d'un professionnel de santé.",
  },
  journal: {
    previousDay: 'Jour précédent',
    nextDay: 'Jour suivant',
    backToToday: "Aujourd'hui",
    symptomsTitle: 'Symptômes',
    unsaved: 'Modifications non enregistrées',
    savedAt: 'Enregistré',
    clear: 'Tout effacer',
    hint: 'Note seulement ce que tu veux suivre : chaque élément est facultatif.',
  },
  period: {
    title: 'Règles',
    startedOn: 'Mes règles ont commencé ce jour',
    startToday: "Mes règles commencent aujourd'hui",
    endedOn: 'Mes règles se sont terminées ce jour',
    endToday: "Mes règles se terminent aujourd'hui",
    undoEnd: 'Annuler la date de fin',
    remove: 'Supprimer ces règles',
    confirmRemove: 'Confirmer la suppression',
    statusOutside: 'Aucunes règles enregistrées ce jour.',
    statusStart: 'Premier jour de règles enregistré.',
    statusInside: (n: number) => `${n}e jour de règles.`,
    statusEnd: 'Dernier jour de règles enregistré.',
    removeWarning: 'Les symptômes notés sur ces jours seront conservés.',
  },
  calendar: {
    previousMonth: 'Mois précédent',
    nextMonth: 'Mois suivant',
    backToToday: "Aujourd'hui",
    legend: {
      period: 'Règles enregistrées',
      predictedPeriod: 'Règles estimées',
      fertile: 'Fenêtre fertile estimée',
      ovulation: 'Ovulation estimée',
      hasLog: 'Journal rempli',
    },
    estimatesNote:
      'Les jours estimés sont des projections calculées à partir de tes cycles passés. Ils peuvent varier.',
    dayEmpty: 'Rien de noté ce jour-là.',
    editDay: 'Saisir ou modifier ce jour',
    futureDay: 'Ce jour est dans le futur : il ne peut pas encore être rempli.',
    dayLabel: (date: string, details: string[]) => (details.length ? `${date}, ${details.join(', ')}` : date),
  },
  prediction: {
    phases: {
      menstruation: 'Règles',
      follicular: 'Phase folliculaire estimée',
      fertile: 'Fenêtre fertile estimée',
      ovulation: 'Ovulation estimée autour de ce jour',
      luteal: 'Phase lutéale estimée',
      unknown: 'Phase difficile à estimer',
    },
    nextPeriodTitle: 'Prochaines règles',
    nextPeriodIn: (n: number) =>
      n === 0 ? "Estimées autour d'aujourd'hui" : n === 1 ? 'Estimées dans environ 1 jour' : `Estimées dans environ ${n} jours`,
    nextPeriodWindow: (from: string, to: string) =>
      from === to ? `Autour du ${from}` : `Entre le ${from} et le ${to}`,
    confidence: (level: string) => `Niveau de confiance : ${level}`,
    confidenceLevels: { low: 'faible', medium: 'moyen', high: 'élevé' },
    basisDefault: (length: number) =>
      `Pas encore assez d'historique : l'estimation part d'un cycle type de ${days(length)}. Elle deviendra plus personnelle après quelques cycles.`,
    basisHistory: (count: number, mean: number, sd: number) =>
      `Basé sur ${count === 1 ? 'ton dernier cycle' : `tes ${count} derniers cycles`} : durée moyenne de ${days(mean)}` +
      (count < 2 ? '.' : sd === 0 ? ', avec très peu de variation.' : `, variation d'environ ± ${days(sd)}.`),
    excludedCycles: (n: number) =>
      `${n} ${plural(n, 'cycle inhabituel a été écarté', 'cycles inhabituels ont été écartés')} du calcul (moins de 15 ou plus de 90 jours).`,
    late: (n: number) => `Tes règles ont ${days(n)} de retard par rapport à l'estimation.`,
    lateContext:
      "Un retard peut avoir de nombreuses explications : variation naturelle du cycle, stress, manque de sommeil, voyage, changement de rythme, maladie récente, variation de poids, sport intense, arrêt ou changement de contraception, SOPK ou autres facteurs hormonaux, ou encore une grossesse si elle est possible. En cas de doute ou d'inquiétude, un professionnel de santé peut t'aider.",
    phaseTitle: 'Phase du cycle',
    ovulationWindow: (from: string, to: string) => `Ovulation estimée entre le ${from} et le ${to}`,
    howTitle: 'Comment ces estimations sont calculées',
    method:
      "Les prochaines règles sont estimées à partir de la durée moyenne de tes cycles récents ; l'ovulation est placée environ 14 jours avant. Ce ne sont que des estimations : Orsa ne peut ni confirmer une ovulation ni servir de contraception.",
  },
  storage: {
    loading: 'Chargement de tes données…',
    loadError: "Impossible de lire les données enregistrées sur cet appareil.",
    retry: 'Réessayer',
    saveError:
      "La dernière modification n'a pas pu être enregistrée sur cet appareil. Elle sera perdue à la fermeture d'Orsa. Vérifie l'espace disponible ou les réglages de ton navigateur.",
    recovered:
      "Des données enregistrées n'ont pas pu être lues. Elles ont été mises de côté sur cet appareil (pas supprimées) et Orsa repart d'un journal vide.",
  },
  settings: {
    privacyTitle: 'Confidentialité',
    privacyLocal:
      "Tes données restent uniquement sur cet appareil, dans le stockage local de ce navigateur. Aucun compte n'est nécessaire, rien n'est envoyé sur Internet, il n'y a ni publicité ni suivi.",
    privacyBrowserNote:
      "Attention : effacer les données de navigation de ce site, ou utiliser une fenêtre de navigation privée, supprime ou ne conserve pas tes données. Elles ne sont pas encore chiffrées.",
    deleteTitle: 'Supprimer toutes mes données',
    deleteBody: 'Supprime définitivement toutes tes règles, ton journal et tes réglages de cet appareil.',
    deleteButton: 'Supprimer toutes mes données',
    deleteConfirm: 'Oui, tout supprimer définitivement',
    deleteWarning: 'Cette action est irréversible.',
    deleteDone: 'Toutes tes données ont été supprimées.',
    deleteError: "La suppression n'a pas pu aboutir. Réessaie.",
    aboutTitle: 'À propos',
    aboutBody:
      "Orsa t'aide à suivre et comprendre ton cycle. Ses estimations ne sont pas des diagnostics et ne remplacent pas l'avis d'un professionnel de santé. Orsa n'est pas un moyen de contraception.",
    themeTitle: 'Apparence',
    themes: { system: 'Comme le système', light: 'Clair', dark: 'Sombre' } satisfies Record<ThemePreference, string>,
  },
};

export type Translations = typeof fr;
