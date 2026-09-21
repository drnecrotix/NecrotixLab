import { createHmac } from 'node:crypto';

export function signWorkspacePayload(rawBody: string, timestamp: string, secret: string) {
    return createHmac('sha256', secret).update(`${timestamp}.${rawBody}`).digest('hex');
}
