export type ProjectStatus = 'planned' | 'ongoing' | 'completed' | 'archived';

export const PROJECT_STATUS_DETAILS: Record<ProjectStatus, { label: string; description: string }> = {
    planned: { label: 'Planned', description: 'Work is planned but has not started.' },
    ongoing: { label: 'In progress', description: 'Work is currently in progress.' },
    completed: { label: 'Completed', description: 'The planned work has been completed.' },
    archived: { label: 'Archived', description: 'The project is kept for reference.' },
};

export function normalizeProjectStatus(value?: string | null): ProjectStatus {
    switch (value?.trim().toUpperCase()) {
        case 'ONGOING': return 'ongoing';
        case 'COMPLETED': return 'completed';
        case 'ARCHIVED': return 'archived';
        default: return 'planned';
    }
}
