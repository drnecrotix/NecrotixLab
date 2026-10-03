'use client';
import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { CalendarDays, Clock } from 'lucide-react';
import { normalizeBookingContact } from './intake';
import { localParts } from './availability';
import type { BookingConfig } from './settings';
export function BookingScreen({ config }: { config: BookingConfig }) {
    const [selected, setSelected] = useState(''); const [date, setDate] = useState(''); const [slot, setSlot] = useState('');
    const [slots, setSlots] = useState<string[]>([]); const [loading, setLoading] = useState(false); const [sending, setSending] = useState(false);
    const [error, setError] = useState(''); const [success, setSuccess] = useState<{ status: string; startTime: string; title: string } | null>(null);
    const requestId = useRef(''); const service = config.services.find(item => item.id === selected);
    const [today, setToday] = useState('');
    useEffect(() => { setToday(localParts(new Date(), config.timeZone).date); }, [config.timeZone]);
    useEffect(() => {
        setSlot(''); setSlots([]); setLoading(false); if (!selected || !date) return;
        const controller = new AbortController(); setLoading(true); setError('');
        fetch(`/api/booking/slots?service=${encodeURIComponent(selected)}&date=${date}`, { signal: controller.signal, cache: 'no-store' }).then(async response => { if (!response.ok) throw new Error('Часовете не могат да бъдат заредени. / Unable to load times.'); return response.json(); }).then(data => setSlots(Array.isArray(data.slots) ? data.slots : [])).catch(error => { if (error.name !== 'AbortError') setError(error.message); }).finally(() => { if (!controller.signal.aborted) setLoading(false); });
        return () => controller.abort();
    }, [selected, date]);
    const time = (value: string) => new Intl.DateTimeFormat('bg-BG', { hour: '2-digit', minute: '2-digit', timeZone: config.timeZone, timeZoneName: 'short' }).format(new Date(value));
    const input = 'mt-2 min-h-11 w-full rounded-lg border border-border bg-background px-3';
    return <main className="min-h-screen bg-background px-4 pb-20 pt-28 text-foreground sm:px-8"><div className="mx-auto max-w-5xl">
        <header className="max-w-2xl"><p className="font-mono text-xs text-muted-foreground">NecrotixLab / Booking</p><h1 className="mt-4 text-4xl font-black tracking-tight">{config.title}</h1><p className="mt-4 text-sm leading-7 text-muted-foreground">{config.description}</p></header>
        {success ? <section role="status" className="mt-8 space-y-4 rounded-xl border border-border p-6"><h2 className="text-xl font-bold">{success.status === 'PENDING' ? 'Заявката е изпратена / Request received' : 'Резервацията е одобрена / Booking approved'}</h2><p>{success.title} - {new Intl.DateTimeFormat('bg-BG', { dateStyle: 'medium', timeStyle: 'short', timeZone: config.timeZone }).format(new Date(success.startTime))} ({config.timeZone})</p><p className="text-sm text-muted-foreground">{success.status === 'PENDING' ? 'Очаквай одобрение от организатора. / Await organizer approval.' : 'Часът ти е запазен. / Your time is reserved.'} Информацията се изпраща по имейл. / Details are sent by email.</p><Link href="/contact" className="inline-block underline">Контакт за промяна или отказ / Contact to change or cancel</Link></section> : <form className="mt-8 grid gap-6 lg:grid-cols-[280px_minmax(0,1fr)]" onChange={() => { requestId.current = ''; }} onSubmit={async event => {
            event.preventDefault(); if (sending) return; const form = new FormData(event.currentTarget);
            const contact = normalizeBookingContact({ firstName: String(form.get('firstName') || ''), lastName: String(form.get('lastName') || ''), email: String(form.get('email') || ''), phone: String(form.get('phone') || '') });
            if (!contact || !selected || !slot) { setError('Попълни две имена, имейл, телефон с код на държавата, услуга и час. / Enter valid contact details, a service and time.'); return; }
            setSending(true); setError(''); if (!requestId.current) requestId.current = crypto.randomUUID();
            try { const response = await fetch('/api/booking/reservations', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ ...contact, serviceId: selected, startTime: slot, requestId: requestId.current }) }); const data = await response.json(); if (!response.ok) { requestId.current = ''; throw new Error(data.error || 'Неуспешно записване / Booking failed'); } setSuccess(data); }
            catch (error) { setError(error instanceof Error ? error.message : 'Опитай отново / Try again'); } finally { setSending(false); }
        }}>
            <aside><h2 className="mb-4 font-semibold">1. Услуга / Service</h2><div className="grid gap-3">{config.services.map(item => <button key={item.id} type="button" aria-pressed={selected === item.id} onClick={() => { setSelected(item.id); requestId.current = ''; }} className={`rounded-xl border p-5 text-left ${selected === item.id ? 'border-foreground bg-muted' : 'border-border'}`}><CalendarDays className="size-5" /><h3 className="mt-3 font-bold">{item.title}</h3><p className="mt-2 text-xs text-muted-foreground">{item.category}</p><p className="mt-2 text-sm">{item.description}</p><span className="mt-3 flex items-center gap-2 text-xs"><Clock className="size-4" />{item.duration} мин / min</span></button>)}</div></aside>
            <section className="min-w-0 space-y-5 rounded-xl border border-border p-5 sm:p-6"><h2 className="font-semibold">2. Дата и час / Date and time</h2><p className="text-xs text-muted-foreground">Часови пояс / Timezone: {config.timeZone}</p><label className="block text-sm">Дата / Date<input required type="date" value={date} min={today} onChange={event => { setDate(event.target.value); requestId.current = ''; }} className={input} /></label>
                {loading && <p role="status" className="text-sm">Зареждане / Loading...</p>}{selected && date && !loading && !slots.length && <p className="text-sm text-muted-foreground">Няма свободни часове за тази дата. / No available times on this date.</p>}
                <div className="flex flex-wrap gap-2">{slots.map(value => <button key={value} type="button" aria-pressed={slot === value} onClick={() => { setSlot(value); requestId.current = ''; }} className={`min-h-11 rounded-lg border px-3 text-sm ${slot === value ? 'border-foreground bg-muted' : 'border-border'}`}>{time(value)}</button>)}</div>
                <h2 className="border-t border-border pt-5 font-semibold">3. Твоите данни / Your details</h2><div className="grid gap-4 sm:grid-cols-2">{[['firstName', 'Име / First name', 'given-name'], ['lastName', 'Фамилия / Last name', 'family-name']].map(([name, label, autoComplete]) => <label key={name} className="text-sm">{label}<input required name={name} autoComplete={autoComplete} maxLength={80} className={input} /></label>)}<label className="text-sm">Имейл / Email<input required name="email" type="email" autoComplete="email" maxLength={254} className={input} /></label><label className="text-sm">Телефон / Phone<input required name="phone" type="tel" autoComplete="tel" maxLength={30} placeholder="+359..." className={input} /></label></div>
                {service && <p className="text-sm">Платформа / Platform: {service.platform === 'CALDIY' ? 'OTHER' : service.platform.replace(/_/g, ' ')}</p>}<p className="text-xs leading-6 text-muted-foreground">{config.approvalRequired ? 'Заявката изисква одобрение. / Your request requires approval.' : 'Резервацията се потвърждава автоматично. / Your booking is confirmed automatically.'} Данните се използват за срещата и се пазят 30 дни след нея или отказа. / Contact details are retained for 30 days after the meeting or decline.</p>
                {error && <p role="alert" className="text-sm text-rose-500">{error}</p>}<button disabled={sending || loading || !slot} className="min-h-11 rounded-lg bg-foreground px-5 text-sm font-semibold text-background disabled:opacity-50">{sending ? 'Изпращане / Sending...' : 'Запази час / Book appointment'}</button>
            </section>
        </form>}
    </div></main>;
}
