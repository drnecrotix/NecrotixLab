export type BookingCalendarEvent = { id: string; title: string; status: string; startTime: Date; endTime: Date; eventAt: Date; platform?: string; meetingUrl?: string; meetingInstructions?: string; calendarUid?: string; calendarSequence?: number };
export function canAddBookingToCalendar(event: BookingCalendarEvent) {
    return ['CONFIRMED', 'COMPLETED'].includes(event.status) && Number.isFinite(+event.startTime) && event.endTime > event.startTime;
}
function eventDetails(event: BookingCalendarEvent) {
    return ['NecrotixLab appointment. Use your original booking confirmation to cancel or reschedule.', event.platform && `Platform: ${event.platform.replace(/_/g, ' ')}`, event.meetingUrl, event.meetingInstructions].filter(Boolean).join('\n');
}
function stamp(date: Date) { return date.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}Z$/, 'Z'); }
export function bookingCalendarLinks(event: BookingCalendarEvent) {
    if (!canAddBookingToCalendar(event)) throw new Error('Booking is not confirmed');
    const google = new URL('https://calendar.google.com/calendar/r/eventedit');
    google.searchParams.set('text', event.title);
    google.searchParams.set('dates', `${stamp(event.startTime)}/${stamp(event.endTime)}`);
    google.searchParams.set('details', eventDetails(event));
    if (event.meetingUrl) google.searchParams.set('location', event.meetingUrl);
    const outlook = (host: string) => {
        const url = new URL(`https://${host}/calendar/0/deeplink/compose`);
        url.searchParams.set('path', '/calendar/action/compose'); url.searchParams.set('rru', 'addevent');
        url.searchParams.set('subject', event.title); url.searchParams.set('body', eventDetails(event));
        if (event.meetingUrl) url.searchParams.set('location', event.meetingUrl);
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
        `UID:${escapeText(event.calendarUid || `${event.id}@necrotixlab.com`)}`, `SEQUENCE:${event.calendarSequence || 0}`, `DTSTAMP:${stamp(event.eventAt)}`, `LAST-MODIFIED:${stamp(event.eventAt)}`,
        `DTSTART:${stamp(event.startTime)}`, `DTEND:${stamp(event.endTime)}`, `SUMMARY:${escapeText(event.title)}`,
        `DESCRIPTION:${escapeText(eventDetails(event))}`, ...(event.meetingUrl ? [`LOCATION:${escapeText(event.meetingUrl)}`] : []), 'STATUS:CONFIRMED', 'CLASS:PRIVATE', 'END:VEVENT', 'END:VCALENDAR'].map(foldCalendarLine).join('\r\n') + '\r\n';
}

export function bookingCalendarInvitation(event: BookingCalendarEvent, organizer: string, attendee: string) {
    const email = /^[^\s@,;:\r\n]+@[^\s@,;:\r\n]+\.[^\s@,;:\r\n]+$/;
    if (!email.test(organizer) || !email.test(attendee)) throw new Error('Invalid calendar email');
    const cancelled = ['CANCELLED', 'REJECTED', 'RESCHEDULED'].includes(event.status);
    if (!cancelled && event.status !== 'CONFIRMED') throw new Error('Only confirmed bookings create invitations');
    const base = bookingCalendarIcs({ ...event, status: 'CONFIRMED' });
    const method = cancelled ? 'CANCEL' : 'REQUEST';
    return base.replace('CALSCALE:GREGORIAN\r\n', `CALSCALE:GREGORIAN\r\nMETHOD:${method}\r\n`)
        .replace('STATUS:CONFIRMED\r\n', `STATUS:${cancelled ? 'CANCELLED' : 'CONFIRMED'}\r\n`)
        .replace('END:VEVENT\r\n', [`ORGANIZER:mailto:${organizer}`, `ATTENDEE;RSVP=TRUE:mailto:${attendee}`].map(foldCalendarLine).join('\r\n') + '\r\nEND:VEVENT\r\n');
}

export function bookingCalendarCollection(events: BookingCalendarEvent[]) {
    if (!events.length || events.length > 200) throw new Error('Select between 1 and 200 confirmed appointments');
    const entries = events.map(event => bookingCalendarIcs(event).split('BEGIN:VEVENT\r\n')[1].split('END:VCALENDAR')[0]);
    return ['BEGIN:VCALENDAR\r\nVERSION:2.0\r\nPRODID:-//NecrotixLab//Booking//EN\r\nCALSCALE:GREGORIAN\r\n', ...entries.map(entry => `BEGIN:VEVENT\r\n${entry}`), 'END:VCALENDAR\r\n'].join('');
}
