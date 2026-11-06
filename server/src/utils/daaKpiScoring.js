// Rolls the DAA warehouse's daily KPI entries up into weeks, months and quarters.
// Days are plain 'YYYY-MM-DD' strings throughout; Date objects are only used in UTC
// for calendar maths, so nothing shifts with the server's time zone.

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function toDate(day) {
  return new Date(`${day}T00:00:00Z`);
}

function toDay(date) {
  return date.toISOString().slice(0, 10);
}

function addDays(day, n) {
  const d = toDate(day);
  d.setUTCDate(d.getUTCDate() + n);
  return toDay(d);
}

function startOfWeek(day) {
  const dow = toDate(day).getUTCDay(); // 0 = Sunday
  return addDays(day, dow === 0 ? -6 : 1 - dow); // weeks start on Monday
}

function startOfMonth(day) {
  return `${day.slice(0, 7)}-01`;
}

function startOfQuarter(day) {
  const month = Number(day.slice(5, 7));
  const qMonth = Math.floor((month - 1) / 3) * 3 + 1;
  return `${day.slice(0, 4)}-${String(qMonth).padStart(2, '0')}-01`;
}

function addMonths(day, n) {
  const d = toDate(startOfMonth(day));
  d.setUTCMonth(d.getUTCMonth() + n);
  return toDay(d);
}

function isoWeekNumber(day) {
  const d = toDate(day);
  const dow = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dow);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil(((d - yearStart) / 86400000 + 1) / 7);
}

function round1(n) {
  return Math.round(n * 10) / 10;
}

// The last `count` periods ending with the one containing `today`, oldest first.
// `end` is the period's last calendar day; `effectiveEnd` stops at today.
function buildBuckets(period, today, count) {
  const buckets = [];
  for (let i = count - 1; i >= 0; i -= 1) {
    let start;
    let end;
    let label;
    if (period === 'week') {
      start = addDays(startOfWeek(today), -7 * i);
      end = addDays(start, 6);
      const s = toDate(start);
      label = `Wk ${isoWeekNumber(start)} · ${s.getUTCDate()} ${MONTH_NAMES[s.getUTCMonth()]}`;
    } else if (period === 'month') {
      start = addMonths(today, -i);
      end = addDays(addMonths(start, 1), -1);
      label = `${MONTH_NAMES[Number(start.slice(5, 7)) - 1]} ${start.slice(0, 4)}`;
    } else {
      start = addMonths(startOfQuarter(today), -3 * i);
      end = addDays(addMonths(start, 3), -1);
      label = `Q${Math.floor((Number(start.slice(5, 7)) - 1) / 3) + 1} ${start.slice(0, 4)}`;
    }
    buckets.push({ key: start, label, start, end, effectiveEnd: end < today ? end : today });
  }
  return buckets;
}

// Monday–Friday days from start to end inclusive.
function workingDays(start, end) {
  const days = [];
  for (let day = start; day <= end; day = addDays(day, 1)) {
    const dow = toDate(day).getUTCDay();
    if (dow !== 0 && dow !== 6) days.push(day);
  }
  return days;
}

function meets(def, actual, target) {
  if (actual === null || target === null || target === undefined) return null;
  return def.targetDirection === 'max' ? actual <= target : actual >= target;
}

// One KPI's result for one period. `entries` are that KPI's entries (any range).
function scoreKpi(def, entries, bucket, period) {
  const inBucket = entries.filter((e) => e.day >= bucket.start && e.day <= bucket.effectiveEnd);
  const result = { actual: null, target: def.target ?? null, status: null, detail: '', applicable: true, hasData: inBucket.length > 0 };

  if (def.captureType === 'ratio') {
    const valid = inBucket.filter((e) => e.denominator > 0);
    const num = valid.reduce((s, e) => s + (e.numerator || 0), 0);
    const den = valid.reduce((s, e) => s + e.denominator, 0);
    if (den > 0) {
      result.actual = round1((num / den) * 100);
      result.detail = `${num} of ${den}`;
    }
  } else if (def.captureType === 'checklist') {
    const answered = inBucket.reduce((s, e) => s + (e.checks || []).length, 0);
    const ticked = inBucket.reduce((s, e) => s + (e.checks || []).filter(Boolean).length, 0);
    if (answered > 0) {
      result.actual = round1((ticked / answered) * 100);
      result.detail = `${ticked} of ${answered} checks`;
    }
  } else if (def.captureType === 'count') {
    // Target is per month: a quarter's target is three months' worth, and a week is
    // too short to judge, so it shows the count without a status.
    // Clerks leave it blank when nothing was reported, so no entry counts as 0.
    result.actual = inBucket.reduce((s, e) => s + (e.count || 0), 0);
    if (period === 'week') result.target = null;
    else if (period === 'quarter' && result.target !== null) result.target *= 3;
  } else if (def.captureType === 'progress') {
    // Quarter-to-date coverage, judged against how far through the quarter we are
    // (87% by quarter end means ~29% is on track one month in).
    const qStart = startOfQuarter(bucket.effectiveEnd);
    const qEnd = addDays(addMonths(qStart, 3), -1);
    const counted = entries
      .filter((e) => e.day >= qStart && e.day <= bucket.effectiveEnd)
      .reduce((s, e) => s + (e.count || 0), 0);
    const inPeriod = inBucket.reduce((s, e) => s + (e.count || 0), 0);
    if (!def.progressBase) {
      result.detail = 'Set the total bin locations on the Targets page';
    } else {
      result.actual = round1((counted / def.progressBase) * 100);
      result.detail = `${counted} of ${def.progressBase} locations this quarter (${inPeriod} in this period)`;
      if (result.target !== null) {
        const elapsed = (toDate(bucket.effectiveEnd) - toDate(qStart)) / 86400000 + 1;
        const total = (toDate(qEnd) - toDate(qStart)) / 86400000 + 1;
        result.target = round1(result.target * Math.min(1, elapsed / total));
      }
    }
  } else if (def.captureType === 'value') {
    if (period === 'week') {
      result.applicable = false;
      result.target = null;
    } else {
      // Monthly figure: the month's own entry, or for a quarter its latest month.
      const latest = inBucket.filter((e) => e.value !== null && e.value !== undefined).sort((a, b) => (a.day < b.day ? 1 : -1))[0];
      if (latest) {
        result.actual = latest.value;
        if (period === 'quarter') result.detail = `${MONTH_NAMES[Number(latest.day.slice(5, 7)) - 1]} figure`;
      }
    }
  }

  result.status = meets(def, result.actual, result.target);
  return result;
}

function summarize(definitions, entries, period, today, count) {
  const buckets = buildBuckets(period, today, count);
  const byKpi = new Map(definitions.map((d) => [d.key, []]));
  for (const e of entries) {
    if (byKpi.has(e.kpiKey)) byKpi.get(e.kpiKey).push(e);
  }
  const dailyKeys = new Set(definitions.filter((d) => d.frequency === 'daily').map((d) => d.key));
  const capturedDaySet = new Set(entries.filter((e) => dailyKeys.has(e.kpiKey)).map((e) => e.day));

  return buckets.map((bucket) => {
    const working = bucket.start <= bucket.effectiveEnd ? workingDays(bucket.start, bucket.effectiveEnd) : [];
    const kpis = {};
    for (const def of definitions) {
      kpis[def.key] = scoreKpi(def, byKpi.get(def.key), bucket, period);
    }
    return {
      key: bucket.key,
      label: bucket.label,
      start: bucket.start,
      end: bucket.end,
      workingDays: working.length,
      capturedDays: working.filter((d) => capturedDaySet.has(d)).length,
      missedDays: working.filter((d) => !capturedDaySet.has(d)),
      kpis,
    };
  });
}

module.exports = {
  summarize,
  scoreKpi,
  buildBuckets,
  startOfMonth,
  startOfQuarter,
  addMonths,
  addDays,
};
