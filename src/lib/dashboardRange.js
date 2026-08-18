const TZ = 'Asia/Kolkata';
const OFFSET = '+05:30';

function ymdInIst(date = new Date()) {
    return new Intl.DateTimeFormat('en-CA', {
        timeZone: TZ,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
    }).format(date);
}

function istMidnight(ymd) {
    return new Date(`${ymd}T00:00:00${OFFSET}`);
}

function addDaysYmd(ymd, days) {
    const d = istMidnight(ymd);
    d.setTime(d.getTime() + days * 24 * 60 * 60 * 1000);
    return ymdInIst(d);
}

/**
 * Calendar bounds in IST for dashboard filters.
 * `to` is exclusive (start of the day after the last included day).
 */
export function resolveDashboardRange(range, from, to) {
    const today = ymdInIst();
    const key = String(range || 'today').toLowerCase();

    if (key === 'overall') {
        return { key: 'overall', from: null, to: null, label: 'Overall' };
    }

    if (key === 'custom') {
        const startYmd = from && /^\d{4}-\d{2}-\d{2}$/.test(from) ? from : today;
        let endYmd = to && /^\d{4}-\d{2}-\d{2}$/.test(to) ? to : startYmd;
        if (endYmd < startYmd) endYmd = startYmd;
        return {
            key: 'custom',
            from: istMidnight(startYmd),
            to: istMidnight(addDaysYmd(endYmd, 1)),
            label: `${startYmd} → ${endYmd}`,
            fromYmd: startYmd,
            toYmd: endYmd,
        };
    }

    if (key === 'week') {
        const now = istMidnight(today);
        // Monday-start week in IST
        const weekday = new Intl.DateTimeFormat('en-US', { timeZone: TZ, weekday: 'short' }).format(new Date());
        const map = { Mon: 0, Tue: 1, Wed: 2, Thu: 3, Fri: 4, Sat: 5, Sun: 6 };
        const offset = map[weekday] ?? 0;
        const startYmd = addDaysYmd(today, -offset);
        return {
            key: 'week',
            from: istMidnight(startYmd),
            to: istMidnight(addDaysYmd(today, 1)),
            label: 'This week',
        };
    }

    if (key === 'month') {
        const startYmd = `${today.slice(0, 7)}-01`;
        return {
            key: 'month',
            from: istMidnight(startYmd),
            to: istMidnight(addDaysYmd(today, 1)),
            label: 'This month',
        };
    }

    return {
        key: 'today',
        from: istMidnight(today),
        to: istMidnight(addDaysYmd(today, 1)),
        label: 'Today',
        fromYmd: today,
        toYmd: today,
    };
}

export function trendUnit(rangeKey, from, to) {
    if (rangeKey === 'today') return 'hour';
    if (rangeKey === 'overall') return 'month';
    if (rangeKey === 'custom' && from && to) {
        const days = (to - from) / (24 * 60 * 60 * 1000);
        return days > 62 ? 'month' : 'day';
    }
    return 'day';
}

export { TZ };
