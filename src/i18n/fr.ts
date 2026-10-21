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
    startPeriodToday: "Mes règles commencent aujourd'hui",
    endPeriodToday: "Mes règles se terminent aujourd'hui",
    periodOngoing: (n: number) => (n === 1 ? 'Premier jour des règles' : `${n}e jour des règles`),
    quickActions: 'Actions rapides',
    logSymptoms: '+ Symptômes du jour',
    openCalendar: 'Voir le calendrier',
    summaryTitle: "Résumé d'aujourd'hui",
    summaryEmpty: "Rien n'a encore été noté aujourd'hui.",
    disclaimer:
      "Les estimations d'Orsa se basent uniquement sur les données que tu saisis. Elles ne remplacent pas l'avis d'un professionnel de santé.",
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
      (count > 1 ? `, variation d'environ ± ${days(sd)}.` : '.'),
    excludedCycles: (n: number) =>
      `${n} ${plural(n, 'cycle inhabituel a été écarté', 'cycles inhabituels ont été écartés')} du calcul (moins de 15 ou plus de 90 jours).`,
    late: (n: number) => `Tes règles ont ${days(n)} de retard par rapport à l'estimation.`,
    lateContext:
      "Un retard peut avoir de nombreuses explications : variation naturelle du cycle, stress, manque de sommeil, voyage, changement de rythme, maladie récente, variation de poids, sport intense, arrêt ou changement de contraception, SOPK ou autres facteurs hormonaux, ou encore une grossesse si elle est possible. En cas de doute ou d'inquiétude, un professionnel de santé peut t'aider.",
    ovulationTitle: 'Ovulation',
    ovulationWindow: (from: string, to: string) => `Estimée entre le ${from} et le ${to}`,
  },
  settings: {
    themeTitle: 'Apparence',
    themes: { system: 'Comme le système', light: 'Clair', dark: 'Sombre' } satisfies Record<ThemePreference, string>,
  },
};

export type Translations = typeof fr;
