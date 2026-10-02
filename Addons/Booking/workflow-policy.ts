export const BOOKING_PROJECT_STATUSES = ['PLANNED', 'IN_PROGRESS', 'WAITING_CUSTOMER', 'COMPLETED', 'CANCELLED'] as const;
export function reminderDue(startTime: Date, status: string, hours: number, email: string, now = new Date()): Date | null {
    if (status !== 'CONFIRMED' || ![1, 24, 48].includes(hours) || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return null;
    const due = new Date(startTime.getTime() - hours * 3600000);
    // Do not send delayed, newly scheduled reminders or reminders for past meetings.
    return due > now ? due : null;
}
export function reminderMessageTime(startTime: Date, timeZone: string) {
    let zone = timeZone || 'Europe/Sofia';
    try { new Intl.DateTimeFormat('en-GB', { timeZone: zone }); } catch { zone = 'Europe/Sofia'; }
    const time = new Intl.DateTimeFormat('en-GB', { dateStyle: 'full', timeStyle: 'short', timeZone: zone }).format(startTime);
    return `${time} (${zone})`;
}
