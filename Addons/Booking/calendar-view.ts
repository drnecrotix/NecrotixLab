export function shiftBookingMonth(month: string, offset: number) {
    const [year, number] = month.split('-').map(Number);
    const date = new Date(Date.UTC(year, number - 1 + offset, 1));
    return date.toISOString().slice(0, 7);
}
export function bookingMonthDays(month: string) {
    if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(month)) return [];
    const [year, number] = month.split('-').map(Number); const first = new Date(Date.UTC(year, number - 1, 1));
    const blanks = (first.getUTCDay() + 6) % 7; const count = new Date(Date.UTC(year, number, 0)).getUTCDate();
    return [...Array<string | null>(blanks).fill(null), ...Array.from({ length: count }, (_, i) => `${month}-${String(i + 1).padStart(2, '0')}`)];
}
export function bookingMonthRange(month: string) {
    if (!/^(20\d{2})-(0[1-9]|1[0-2])$/.test(month)) return null;
    const start = sofiaMidnight(`${month}-01`);
    const end = sofiaMidnight(`${shiftBookingMonth(month, 1)}-01`);
    return start && end ? { gte: start, lt: end } : null;
}

function sofiaMidnight(day: string) {
    const wanted = Date.parse(`${day}T00:00:00Z`); let instant = wanted;
    const formatter = new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Sofia', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' });
    for (let attempt = 0; attempt < 3; attempt++) {
        const parts = formatter.formatToParts(new Date(instant)); const part = (key: string) => parts.find(item => item.type === key)?.value;
        const wall = Date.parse(`${part('year')}-${part('month')}-${part('day')}T${part('hour')}:${part('minute')}:00Z`);
        const delta = wall - wanted; if (!delta) return new Date(instant); instant -= delta;
    }
    return null;
}
