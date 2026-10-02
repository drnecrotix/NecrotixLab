'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowRight, CalendarDays, Clock, ExternalLink } from 'lucide-react';
import { useTheme } from 'next-themes';
import { bookingEmbedUrl, type BookingConfig } from './settings';
export function BookingScreen({ config, origin }: { config: BookingConfig; origin: string }) {
    const [selected, setSelected] = useState(config.services[0]?.id);
    const [language, setLanguage] = useState<'en' | 'bg'>('en');
    const [loaded, setLoaded] = useState(false);
    const [slow, setSlow] = useState(false);
    const { resolvedTheme } = useTheme();
    const service = config.services.find(item => item.id === selected) || config.services[0];
    const url = bookingEmbedUrl(origin, service.path, resolvedTheme === 'dark' ? 'dark' : 'light', language);
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
                    {config.services.map(item => <button key={item.id} type="button" aria-pressed={service.id === item.id} onClick={() => setSelected(item.id)} className={`min-w-0 rounded-xl border p-5 text-left transition-colors ${service.id === item.id ? 'border-foreground bg-muted' : 'border-border hover:bg-muted/50'}`}><CalendarDays className="size-5" /><h3 className="mt-4 font-bold">{item.title}</h3><p className="mt-2 text-xs leading-6 text-muted-foreground">{item.description}</p><span className="mt-4 flex items-center gap-2 text-xs"><Clock className="size-3.5" />{item.duration} {bg ? 'мин' : 'min'}<ArrowRight className="ml-auto size-4" /></span></button>)}
                </div><p className="mt-5 text-xs leading-6 text-muted-foreground">{bg ? 'Избери своя часови пояс в календара. Потвърждението и връзките за отказ или преместване се изпращат от booking системата.' : 'Select your timezone in the calendar. The booking system sends confirmation and links to cancel or reschedule.'}</p><Link href="/contact" className="mt-4 inline-block text-xs font-semibold underline">{bg ? 'Нужна ти е помощ?' : 'Need help?'}</Link></aside>
                <section aria-label={bg ? 'Свободни часове' : 'Available appointments'} className="min-w-0 overflow-hidden rounded-2xl border border-border bg-background">
                    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-5 py-4"><h2 className="text-sm font-bold">{service.title}</h2><a href={`${origin}/${service.path}`} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-8 items-center gap-2 text-xs underline">{bg ? 'Отвори отделно' : 'Open separately'}<ExternalLink className="size-3" /></a></div>
                    {!loaded && <p role="status" className="px-5 py-3 text-xs text-muted-foreground">{slow ? (bg ? 'Календарът се бави. Използвай „Отвори отделно“, ако не се показва.' : 'The calendar is taking longer. Use Open separately if it does not appear.') : (bg ? 'Зареждане на календара…' : 'Loading calendar…')}</p>}
                    <iframe key={url} title={`${service.title} - booking calendar`} src={url} onLoad={() => setLoaded(true)} referrerPolicy="strict-origin-when-cross-origin" className="block h-[820px] w-full border-0 sm:h-[760px]" />
                </section>
            </div>
            <p className="mt-8 text-xs text-muted-foreground">{bg ? 'За Samsung Calendar свържи същия Google акаунт на телефона. Избирай Google календар за новите събития.' : 'For Samsung Calendar, sync the same Google account on your phone and save events to that Google calendar.'}</p>
        </div>
    </main>;
}
