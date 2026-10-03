'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowRight, CalendarDays, Clock, ExternalLink } from 'lucide-react';
import { useTheme } from 'next-themes';
import { bookingContactUrl, normalizeBookingContact, type BookingContact } from './intake';
import { bookingEmbedUrl, type BookingConfig } from './settings';
export function BookingScreen({ config, origin }: { config: BookingConfig; origin: string }) {
    const [selected, setSelected] = useState('');
    const [language, setLanguage] = useState<'en' | 'bg'>('en');
    const [contact, setContact] = useState<BookingContact | null>(null);
    const [error, setError] = useState('');
    const [loaded, setLoaded] = useState(false);
    const [slow, setSlow] = useState(false);
    const { resolvedTheme } = useTheme();
    const service = config.services.find(item => item.id === selected) || config.services[0];
    const baseUrl = bookingEmbedUrl(origin, service.path, resolvedTheme === 'dark' ? 'dark' : 'light', language);
    const url = contact ? bookingContactUrl(baseUrl, contact) : baseUrl;
    useEffect(() => { setLoaded(false); setSlow(false); const timer = setTimeout(() => setSlow(true), 12000); return () => clearTimeout(timer); }, [url]);
    const bg = language === 'bg';
    return <main className="min-h-screen bg-background px-4 pb-20 pt-28 text-foreground sm:px-8">
        <div className="mx-auto max-w-7xl">
            <header className="flex flex-wrap items-end justify-between gap-6 border-b border-border pb-8">
                <div className="max-w-2xl"><p className="font-mono text-[10px] uppercase tracking-[.24em] text-muted-foreground">NecrotixLab / {bg ? 'Резервации' : 'Appointments'}</p><h1 className="mt-4 text-4xl font-black tracking-tight sm:text-5xl">{config.title}</h1><p className="mt-4 text-sm leading-7 text-muted-foreground">{config.description}</p></div>
                <label className="text-sm">{bg ? 'Език' : 'Language'} <select value={language} onChange={event => setLanguage(event.target.value as 'en' | 'bg')} className="ml-2 min-h-11 rounded-lg border border-border bg-background px-3"><option value="en">English</option><option value="bg">Български</option></select></label>
            </header>
            <div className="mt-8 grid gap-6 lg:grid-cols-[280px_minmax(0,1fr)]">
                <aside><h2 className="mb-4 text-sm font-bold">{bg ? 'Избери услуга' : 'Choose a service'}</h2><div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
                    {config.services.map(item => <button key={item.id} type="button" aria-pressed={selected === item.id} onClick={() => { setSelected(item.id); setContact(null); }} className={`min-w-0 rounded-xl border p-5 text-left transition-colors motion-safe:transition-all motion-safe:duration-200 motion-safe:hover:-translate-y-0.5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 ${selected === item.id ? 'border-foreground bg-muted shadow-sm' : 'border-border hover:bg-muted/50'}`}><CalendarDays className="size-5" /><h3 className="mt-4 font-bold">{item.title}</h3>{item.category && <p className="mt-2 text-xs text-muted-foreground">{item.category}</p>}<p className="mt-2 text-xs leading-6 text-muted-foreground">{item.description}</p><span className="mt-4 flex items-center gap-2 text-xs"><Clock className="size-3.5" />{item.duration} {bg ? 'мин' : 'min'}<ArrowRight className="ml-auto size-4" /></span></button>)}
                </div><p className="mt-5 text-xs leading-6 text-muted-foreground">{bg ? 'Избери своя часови пояс в календара. Потвърждението и връзките за отказ или преместване се изпращат от booking системата.' : 'Select your timezone in the calendar. The booking system sends confirmation and links to cancel or reschedule.'}</p><Link href="/contact" className="mt-4 inline-block text-xs font-semibold underline">{bg ? 'Нужна ти е помощ?' : 'Need help?'}</Link></aside>
                <section aria-label={bg ? 'Свободни часове' : 'Available appointments'} className="min-w-0 overflow-hidden rounded-2xl border border-border bg-background">
                    <form className="space-y-4 border-b border-border p-5 sm:p-6" onChange={() => setContact(null)} onSubmit={event => {
                        event.preventDefault();
                        const form = new FormData(event.currentTarget);
                        const details = normalizeBookingContact({ firstName: String(form.get('firstName') || ''), lastName: String(form.get('lastName') || ''), email: String(form.get('email') || ''), phone: String(form.get('phone') || '') });
                        if (!details || !selected) { setError(bg ? 'Попълни две имена, валиден имейл и телефон с код на държавата и избери услуга.' : 'Enter two names, a valid email and a phone with country code, and choose a service.'); return; }
                        setError(''); setContact(details);
                    }}>
                        <h2 className="font-semibold">{bg ? '1. Твоите данни и услуга' : '1. Your details and service'}</h2>
                        <div className="grid gap-4 sm:grid-cols-2">{[['firstName', bg ? 'Име' : 'First name', 'given-name'], ['lastName', bg ? 'Фамилия' : 'Last name', 'family-name']].map(([name, label, autoComplete]) => <label key={name} className="text-sm">{label}<input required name={name} autoComplete={autoComplete} maxLength={80} className="mt-2 min-h-11 w-full rounded-lg border border-border bg-background px-3" /></label>)}
                            <label className="text-sm">{bg ? 'Имейл' : 'Email'}<input required type="email" name="email" autoComplete="email" maxLength={254} className="mt-2 min-h-11 w-full rounded-lg border border-border bg-background px-3" /></label>
                            <label className="text-sm">{bg ? 'Телефон с код на държавата' : 'Phone with country code'}<input required type="tel" name="phone" autoComplete="tel" placeholder="+359..." maxLength={30} className="mt-2 min-h-11 w-full rounded-lg border border-border bg-background px-3" /></label>
                        </div>
                        <label className="block text-sm">{bg ? 'Категория / услуга' : 'Category / service'}<select required value={selected} onChange={event => setSelected(event.target.value)} className="mt-2 min-h-11 w-full rounded-lg border border-border bg-background px-3"><option value="">{bg ? 'Избери услуга' : 'Choose a service'}</option>{config.services.map(item => <option key={item.id} value={item.id}>{item.category ? `${item.category} / ` : ''}{item.title}</option>)}</select></label>
                        {selected && <p className="text-sm text-muted-foreground">{bg ? 'Платформа' : 'Platform'}: {service.platform === 'CALDIY' ? (bg ? 'Според избора в календара' : 'Selected in the calendar') : service.platform.replace(/_/g, ' ')}{service.instructions && <span className="mt-2 block whitespace-pre-wrap">{service.instructions}</span>}</p>}
                        <p className="text-xs leading-6 text-muted-foreground">{bg ? 'Данните се предават на booking системата за организиране на срещата и потвърждение по имейл. Резервацията е завършена след избора на час и потвърждението в календара.' : 'Your details are passed to the booking system to arrange the meeting and email its details. Complete the reservation by choosing a time and confirming in the calendar.'}</p>
                        {error && <p role="alert" className="text-sm text-rose-500">{error}</p>}
                        <button className="min-h-11 rounded-lg bg-foreground px-5 text-sm font-semibold text-background">{bg ? 'Продължи към свободните часове' : 'Continue to available times'}</button>
                    </form>
                    {contact && <>
                        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-5 py-4"><h2 className="text-sm font-bold">{bg ? '2. Избери час' : '2. Choose a time'} - {service.title}</h2><a href={url} target="_blank" rel="noopener noreferrer" referrerPolicy="no-referrer" className="inline-flex min-h-8 items-center gap-2 text-xs underline">{bg ? 'Отвори отделно' : 'Open separately'}<ExternalLink className="size-3" /></a></div>
                        {!loaded && <p role="status" className="px-5 py-3 text-xs text-muted-foreground">{slow ? (bg ? 'Календарът се бави. Използвай „Отвори отделно“.' : 'The calendar is taking longer. Use Open separately.') : (bg ? 'Зареждане на календара…' : 'Loading calendar…')}</p>}
                        <iframe key={url} title={`${service.title} - booking calendar`} src={url} onLoad={() => setLoaded(true)} referrerPolicy="no-referrer" className="block h-[820px] w-full border-0 sm:h-[760px]" />
                    </>}
                </section>
            </div>
            <p className="mt-8 text-xs text-muted-foreground">{bg ? 'За Samsung Calendar свържи същия Google акаунт на телефона. Избирай Google календар за новите събития.' : 'For Samsung Calendar, sync the same Google account on your phone and save events to that Google calendar.'}</p>
        </div>
    </main>;
}
