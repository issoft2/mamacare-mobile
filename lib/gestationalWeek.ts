const MS_PER_DAY = 86_400_000;

function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function parseIsoDate(value?: string | null): Date | null {
  if (!value) {
    return null;
  }

  const parts = value.split("-");
  if (parts.length >= 3) {
    const year = Number(parts[0]);
    const month = Number(parts[1]);
    const day = Number(parts[2]);
    if (
      Number.isFinite(year) &&
      Number.isFinite(month) &&
      Number.isFinite(day)
    ) {
      return new Date(year, month - 1, day);
    }
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return null;
  }
  return startOfDay(parsed);
}

function clampWeek(week: number): number {
  return Math.max(1, Math.min(42, week));
}

export function calculateGestationalWeek(params: {
  estimatedDueDate?: string | null;
  lmpDate?: string | null;
  fallbackWeek?: number | null;
  now?: Date;
}): number | null {
  const now = startOfDay(params.now ?? new Date());

  const edd = parseIsoDate(params.estimatedDueDate);
  if (edd) {
    const daysUntilDue = Math.floor((edd.getTime() - now.getTime()) / MS_PER_DAY);
    const weekFromEdd = 40 - Math.floor(daysUntilDue / 7);
    return clampWeek(weekFromEdd);
  }

  const lmp = parseIsoDate(params.lmpDate);
  if (lmp) {
    const daysSinceLmp = Math.floor((now.getTime() - lmp.getTime()) / MS_PER_DAY);
    const weekFromLmp = Math.floor(daysSinceLmp / 7) + 1;
    return clampWeek(weekFromLmp);
  }

  if (typeof params.fallbackWeek === "number") {
    return clampWeek(params.fallbackWeek);
  }

  return null;
}
