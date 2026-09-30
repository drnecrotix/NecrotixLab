'use client';
import { useEffect, useRef } from 'react';
import 'leaflet/dist/leaflet.css';
export default function IpLocationMap({ latitude, longitude }: { latitude: number; longitude: number }) {
    const container = useRef<HTMLDivElement>(null);
    useEffect(() => {
        let disposed = false;
        let map: import('leaflet').Map | undefined;
        void import('leaflet').then(L => {
            if (disposed || !container.current) return;
            map = L.map(container.current, { scrollWheelZoom: false }).setView([latitude, longitude], 10);
            L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19, attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors' }).addTo(map);
            L.circleMarker([latitude, longitude], { radius: 9, color: '#06b6d4', fillOpacity: .7 }).addTo(map).bindTooltip('Approximate IP location');
            map.invalidateSize();
        });
        return () => { disposed = true; map?.remove(); };
    }, [latitude, longitude]);
    return <div ref={container} aria-label="Map of approximate IP location" className="relative z-0 h-72 w-full rounded-xl border border-border" />;
}
