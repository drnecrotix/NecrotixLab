import { safeMeetingUrl, type BookingConfig } from './settings';
const object = (value: unknown): Record<string, unknown> => value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : {};
const text = (value: unknown, max = 1000) => typeof value === 'string' ? value.trim().slice(0, max) : '';
export function bookingMeetingDetails(payload: Record<string, unknown>, config?: BookingConfig) {
    const responses = object(payload.responses);
    const metadata = object(payload.metadata); const info = object(payload.additionalInformation); const video = object(payload.videoCallData);
    const attendee = object(Array.isArray(payload.attendees) ? payload.attendees[0] : null);
    const organizer = object(payload.organizer);
    const service = config?.services.find(item => item.eventTypeId > 0 && item.eventTypeId === Number(payload.eventTypeId))
        || config?.services.find(item => item.title === text(payload.eventTitle || payload.type));
    const location = text(payload.location);
    const entryPoint = object(Array.isArray(info.entryPoints) ? info.entryPoints.find(item => typeof object(item).uri === 'string') : null);
    const meetingUrl = [metadata.videoCallUrl, video.url, info.hangoutLink, entryPoint.uri, location].map(safeMeetingUrl).find(Boolean) || '';
    // Provider location wins over display settings, which cannot create a conference.
    const source = location.toLowerCase();
    const host = meetingUrl ? new URL(meetingUrl).hostname.toLowerCase() : '';
    const platform = /^(integrations:zoom|zoom)/.test(source) || /(^|\.)zoom\.(us|com)$/.test(host) ? 'ZOOM' : /integrations:google.*meet/.test(source) || host === 'meet.google.com' ? 'GOOGLE_MEET' : /^viber/.test(source) ? 'VIBER' : /^(integrations:.*(teams|office365)|teams)/.test(source) || ['teams.microsoft.com', 'teams.live.com'].includes(host) ? 'TEAMS' : /^phone/.test(source) ? 'PHONE' : service?.platform || 'CALDIY';
    return { phone: text(attendee.phoneNumber || object(responses.attendeePhoneNumber).value || object(responses.phone).value, 40),
        organizerEmail: text(organizer.email, 254).toLowerCase(), servicePath: service?.path || '', category: service?.category || '', platform, meetingUrl,
        meetingInstructions: service?.instructions || (meetingUrl || location.startsWith('integrations:') ? '' : location), calendarUid: text(payload.iCalUID, 255).replace(/[\r\n]/g, '') };
}
