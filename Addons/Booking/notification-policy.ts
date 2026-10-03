import type { BookingConfig } from './settings';
export const validBookingEmail = (email: string) => email.length <= 254 && /^[^\s@,;:\r\n]+@[^\s@,;:\r\n]+\.[^\s@,;:\r\n]+$/.test(email);
export function calendarForRecipient(config: BookingConfig, selected: boolean, role: string) {
    return (config.calendarMode === 'ALL' || selected) && (config.calendarRecipients === 'BOTH' || config.calendarRecipients === role);
}
export function bookingNotificationText(booking: { customerName: string; title: string; status: string; startTime: Date; endTime: Date; timeZone: string; platform: string; meetingUrl: string; meetingInstructions: string; category: string; email?: string; phone?: string }, calendarLink = '') {
    let zone = booking.timeZone || 'Europe/Sofia';
    try { new Intl.DateTimeFormat('en', { timeZone: zone }); } catch { zone = 'Europe/Sofia'; }
    const format = new Intl.DateTimeFormat('bg-BG', { dateStyle: 'medium', timeStyle: 'short', timeZone: zone });
    const status: Record<string, string> = { PENDING: 'Очаква одобрение / Awaiting approval', CONFIRMED: 'Потвърдена / Confirmed', CANCELLED: 'Отменена / Cancelled', REJECTED: 'Отхвърлена / Rejected', RESCHEDULED: 'Преместена / Rescheduled' };
    const platform = booking.platform === 'CALDIY' ? 'Според избора в Cal.diy / Selected in Cal.diy' : booking.platform.replace(/_/g, ' ');
    return `Здравей / Hello ${booking.customerName},\n\n${booking.title}\n${booking.email ? `Имейл / Email: ${booking.email}\n` : ''}${booking.phone ? `Телефон / Phone: ${booking.phone}\n` : ''}${booking.category ? `Категория / Category: ${booking.category}\n` : ''}Статус / Status: ${status[booking.status] || booking.status}\n${format.format(booking.startTime)} - ${format.format(booking.endTime)} (${zone})\nПлатформа / Platform: ${platform}\n${booking.status === 'CONFIRMED' ? (booking.meetingUrl ? `Връзка за срещата / Meeting link: ${booking.meetingUrl}\n` : 'Връзката или начинът за свързване ще бъдат изпратени от организатора. / The organizer will send the joining details.\n') : ''}${booking.meetingInstructions ? `\n${booking.meetingInstructions}\n` : ''}${calendarLink ? `\nКалендар / Calendar: ${calendarLink}\n` : ''}\nПри чакаща заявка часът още не е потвърден. / Pending requests are not confirmed appointments.\nЗа отказ или промяна използвай оригиналния имейл от Cal.diy. / Use your original Cal.diy email to cancel or reschedule.\n\nNecrotixLab`;
}
