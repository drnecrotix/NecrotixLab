import Link from 'next/link';
import { ArrowRight, ArrowUpRight } from 'lucide-react';
import { galleryCreativeTypeLabel, galleryItemHref, type GalleryItemSetting } from '@/lib/gallery-settings';

export function HomeGallerySection({ items }: { items: GalleryItemSetting[] }) {
    return (
        <section aria-labelledby="home-gallery-title" className="border-t border-foreground/10 px-6 py-16 md:px-16 md:py-20 lg:px-24 lg:py-24">
            <div className="mx-auto max-w-[1400px]">
                <div className="flex flex-col gap-7 border-b border-foreground/10 pb-9 md:flex-row md:items-end md:justify-between">
                    <div>
                        <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.24em] text-sky-500">Visual archive / Gallery</p>
                        <h2 id="home-gallery-title" className="mt-4 text-4xl font-semibold leading-[1.02] tracking-[-0.055em] sm:text-5xl lg:text-6xl">A different kind of work.</h2>
                        <p className="mt-4 max-w-xl text-base leading-7 text-muted-foreground">Photography, digital art and experiments from the visual side of the lab.</p>
                    </div>
                    <Link href="/gallery" className="group inline-flex min-h-11 shrink-0 items-center gap-2 self-start rounded-full border border-foreground/20 px-5 text-sm font-semibold transition-colors hover:border-foreground hover:bg-foreground hover:text-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:ring-offset-4 focus-visible:ring-offset-background md:self-auto">
                        Explore the gallery <ArrowUpRight className="size-4 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5 motion-reduce:transform-none" />
                    </Link>
                </div>
                {items.length ? (
                    <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
                        {items.map((item, index) => (
                            <Link key={item.id} href={galleryItemHref(item.slug)} className="group block min-w-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:ring-offset-4 focus-visible:ring-offset-background">
                                <article>
                                    <div className="relative aspect-[4/5] overflow-hidden bg-foreground/[0.04]">
                                        <img src={item.thumbnailUrl || item.mediaUrl} alt={item.altText || item.title} loading="lazy" decoding="async" className="h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.035] motion-reduce:transform-none" />
                                        <span className="absolute right-3 top-3 flex size-9 items-center justify-center rounded-full bg-background/90 text-foreground opacity-100 shadow-sm transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5 motion-reduce:transform-none sm:opacity-0 sm:group-hover:opacity-100 sm:group-focus-visible:opacity-100" aria-hidden="true"><ArrowUpRight className="size-4" /></span>
                                    </div>
                                    <div className="flex items-start justify-between gap-3 pt-4">
                                        <div className="min-w-0"><p className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">{galleryCreativeTypeLabel(item.creativeType)} / {String(index + 1).padStart(2, '0')}</p><h3 className="mt-2 line-clamp-2 text-lg font-semibold leading-snug tracking-tight transition-colors group-hover:text-sky-500">{item.title}</h3></div>
                                        <ArrowRight className="mt-1 size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-1 motion-reduce:transform-none" aria-hidden="true" />
                                    </div>
                                </article>
                            </Link>
                        ))}
                    </div>
                ) : (
                    <div className="mt-8 flex min-h-40 items-center border border-foreground/10 px-6 py-8 text-sm text-muted-foreground">The visual archive is being prepared. Explore the gallery for updates.</div>
                )}
            </div>
        </section>
    );
}
