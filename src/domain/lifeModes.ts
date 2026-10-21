/** Rules that depend on the user's life mode (see "Modes de vie hormonaux" in CLAUDE.md). */
import { DEFAULT_TRACKED_ITEMS, type LifeMode, type TrackableItem } from './types';

/** Under hormonal contraception or postpartum, bleedings are not a natural cycle. */
export function usesBleedingVocabulary(mode: LifeMode): boolean {
  return mode === 'hormonalContraception' || mode === 'postpartum';
}

/** Cycles lived in these modes are excluded from the natural-cycle statistics. */
export function isExcludedFromCycleStats(mode: LifeMode): boolean {
  return mode === 'hormonalContraception' || mode === 'postpartum';
}

/** Tracked items proposed by default during the onboarding. */
export function suggestedTrackedItems(mode: LifeMode): TrackableItem[] {
  if (mode === 'perimenopause') return ['flow', 'pain', 'mood', 'sleep', 'hotFlashes', 'nightSweats', 'note'];
  return [...DEFAULT_TRACKED_ITEMS];
}
