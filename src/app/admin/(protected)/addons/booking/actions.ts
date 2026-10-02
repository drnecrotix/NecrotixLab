'use server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { BOOKING_ADDON_VERSION, BOOKING_CONFIG_SLUG, normalizeBookingConfig } from '@addons/Booking/settings';
async function admin() { const session = await auth(); if (!session?.user || !['OWNER', 'ADMIN'].includes(session.user.role)) throw new Error('Forbidden'); }
async function persist(config: ReturnType<typeof normalizeBookingConfig>) {
    await prisma.page.upsert({ where: { slug: BOOKING_CONFIG_SLUG }, create: { slug: BOOKING_CONFIG_SLUG, title: 'Booking addon settings', status: 'DRAFT', content: config }, update: { content: config } });
    for (const path of ['/booking', '/services', '/admin/addons', '/admin/addons/booking']) revalidatePath(path);
}
export async function setBookingAddonState(form: FormData) {
    await admin();
    const record = await prisma.page.findUnique({ where: { slug: BOOKING_CONFIG_SLUG }, select: { content: true } });
    const config = normalizeBookingConfig(record?.content);
    switch (form.get('operation')) {
        case 'install': config.installed = true; config.active = false; config.packageVersion = BOOKING_ADDON_VERSION; break;
        case 'activate': if (!config.installed) throw new Error('Install Booking first'); config.active = true; break;
        case 'deactivate': config.active = false; break;
        case 'update': if (!config.installed) throw new Error('Install Booking first'); config.packageVersion = BOOKING_ADDON_VERSION; break;
        case 'uninstall': config.installed = false; config.active = false; break;
        default: throw new Error('Unknown operation');
    }
    await persist(config); redirect('/admin/addons?tab=installed&saved=state');
}
export async function saveBookingSettings(form: FormData) {
    await admin();
    const record = await prisma.page.findUnique({ where: { slug: BOOKING_CONFIG_SLUG }, select: { content: true } });
    const current = normalizeBookingConfig(record?.content);
    if (!current.installed) throw new Error('Install Booking first');
    const services = Array.from({ length: 8 }, (_, index) => ({ title: form.get(`title-${index}`), description: form.get(`description-${index}`), duration: form.get(`duration-${index}`), path: form.get(`path-${index}`) }));
    const filled = services.filter(item => String(item.path || '').trim());
    const config = normalizeBookingConfig({ ...current, title: form.get('title'), description: form.get('description'), services: filled });
    if (config.services.length !== filled.length) redirect('/admin/addons/booking?error=Use+a+Cal.diy+path+like+username%2Fconsultation');
    await persist(config); redirect('/admin/addons/booking?saved=1');
}
