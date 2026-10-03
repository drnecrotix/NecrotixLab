import Image from 'next/image';

export function EntryThumbnail({ src, label }: { src?: string; label: string }) {
    if (!src) return null;
    return <a href={src} target="_blank" rel="noreferrer" aria-label={`Open photo: ${label}`} className="relative block h-[60px] w-20 shrink-0 overflow-hidden rounded-lg border border-border/60"><Image src={src} alt={label} fill sizes="80px" unoptimized className="object-cover" /></a>;
}
