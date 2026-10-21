import { fr } from '../fr';

describe('French prediction wording', () => {
  it('explains the basis of an estimate without odd "± 0"', () => {
    expect(fr.prediction.basisHistory(1, 29, 0)).toBe('Basé sur ton dernier cycle : durée moyenne de 29 jours.');
    expect(fr.prediction.basisHistory(3, 28, 0)).toBe('Basé sur tes 3 derniers cycles : durée moyenne de 28 jours, avec très peu de variation.');
    expect(fr.prediction.basisHistory(6, 30, 1)).toBe("Basé sur tes 6 derniers cycles : durée moyenne de 30 jours, variation d'environ ± 1 jour.");
  });

  it('always words predictions as estimates', () => {
    expect(fr.prediction.nextPeriodIn(9)).toMatch(/^Estimées/);
    for (const [phase, label] of Object.entries(fr.prediction.phases)) {
      if (phase !== 'menstruation' && phase !== 'unknown') expect(label).toMatch(/estimée/);
    }
  });

  it('never presents a late period as a pregnancy', () => {
    expect(fr.prediction.late(5)).not.toMatch(/grossesse|enceinte/i);
    expect(fr.prediction.lateContext).toMatch(/grossesse si elle est possible/);
    expect(fr.prediction.lateContext.indexOf('grossesse')).toBeGreaterThan(fr.prediction.lateContext.indexOf('stress'));
  });
});
