export type BookingContact = { firstName: string; lastName: string; email: string; phone: string };
export function normalizeBookingContact(value: BookingContact): BookingContact | null {
    const firstName = value.firstName.trim(); const lastName = value.lastName.trim();
    const email = value.email.trim().toLowerCase(); const phone = value.phone.replace(/[\s().-]/g, '');
    const name = /^[\p{L}\p{M}][\p{L}\p{M} '\u2019-]{0,79}$/u;
    if (!name.test(firstName) || !name.test(lastName) || email.length > 254 || !/^[^\s@,;:]+@[^\s@,;:]+\.[^\s@,;:]+$/.test(email) || !/^\+[1-9]\d{6,14}$/.test(phone)) return null;
    return { firstName, lastName, email, phone };
}
export function bookingContactUrl(url: string, contact: BookingContact) {
    const normalized = normalizeBookingContact(contact);
    if (!normalized) throw new Error('Enter two names, a valid email and a phone number with country code.');
    const result = new URL(url);
    result.searchParams.set('name', `${normalized.firstName} ${normalized.lastName}`);
    result.searchParams.set('email', normalized.email);
    result.searchParams.set('attendeePhoneNumber', normalized.phone);
    return result.toString();
}
