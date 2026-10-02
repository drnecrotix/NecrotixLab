'use client';
import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { EyeOff, Play } from 'lucide-react';
import { GalleryImage } from './GalleryImage';
import { justifiedGalleryRows } from '@/lib/gallery-justified-layout';
import { galleryCreativeTypeLabel, type GalleryCreativeType } from '@/lib/gallery-settings';
import { shouldBypassImageOptimizer } from '@/lib/media-image';
export type DiscoveryItem = { id: string; title: string; type: 'image' | 'video'; creativeType: GalleryCreativeType; thumbnail: string; isNsfw: boolean; detailUrl: string; aspectRatio: number };
function ArtTile({ item, width, height }: { item: DiscoveryItem; width: number; height: number }) {
    const [revealed, setRevealed] = useState(false);
    const concealed = item.isNsfw && !revealed;
    return <div className="group/art relative shrink-0 overflow-hidden bg-muted" style={{ width, height }} data-art-tile data-sensitive-hidden={concealed || undefined}>
        <Link href={item.detailUrl} tabIndex={concealed ? -1 : 0} aria-hidden={concealed || undefined} aria-label={`${item.title} - ${galleryCreativeTypeLabel(item.creativeType)}`} onClick={event => { if (concealed) event.preventDefault(); }} className="absolute inset-0 block outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary">
            {item.thumbnail && <GalleryImage src={item.thumbnail} alt={concealed ? '' : item.title} fill sizes={`${Math.ceil(width)}px`} loading="lazy" quality={80} retryable={false} unoptimized={shouldBypassImageOptimizer(item.thumbnail)} className={concealed ? 'scale-110 object-cover blur-2xl brightness-[0.35]' : 'object-cover'} />}
            {!concealed && <div className="absolute inset-x-0 bottom-0 bg-black/70 px-3 py-2 text-white opacity-0 transition-opacity group-hover/art:opacity-100 group-focus-within/art:opacity-100 motion-reduce:transition-none"><p className="truncate text-sm font-semibold">{item.title}</p><p className="text-[10px] text-white/65">{galleryCreativeTypeLabel(item.creativeType)}</p></div>}
            {item.type === 'video' && !concealed && <Play aria-hidden="true" className="absolute right-3 top-3 size-4 text-white drop-shadow" />}
        </Link>
        {concealed ? <button type="button" onClick={() => setRevealed(true)} aria-label={`Show sensitive content: ${item.title}`} className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-3 bg-black/30 text-white outline-none transition-colors hover:bg-black/15 focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary">
            <EyeOff aria-hidden="true" className="size-7" strokeWidth={1.6} />
            <span className="absolute inset-x-2 top-[calc(50%+24px)] text-center text-xs opacity-0 transition-opacity group-hover/art:opacity-100 group-focus-within/art:opacity-100"><span className="block font-semibold">Sensitive content</span><span className="mt-1 block text-white/75">Click to reveal</span></span>
        </button> : item.isNsfw && <button type="button" onClick={() => setRevealed(false)} aria-label={`Hide sensitive content: ${item.title}`} className="absolute right-2 top-2 z-20 rounded bg-black/60 p-2 text-white outline-none hover:bg-black/80 focus-visible:ring-2 focus-visible:ring-primary"><EyeOff aria-hidden="true" className="size-4" /></button>}
    </div>;
}
export function ArtDiscoveryGrid({ items }: { items: DiscoveryItem[] }) {
    const container = useRef<HTMLDivElement>(null);
    const [width, setWidth] = useState(0);
    useEffect(() => {
        const element = container.current;
        if (!element) return;
        const observer = new ResizeObserver(entries => setWidth(Math.max(1, entries[0].contentRect.width)));
        observer.observe(element);
        return () => observer.disconnect();
    }, []);
    const rows = useMemo(() => justifiedGalleryRows(items.map(item => item.aspectRatio), width, width < 640 ? 155 : width < 1100 ? 200 : 250, 8), [items, width]);
    return <div ref={container} data-art-grid className="min-w-0 space-y-2">
        {rows.map(row => <div key={items[row.start].id} className="flex gap-2" style={{ height: row.height }}>
            {items.slice(row.start, row.start + row.count).map((item, index) => <ArtTile key={`${item.id}:${item.thumbnail}:${item.isNsfw}`} item={item} width={row.widths[index]} height={row.height} />)}
        </div>)}
    </div>;
}
