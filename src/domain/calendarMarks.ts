import { addDays, type ISODate } from './dates';
import { periodDisplayEnd } from './records';
import type { DailyLog, PeriodEntry } from './types';

/** What the calendar shows for one day. Predicted marks are estimates, never facts. */
export interface DayMark {
  period?: boolean;
  periodStart?: boolean;
  predictedPeriod?: boolean;
  fertile?: boolean;
  ovulation?: boolean;
  hasLog?: boolean;
}

/** Estimated ranges coming from the cycle prediction (phase 8). */
export interface PredictedRanges {
  nextPeriod?: { start: ISODate; end: ISODate };
  fertileWindow?: { start: ISODate; end: ISODate };
  ovulation?: { start: ISODate; end: ISODate };
}

function eachDay(start: ISODate, end: ISODate, visit: (date: ISODate) => void) {
  for (let d = start; d <= end; d = addDays(d, 1)) visit(d);
}

export function buildDayMarks(
  periods: readonly PeriodEntry[],
  logs: Readonly<Record<ISODate, DailyLog>>,
  todayDate: ISODate,
  predicted: PredictedRanges = {},
): Record<ISODate, DayMark> {
  const marks: Record<ISODate, DayMark> = {};
  const mark = (date: ISODate, patch: DayMark) => {
    marks[date] = { ...marks[date], ...patch };
  };

  if (predicted.fertileWindow) {
    eachDay(predicted.fertileWindow.start, predicted.fertileWindow.end, (d) => mark(d, { fertile: true }));
  }
  if (predicted.ovulation) {
    eachDay(predicted.ovulation.start, predicted.ovulation.end, (d) => mark(d, { ovulation: true }));
  }
  if (predicted.nextPeriod) {
    eachDay(predicted.nextPeriod.start, predicted.nextPeriod.end, (d) => mark(d, { predictedPeriod: true }));
  }

  for (const period of periods) {
    mark(period.startDate, { periodStart: true });
    eachDay(period.startDate, periodDisplayEnd(period, todayDate), (d) =>
      // Recorded data always wins over an estimate for the same day.
      mark(d, { period: true, predictedPeriod: false, fertile: false, ovulation: false }),
    );
  }

  for (const date of Object.keys(logs)) mark(date, { hasLog: true });

  return marks;
}
