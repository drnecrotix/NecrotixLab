import type { BookingConfig } from './settings';
export type BusyBooking = { startTime: Date; endTime: Date };
export function localParts(date: Date, timeZone: string) {
    const parts = new Intl.DateTimeFormat('en-CA', { timeZone, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).formatToParts(date);
    const part = (name: string) => parts.find(item => item.type === name)?.value || '';
    return { date: `${part('year')}-${part('month')}-${part('day')}`, time: `${part('hour')}:${part('minute')}` };
}
export function overlaps(start: Date, end: Date, busy: BusyBooking[], buffer: number) {
    const padding = buffer * 60000;
    return busy.some(item => +start < +item.endTime + padding && +end + padding > +item.startTime);
}
export function availableSlots(config: BookingConfig, duration: number, day: string, busy: BusyBooking[], now = new Date()) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(day) || config.blockedDates.includes(day)) return [];
    const anchor = Date.parse(`${day}T00:00:00Z`);
    if (!Number.isFinite(anchor) || new Date(anchor).toISOString().slice(0, 10) !== day || !config.weekdays.includes(new Date(anchor).getUTCDay())) return [];
    const today = localParts(now, config.timeZone).date;
    const lastDay = localParts(new Date(+now + config.horizonDays * 86400000), config.timeZone).date;
    if (day < today || day > lastDay) return [];
    const earliest = +now + config.leadHours * 3600000;
    const result: string[] = [];
    // Enumerate actual UTC instants: DST gaps never appear; repeated hours have distinct values.
    for (let time = anchor - 86400000; time <= anchor + 2 * 86400000; time += 15 * 60000) {
        if (time < earliest) continue;
        const start = new Date(time); const end = new Date(time + duration * 60000);
        const local = localParts(start, config.timeZone); const finish = localParts(end, config.timeZone);
        if (local.date !== day || local.time < config.dayStart || finish.date !== day || finish.time > config.dayEnd || local.time >= config.dayEnd) continue;
        if (!overlaps(start, end, busy, config.bufferMinutes)) result.push(start.toISOString());
    }
    return result;
}
export function localDateTime(value: string, timeZone: string): Date | null {
    if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(value)) return null;
    const anchor = Date.parse(`${value}:00Z`); if (!Number.isFinite(anchor)) return null;
    const matches: Date[] = [];
    for (let time = anchor - 14 * 3600000; time <= anchor + 14 * 3600000; time += 60000) {
        const date = new Date(time); const parts = localParts(date, timeZone);
        if (`${parts.date}T${parts.time}` === value) matches.push(date);
    }
    return matches.length === 1 ? matches[0] : null;
}
