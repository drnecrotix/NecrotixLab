export type CheckStatus = 'ok' | 'warning' | 'error';

export type OperationalCheck = {
    id: string;
    category: string;
    label: string;
    status: CheckStatus;
    summary: string;
    detail: string;
    impact: string;
    resolution: string[];
    actionHref?: string;
    actionLabel?: string;
};

export const SITE_HEALTH_LOG_RETENTION_DAYS = 7;

export function overallStatus(checks: OperationalCheck[]): CheckStatus {
    if (checks.some((check) => check.status === 'error')) return 'error';
    if (checks.some((check) => check.status === 'warning')) return 'warning';
    return 'ok';
}

export function securityScore(checks: OperationalCheck[]) {
    if (!checks.length) return 0;
    const points = checks.reduce((sum, check) => sum + (check.status === 'ok' ? 1 : check.status === 'warning' ? 0.5 : 0), 0);
    return Math.round(points / checks.length * 100);
}
