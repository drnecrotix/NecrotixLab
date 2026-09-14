'use client';

import { useEffect, useRef, useState } from 'react';
import { ImagePlus, X } from 'lucide-react';

type Props = { title: string; excerpt: string | null; text: string; html: string; image: string | null; author: string; locale: 'en' | 'bg' };

function lines(ctx: CanvasRenderingContext2D, text: string, width: number, limit: number) {
    const result: string[] = [];
    let line = '';
    // Character wrapping also handles long URLs and text without spaces.
    for (const character of Array.from(text.replace(/\s+/g, ' ').trim()).slice(0, 8000)) {
        if (ctx.measureText(line + character).width > width && line) {
            result.push(line.trim());
            line = character.trimStart();
        } else {
            line += character;
        }
    }
    if (line) result.push(line.trim());
    const visible = result.slice(0, limit);
    if (result.length > limit) {
        let last = visible[limit - 1];
        while (ctx.measureText(last + '…').width > width && last) last = last.slice(0, -1);
        visible[limit - 1] = last.trimEnd() + '…';
    }
    return visible;
}

async function makeStory(props: Props): Promise<Blob> {
    const canvas = document.createElement('canvas');
    canvas.width = 1080;
    canvas.height = 1920;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas unavailable');
    ctx.fillStyle = '#0c0a12';
    ctx.fillRect(0, 0, 1080, 1920);
    const glow = ctx.createLinearGradient(0, 0, 1080, 1920);
    glow.addColorStop(0, '#332044');
    glow.addColorStop(0.55, '#14101e');
    glow.addColorStop(1, '#21101e');
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, 1080, 1920);
    ctx.fillStyle = '#e6b8ff';
    ctx.font = '500 26px sans-serif';
    ctx.fillText('NECROTIXLAB / JOURNAL', 90, 220);
    if (props.image) {
        const picture = await new Promise<HTMLImageElement>((resolve, reject) => {
            const img = new Image();
            img.crossOrigin = 'anonymous';
            const timer = window.setTimeout(() => { img.src = ''; reject(new Error('Image timeout')); }, 15000);
            img.onload = () => { clearTimeout(timer); resolve(img); };
            img.onerror = () => { clearTimeout(timer); reject(new Error('Image unavailable')); };
            img.src = props.image!;
        });
        // Contain the full image so existing embedded watermarks are retained.
        const scale = Math.min(900 / picture.naturalWidth, 660 / picture.naturalHeight);
        const width = picture.naturalWidth * scale;
        const height = picture.naturalHeight * scale;
        ctx.drawImage(picture, 90 + (900 - width) / 2, 290 + (660 - height) / 2, width, height);
    }
    let y = props.image ? 1040 : 470;
    ctx.textBaseline = 'top';
    ctx.fillStyle = '#ffffff';
    ctx.font = '700 66px sans-serif';
    const titleLines = lines(ctx, props.title, 900, 3);
    for (const line of titleLines) { ctx.fillText(line, 90, y); y += 78; }
    y += 35;
    const documentText = new DOMParser().parseFromString(props.html, 'text/html');
    documentText.querySelectorAll('script, style').forEach((element) => element.remove());
    const body = props.excerpt?.trim() || props.text || documentText.body.textContent || '';
    ctx.font = '400 38px sans-serif';
    ctx.fillStyle = '#d7cddd';
    const maxLines = Math.max(1, Math.floor((1560 - y) / 53));
    for (const line of lines(ctx, body, 900, maxLines)) { ctx.fillText(line, 90, y); y += 53; }
    ctx.fillStyle = '#e6b8ff';
    ctx.font = '500 28px sans-serif';
    ctx.fillText(lines(ctx, props.author, 900, 1)[0] || 'NecrotixLab', 90, 1640);
    ctx.fillStyle = '#b2a5bc';
    ctx.font = '400 25px sans-serif';
    ctx.fillText('necrotixlab.com  ·  dr.necrotix', 90, 1720);
    return new Promise((resolve, reject) => {
        canvas.toBlob((blob) => blob ? resolve(blob) : reject(new Error('PNG unavailable')), 'image/png');
    });
}

export function StoryShare(props: Props) {
    const dialog = useRef<HTMLDialogElement>(null);
    const [open, setOpen] = useState(false);
    const [ready, setReady] = useState<{ file: File; url: string } | null>(null);
    const [error, setError] = useState('');
    const [sharing, setSharing] = useState(false);
    const [linkCopied, setLinkCopied] = useState(false);
    const bg = props.locale === 'bg';
    const label = bg ? 'Сподели като стори' : 'Share as story';
    const { title, excerpt, text, html, image, author, locale } = props;

    useEffect(() => {
        if (!open) return;
        const element = dialog.current;
        element?.showModal();
        const previous = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        let cancelled = false;
        let url: string | undefined;
        setReady(null);
        setError('');
        void makeStory({ title, excerpt, text, html, image, author, locale }).then((blob) => {
            if (cancelled) return;
            url = URL.createObjectURL(blob);
            setReady({ file: new File([blob], 'necrotixlab-story.png', { type: 'image/png' }), url });
        }).catch(() => {
            if (!cancelled) setError(locale === 'bg'
                ? 'Изображението не може да бъде подготвено. Опитай отново или сподели линка.'
                : 'Could not prepare the image. Try again or share the link.');
        });
        return () => {
            cancelled = true;
            if (url) URL.revokeObjectURL(url);
            element?.close();
            document.body.style.overflow = previous;
        };
    }, [open, title, excerpt, text, html, image, author, locale]);

    const share = async () => {
        if (!ready || sharing) return;
        setSharing(true);
        setError('');
        try {
            // File is prepared before this click to preserve transient user activation.
            if (!navigator.canShare?.({ files: [ready.file] }) || !navigator.share) {
                setError(bg ? 'Изтегли PNG и го добави към стори от галерията.' : 'Download the PNG and add it to a story from your gallery.');
                return;
            }
            await navigator.share({ files: [ready.file] });
        } catch (reason) {
            if (!(reason instanceof DOMException && reason.name === 'AbortError')) {
                setError(bg ? 'Споделянето не успя. Можеш да изтеглиш PNG.' : 'Sharing failed. You can download the PNG instead.');
            }
        } finally {
            setSharing(false);
        }
    };

    return <>
        <button type="button" onClick={() => setOpen(true)} className="inline-flex min-h-11 items-center gap-2 rounded-full border border-fuchsia-500/25 px-3 text-xs text-foreground transition hover:bg-fuchsia-500/10 focus-visible:outline focus-visible:outline-2">
            <ImagePlus aria-hidden="true" className="size-4" />{label}
        </button>
        <dialog ref={dialog} onCancel={() => setOpen(false)} aria-label={label} className="fixed inset-0 m-auto max-h-[92dvh] w-[calc(100%_-_2rem)] max-w-md overflow-y-auto rounded-2xl border border-foreground/15 bg-background p-5 text-foreground backdrop:bg-black/80" data-watermark-ignore="true">
            <div className="mb-4 flex items-center justify-between gap-3">
                <h2 className="text-lg font-semibold">{label}</h2>
                <button autoFocus type="button" aria-label={bg ? 'Затвори' : 'Close'} onClick={() => setOpen(false)} className="grid size-11 shrink-0 place-items-center rounded-full border border-foreground/20"><X aria-hidden="true" className="size-5" /></button>
            </div>
            {ready ? <img src={ready.url} alt={bg ? 'Преглед на стори картичката' : 'Story card preview'} width={1080} height={1920} className="mx-auto max-h-[48dvh] w-auto max-w-full rounded-lg" /> : !error ? <p role="status" className="py-12 text-center">{bg ? 'Подготвяне на картичката…' : 'Preparing your story…'}</p> : null}
            <p className="mt-4 text-sm text-muted-foreground">{bg ? 'Избери приложение от менюто на телефона или запази снимката и я добави към стори. За кликаем линк добави link стикер в приложението.' : 'Choose an app from your phone’s share menu, or save the image and add it to a story. Add a link sticker in the app for a clickable article link.'}</p>
            {error && <p role="alert" className="mt-3 text-sm text-rose-500">{error}</p>}
            <button type="button" onClick={() => { void navigator.clipboard.writeText(window.location.href).then(() => setLinkCopied(true)).catch(() => setError(bg ? 'Копирай адреса от браузъра.' : 'Copy the address from your browser.')); }} className="mt-3 min-h-11 text-sm underline">{linkCopied ? (bg ? 'Линкът е копиран' : 'Link copied') : (bg ? 'Копирай линк за стикер' : 'Copy link for sticker')}</button>
            <div className="mt-4 flex flex-wrap gap-2">
                <button type="button" disabled={!ready || sharing} onClick={() => void share()} className="min-h-11 rounded-lg bg-foreground px-4 text-sm text-background disabled:opacity-40">{bg ? 'Сподели изображението' : 'Share image'}</button>
                {ready && <a href={ready.url} download="necrotixlab-story.png" className="inline-flex min-h-11 items-center rounded-lg border border-foreground/20 px-4 text-sm">{bg ? 'Изтегли PNG' : 'Download PNG'}</a>}
            </div>
        </dialog>
    </>;
}
