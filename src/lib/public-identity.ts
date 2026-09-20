import { defaultGeneralSiteSettings, normalizeGeneralSiteSettings } from '@/lib/site-settings';

export type PublicIdentity = {
    name: string;
    avatar: string;
    githubUrl: string;
    linkedinUrl: string;
    instagramUrl: string;
    discordUrl: string;
};

export const defaultPublicIdentity: PublicIdentity = {
    name: 'Dr Necrotix',
    avatar: '',
    githubUrl: defaultGeneralSiteSettings.socialLinks.github,
    linkedinUrl: '',
    instagramUrl: defaultGeneralSiteSettings.socialLinks.instagram,
    discordUrl: defaultGeneralSiteSettings.socialLinks.discord,
};

export function buildPublicIdentity(settings: Parameters<typeof normalizeGeneralSiteSettings>[0], profileImage?: string): PublicIdentity {
    const general = normalizeGeneralSiteSettings(settings);
    return {
        name: general.siteName || defaultPublicIdentity.name,
        avatar: profileImage || defaultPublicIdentity.avatar,
        githubUrl: general.socialLinks.github,
        linkedinUrl: general.socialLinks.linkedin,
        instagramUrl: general.socialLinks.instagram,
        discordUrl: general.socialLinks.discord,
    };
}
