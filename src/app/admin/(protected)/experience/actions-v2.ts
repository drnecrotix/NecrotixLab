'use server';

import { updateExperiencePage, type ExperienceSaveResult } from './actions';

// Content and visibility flags are persisted together by the authenticated action.
export async function updateJourneyManager(form: FormData): Promise<ExperienceSaveResult> {
    return updateExperiencePage(form);
}
