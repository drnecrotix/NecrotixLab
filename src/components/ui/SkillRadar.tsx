'use client';

import React from 'react';
import { motion } from 'framer-motion';

interface Skill {
    name: string;
    level: string | number;
}

interface SkillRadarProps {
    skills: Skill[];
    size?: number;
    className?: string;
}

export const SkillRadar = ({ skills, size = 400, className }: SkillRadarProps) => {
    const safeSize = Number.isFinite(size) && size >= 160 ? size : 400;
    const safeSkills = skills.filter((skill) => skill && typeof skill.name === 'string' && skill.name.trim().length > 0);
    if (safeSkills.length < 3) return null;

    const padding = Math.min(60, safeSize * 0.15);
    const center = safeSize / 2;
    const radius = Math.max(1, center - padding);
    const angleStep = (Math.PI * 2) / safeSkills.length;

    // Convert level (advanced, expert, etc.) to 0-1 value
    const getLevelValue = (level: string | number) => {
        if (typeof level === 'number') return Number.isFinite(level) ? Math.min(1, Math.max(0, level / 100)) : 0.5;
        const map: Record<string, number> = {
            'beginner': 0.3,
            'intermediate': 0.5,
            'advanced': 0.8,
            'expert': 1.0
        };
        return map[level.toLowerCase()] || 0.5;
    };

    const points = safeSkills.map((skill, i) => {
        const val = getLevelValue(skill.level);
        const angle = i * angleStep - Math.PI / 2;
        return {
            x: center + Math.cos(angle) * (radius * val),
            y: center + Math.sin(angle) * (radius * val),
            labelX: center + Math.cos(angle) * (radius + 25),
            labelY: center + Math.sin(angle) * (radius + 25),
            angle
        };
    });

    const polygonPath = points.map(p => `${p.x},${p.y}`).join(' ');

    return (
        <div className={className}>
            <svg width={safeSize} height={safeSize} viewBox={`0 0 ${safeSize} ${safeSize}`}>
                {/* Background Circles */}
                {[0.2, 0.4, 0.6, 0.8, 1].map((step, i) => (
                    <circle
                        key={i}
                        cx={center}
                        cy={center}
                        r={radius * step}
                        fill="none"
                        stroke="currentColor"
                        className="text-primary/10"
                        strokeWidth="1"
                    />
                ))}

                {/* Axis Lines */}
                {safeSkills.map((_, i) => {
                    const angle = i * angleStep - Math.PI / 2;
                    return (
                        <line
                            key={i}
                            x1={center}
                            y1={center}
                            x2={center + Math.cos(angle) * radius}
                            y2={center + Math.sin(angle) * radius}
                            stroke="currentColor"
                            className="text-primary/10"
                            strokeWidth="1"
                        />
                    );
                })}

                {/* The Skill Polygon */}
                <motion.polygon
                    initial={{ opacity: 0, scale: 0.5 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 1, ease: "easeOut" }}
                    points={polygonPath}
                    fill="currentColor"
                    className="text-primary/20"
                    stroke="currentColor"
                    strokeWidth="2"
                    style={{ stroke: 'hsl(var(--primary))' }}
                />

                {/* Pulse Nodes */}
                {points.map((p, i) => (
                    <g key={i}>
                        <circle
                            cx={p.x}
                            cy={p.y}
                            r={4}
                            fill="hsl(var(--primary))"
                        />
                        <circle
                            cx={p.x}
                            cy={p.y}
                            r={10}
                            fill="hsl(var(--primary))"
                            className="origin-center opacity-20 motion-safe:animate-pulse"
                        />
                        <text
                            x={p.labelX}
                            y={p.labelY}
                            textAnchor="middle"
                            dominantBaseline="middle"
                            className="text-[10px] font-black uppercase tracking-tighter fill-muted-foreground/60"
                        >
                            {safeSkills[i].name}
                        </text>
                    </g>
                ))}
            </svg>
        </div>
    );
};
