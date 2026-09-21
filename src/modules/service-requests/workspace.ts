import 'server-only';

import { randomBytes } from 'node:crypto';
import type { Prisma, ServiceRequest } from '@prisma/client';
import { signWorkspacePayload } from './workspace-signature';

type SelectedIssue = { id?: unknown; label?: unknown; summary?: unknown; status?: unknown };

function selectedServices(value: Prisma.JsonValue) {
    const issues = Array.isArray(value) ? value as SelectedIssue[] : [];
    return issues.length ? issues.map((issue, index) => ({
        id: String(issue.id ?? `service-${index + 1}`).slice(0, 128),
        name: String(issue.label ?? 'Selected service').slice(0, 200),
        quantity: 1,
        options: { summary: String(issue.summary ?? '').slice(0, 600), status: String(issue.status ?? 'selected') },
    })) : [{ id: requestCategory('GENERAL'), name: 'NecrotixLab service request', quantity: 1 }];
}

function requestCategory(source: string) {
    return source.toLowerCase().replaceAll('_', '-');
}

export function workspaceHandoffPayload(request: ServiceRequest, issuedAt = new Date(), nonce = randomBytes(24).toString('hex')) {
    return {
        version: 1 as const,
        serviceRequestId: request.id,
        reference: request.reference,
        nonce,
        issuedAt: issuedAt.toISOString(),
        client: {
            name: request.customerName,
            email: request.customerEmail,
            company: request.company,
        },
        project: {
            title: `${request.reference} - ${request.target}`.slice(0, 200),
            category: requestCategory(request.source),
            description: request.customerMessage,
            selectedServices: selectedServices(request.selectedIssues),
            requirements: {
                target: request.target,
                source: request.source,
                cms: request.cms,
                accessStatus: request.accessStatus,
                internalReference: request.reference,
            },
            budget: request.finalQuoteCents ? request.finalQuoteCents / 100 : request.budgetCents ? request.budgetCents / 100 : null,
            currency: request.currency,
            sourceUrl: process.env.NEXT_PUBLIC_SITE_URL ? new URL(`/admin/service-requests#${request.reference}`, process.env.NEXT_PUBLIC_SITE_URL).toString() : null,
        },
    };
}

export async function sendRequestToWorkspace(request: ServiceRequest) {
    const baseUrl = String(process.env.NECROTIX_WORKSPACE_URL ?? '').trim().replace(/\/$/, '');
    const secret = String(process.env.NECROTIX_WORKSPACE_SECRET ?? '').trim();
    if (!baseUrl || secret.length < 32) throw new Error('Necrotix Workspace integration is not configured.');

    const rawBody = JSON.stringify(workspaceHandoffPayload(request));
    const timestamp = String(Math.floor(Date.now() / 1000));
    const response = await fetch(`${baseUrl}/api/integrations/necrotixlab/handoff`, {
        method: 'POST',
        headers: {
            'content-type': 'application/json',
            'x-necrotix-timestamp': timestamp,
            'x-necrotix-signature': signWorkspacePayload(rawBody, timestamp, secret),
        },
        body: rawBody,
        cache: 'no-store',
        signal: AbortSignal.timeout(12_000),
    });
    const result = await response.json().catch(() => ({})) as Record<string, unknown>;
    if (!response.ok) throw new Error(`Workspace handoff failed (${response.status}): ${String(result.error ?? 'Unknown error')}`);

    const projectId = String(result.projectId ?? '');
    const projectKey = String(result.projectKey ?? '');
    const clientPortalUrl = String(result.clientPortalUrl ?? '');
    if (!projectId || !projectKey) throw new Error('Workspace returned an incomplete project response.');
    if (clientPortalUrl && new URL(clientPortalUrl).origin !== new URL(baseUrl).origin) throw new Error('Workspace returned an invalid portal URL.');
    return { projectId, projectKey, clientPortalUrl: clientPortalUrl || null };
}
