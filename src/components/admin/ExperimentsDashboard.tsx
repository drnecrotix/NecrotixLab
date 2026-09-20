'use client';

import { TrafficAnalyticsPanel } from './TrafficAnalyticsPanel';

export function ExperimentsDashboard() {
    return <div className="mx-auto max-w-[1600px] space-y-6"><header className="border-b border-foreground/10 pb-5"><p className="text-xs font-medium text-muted-foreground">Insights</p><h1 className="mt-2 text-3xl font-semibold tracking-tight">Audience & traffic</h1><p className="mt-2 text-sm text-muted-foreground">Understand what visitors explore, where visits come from and which pages need attention.</p></header><TrafficAnalyticsPanel showMap showActivity title="Visitors and traffic" /></div>;
}
