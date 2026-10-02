export type BookingCalendarEvent = { id: string; title: string; status: string; startTime: Date; endTime: Date; eventAt: Date };
export function canAddBookingToCalendar(event: BookingCalendarEvent) {
    return ['CONFIRMED', 'COMPLETED'].includes(event.status) && Number.isFinite(+event.startTime) && event.endTime > event.startTime;
}
const details = 'NecrotixLab appointment. Use your original booking confirmation to cancel or reschedule.';
function stamp(date: Date) { return date.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}Z$/, 'Z'); }
export function bookingCalendarLinks(event: BookingCalendarEvent) {
    if (!canAddBookingToCalendar(event)) throw new Error('Booking is not confirmed');
    const google = new URL('https://calendar.google.com/calendar/r/eventedit');
    google.searchParams.set('text', event.title);
    google.searchParams.set('dates', `${stamp(event.startTime)}/${stamp(event.endTime)}`);
    google.searchParams.set('details', details);
    const outlook = (host: string) => {
        const url = new URL(`https://${host}/calendar/0/deeplink/compose`);
        url.searchParams.set('path', '/calendar/action/compose'); url.searchParams.set('rru', 'addevent');
        url.searchParams.set('subject', event.title); url.searchParams.set('body', details);
        url.searchParams.set('startdt', event.startTime.toISOString()); url.searchParams.set('enddt', event.endTime.toISOString());
        return url.toString();
    };
    return { google: google.toString(), outlook: outlook('outlook.live.com'), microsoft365: outlook('outlook.office.com') };
}
function escapeText(value: string) {
    return value.replace(/\\/g, '\\\\').replace(/\r\n|\r|\n/g, '\\n').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/g, '');
}
// RFC 5545 folding counts UTF-8 octets, without splitting a code point.
export function foldCalendarLine(line: string) {
    const encoder = new TextEncoder(); let folded = ''; let bytes = 0;
    for (const character of line) {
        const width = encoder.encode(character).length;
        if (bytes + width > 75) { folded += '\r\n '; bytes = 1; }
        folded += character; bytes += width;
    }
    return folded;
}
export function bookingCalendarIcs(event: BookingCalendarEvent) {
    if (!canAddBookingToCalendar(event)) throw new Error('Booking is not confirmed');
    return ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//NecrotixLab//Booking//EN', 'CALSCALE:GREGORIAN', 'BEGIN:VEVENT',
        `UID:${escapeText(event.id)}@necrotixlab.com`, `DTSTAMP:${stamp(event.eventAt)}`, `LAST-MODIFIED:${stamp(event.eventAt)}`,
        `DTSTART:${stamp(event.startTime)}`, `DTEND:${stamp(event.endTime)}`, `SUMMARY:${escapeText(event.title)}`,
        `DESCRIPTION:${escapeText(details)}`, 'STATUS:CONFIRMED', 'CLASS:PRIVATE', 'END:VEVENT', 'END:VCALENDAR'].map(foldCalendarLine).join('\r\n') + '\r\n';
}
