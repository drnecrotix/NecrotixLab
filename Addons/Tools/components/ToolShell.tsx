import Link from 'next/link';
import { ArrowLeft, LockKeyhole } from 'lucide-react';

export function ToolShell({ eyebrow = 'Binary tools', title, description, children, processing = 'Local browser processing', workbench = false }: { eyebrow?: string; title: string; description: string; children: React.ReactNode; processing?: string; workbench?: boolean }) {
    return (
        <main className={workbench ? "min-h-screen bg-background px-3 pb-12 pt-24 text-foreground sm:px-6" : "min-h-screen bg-background px-5 pb-24 pt-28 text-foreground sm:px-8 lg:pt-36"}>
            <div className={workbench ? "mx-auto max-w-[1440px]" : "mx-auto max-w-5xl"}>
                <Link href="/tools" className="inline-flex min-h-11 items-center gap-2 text-xs font-bold text-muted-foreground transition hover:text-foreground"><ArrowLeft className="size-4" /> Back to tools</Link>
                <header className={workbench ? "mt-3 grid gap-3 border-b border-border/80 pb-4 md:grid-cols-2 md:items-end" : "mt-8 grid gap-5 border-b border-border/80 pb-8 lg:grid-cols-[.8fr_1.2fr] lg:items-end"}>
                    <div><p className="font-mono text-[10px] font-bold uppercase tracking-[0.24em] text-cyan-500">{eyebrow}</p><h1 className={workbench ? "mt-2 text-3xl font-black tracking-tight" : "mt-3 text-4xl font-black tracking-[-0.055em] sm:text-5xl"}>{title}</h1></div>
                    <div><p className="max-w-2xl text-sm leading-7 text-muted-foreground sm:text-base">{description}</p><p className="mt-4 inline-flex items-center gap-2 font-mono text-[9px] uppercase tracking-[0.16em] text-emerald-500"><LockKeyhole className="size-3.5" /> {processing}</p></div>
                </header>
                <div className={workbench ? "mt-4" : "mt-8"}>{children}</div>
            </div>
        </main>
    );
}
