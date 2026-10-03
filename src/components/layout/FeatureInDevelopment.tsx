import Link from 'next/link';
import { Construction, ArrowLeft } from 'lucide-react';

export function FeatureInDevelopment() {
    return (
        <main className="flex min-h-[70vh] items-center justify-center px-4 py-24 sm:px-6">
            <meta name="robots" content="noindex, nofollow" />
            <section className="w-full max-w-lg rounded-3xl border border-border/60 bg-card/60 p-6 text-center sm:p-10" aria-labelledby="development-title">
                <div className="mx-auto flex size-14 items-center justify-center rounded-2xl border border-amber-500/20 bg-amber-500/10 text-amber-600 dark:text-amber-400"><Construction className="size-7" aria-hidden="true" /></div>
                <h1 id="development-title" className="mt-6 text-2xl font-semibold tracking-tight sm:text-3xl">This feature is in development</h1>
                <p className="mt-4 text-sm leading-7 text-muted-foreground">We’re working on this feature. It’s currently available to administrators for testing and will become public when it’s ready.</p>
                <Link href="/" className="mt-7 inline-flex items-center justify-center gap-2 rounded-xl border border-border px-4 py-3 text-sm font-medium transition hover:bg-muted"><ArrowLeft className="size-4" aria-hidden="true" />Back to home</Link>
            </section>
        </main>
    );
}
