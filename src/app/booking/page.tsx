import type { Metadata } from 'next';
import Link from 'next/link';
import { BookingScreen } from '@addons/Booking/BookingScreen';
import { bookingAddonConfig } from '@addons/Booking/server';
import { bookingReady } from '@addons/Booking/settings';
export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: 'Book a consultation', description: 'Choose a service and an available appointment with Dr. Necrotix.', robots: { index: false, follow: true } };
export default async function BookingPage() {
    const config = await bookingAddonConfig();
    if (bookingReady(config)) return <BookingScreen config={{ ...config, organizerEmail: '', services: config.services.map(service => ({ ...service, meetingUrl: '', instructions: '' })) }} />;
    return <main className="min-h-screen bg-background px-5 pb-24 pt-36 text-foreground"><div className="mx-auto max-w-2xl"><p className="font-mono text-xs uppercase tracking-widest text-muted-foreground">Appointments</p><h1 className="mt-4 text-4xl font-black tracking-tight">Online booking is not available yet.</h1><p className="mt-5 text-sm leading-7 text-muted-foreground">Contact me to arrange a consultation or discuss your project.</p><Link href="/contact" className="mt-8 inline-flex min-h-11 items-center rounded-lg bg-foreground px-5 text-sm font-bold text-background">Contact me</Link></div></main>;
}
