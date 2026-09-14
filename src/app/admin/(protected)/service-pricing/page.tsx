import { PricingSaveButton } from '@/components/admin/PricingSaveButton';
import { prisma } from '@/lib/prisma';
import { StatusToast } from '@/components/admin/StatusToast';
import { WEBSITE_BUILD_RATE_CARD } from '@/modules/service-requests/estimate';
import { SERVICE_PRICING } from '@/modules/service-requests/pricing';
import { normalizeServicePricing, SERVICE_PRICING_CONFIG_SLUG } from '@/modules/service-requests/pricing-settings';
import { updateServicePricing } from './actions';

const buildLabels: Record<string, string> = {
    'site-landing': 'Landing page', 'site-portfolio': 'Portfolio', 'site-business': 'Business website', 'site-blog': 'Blog / publication',
    'site-store': 'Online store', 'site-community': 'Community hub', 'site-recipes': 'Recipes / lifestyle', 'site-knowledge': 'Knowledge base',
    'site-courses': 'Courses / membership', 'site-booking': 'Bookings / events', 'site-directory': 'Directory', 'site-custom': 'Custom platform',
};
const inputClass = 'min-h-11 w-full min-w-0 rounded-lg border border-foreground/20 bg-background px-3 py-2 text-base text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500';

function RangeRows({ rows }: { rows: { id: string; name: string; min: number; max: number | null }[] }) {
    return <tbody role="rowgroup">{rows.map((row) => <tr role="row" key={row.id} className="border-b border-foreground/15"><th role="rowheader" scope="row" className="py-4 pr-5 font-semibold text-foreground">{row.name}</th><td role="cell" className="py-3 pr-4"><label className="block"><span className="mb-1 block text-xs text-muted-foreground">Minimum · EUR · one-off</span><input aria-label={`${row.name}: minimum one-off price in EUR`} name={`${row.id}-min`} type="number" inputMode="decimal" step="any" min="0" max="50000" defaultValue={row.min} className={inputClass} /></label></td><td role="cell" className="py-3"><label className="block"><span className="mb-1 block text-xs text-muted-foreground">Maximum · EUR · one-off</span><input aria-label={`${row.name}: maximum one-off price in EUR`} name={`${row.id}-max`} type="number" inputMode="decimal" step="any" min="0" max="50000" defaultValue={row.max ?? ''} placeholder={row.max === null ? 'No maximum' : undefined} className={inputClass} /></label></td></tr>)}</tbody>;
}

function FixedRows({ rows }: { rows: { id: string; name: string; price: number }[] }) {
    return <tbody role="rowgroup">{rows.map((row) => <tr role="row" key={row.id} className="border-b border-foreground/15"><th role="rowheader" scope="row" className="py-4 pr-5 font-semibold text-foreground">{row.name}</th><td role="cell" className="py-3"><label className="block"><span className="mb-1 block text-xs text-muted-foreground">EUR / month</span><input aria-label={`${row.name}: monthly price in EUR`} name={`${row.id}-price`} type="number" inputMode="decimal" step="any" min="0" max="50000" defaultValue={row.price} className={inputClass} /></label></td></tr>)}</tbody>;
}

function PricingSection({ title, detail, children, fixed = false }: { title: string; detail: string; children: React.ReactNode; fixed?: boolean }) {
    return <section className="mt-6 rounded-xl border border-foreground/15 bg-foreground/[0.02] p-4 sm:p-6"><div className="flex flex-wrap items-center gap-3"><h2 className="text-xl font-black text-foreground">{title}</h2><span className="rounded border border-foreground/20 px-2 py-1 text-xs font-semibold text-foreground">{fixed ? 'Monthly subscription' : 'One-off payment'}</span></div><p className="mt-2 text-sm leading-6 text-muted-foreground">{detail}</p><div className="mt-4"><table role="table" className="admin-pricing-table w-full text-left text-sm"><thead className="border-b border-foreground/15 text-xs text-muted-foreground"><tr><th className="py-3">Service</th>{fixed ? <th className="py-3">Price (EUR / month)</th> : <><th className="py-3">Minimum (EUR, one-off)</th><th className="py-3">Maximum (EUR, one-off)</th></>}</tr></thead>{children}</table></div></section>;
}

export default async function ServicePricingAdminPage({ searchParams }: { searchParams: Promise<{ saved?: string; error?: string }> }) {
    const [config, params] = await Promise.all([
        prisma.page.findUnique({ where: { slug: SERVICE_PRICING_CONFIG_SLUG }, select: { content: true } }).catch(() => null),
        searchParams,
    ]);
    const prices = normalizeServicePricing(config?.content);
    const buildRows = (Object.keys(WEBSITE_BUILD_RATE_CARD.baseByType) as (keyof typeof WEBSITE_BUILD_RATE_CARD.baseByType)[]).map((id) => ({ id, name: buildLabels[id], min: prices.websiteBuildBase[id]!.min, max: prices.websiteBuildBase[id]!.max }));
    const oneOffRows = SERVICE_PRICING.oneOff.map((item) => ({ id: `oneoff-${item.id}`, name: item.name, ...prices.oneOff[item.id] }));
    const monthlyRows = SERVICE_PRICING.monthly.map((item) => ({ id: `monthly-${item.id}`, name: item.name, price: prices.monthly[item.id] }));
    const supportRows = SERVICE_PRICING.supportOneOff.map((item) => ({ id: `support-${item.id}`, name: item.name, ...prices.supportOneOff[item.id] }));
    const careRows = SERVICE_PRICING.supportMonthly.map((item) => ({ id: `care-${item.id}`, name: item.name, price: prices.supportMonthly[item.id] }));
    return <div className="mx-auto max-w-5xl"><StatusToast type={params.error ? 'error' : params.saved ? 'success' : undefined} message={params.error || (params.saved ? 'Service prices saved and all related public services refreshed.' : undefined)} /><header><p className="font-mono text-xs uppercase tracking-[0.18em] text-sky-400">Commerce</p><h1 className="mt-2 text-3xl font-black text-foreground">Service pricing</h1><p className="mt-3 max-w-3xl text-sm leading-6 text-muted-foreground">Manage prices for the public catalogue and website estimators. Each section shows its billing period. Default prices apply until you save your changes.</p></header><form action={updateServicePricing} className="mt-8"><PricingSection title="Website creation" detail="Base estimate ranges used by Configure your website."><RangeRows rows={buildRows} /></PricingSection><PricingSection title="Audits and implementation" detail="Public one-off prices shown in the service catalogue."><RangeRows rows={oneOffRows} /></PricingSection><PricingSection title="SEO monitoring and growth" detail="Fixed monthly catalogue prices." fixed><FixedRows rows={monthlyRows} /></PricingSection><PricingSection title="One-off website support" detail="These ranges are also applied to matching tasks in Website Support."><RangeRows rows={supportRows} /></PricingSection><PricingSection title="Website maintenance" detail="Fixed monthly plans used in the catalogue and Website Support selector." fixed><FixedRows rows={careRows} /></PricingSection><div className="sticky bottom-0 mt-6 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-foreground/15 bg-background/95 p-3 shadow-lg backdrop-blur sm:bottom-4"><p className="text-sm text-muted-foreground">Changes apply to the catalogue after saving.</p><PricingSaveButton /></div></form></div>;
}
