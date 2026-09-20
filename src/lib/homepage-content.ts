export type HomepageContent = {
    intro: string;
    lineOne: string;
    lineTwoPrefix: string;
    lineTwoSuffix: string;
    lineThreePrefix: string;
    lineThreeSuffix: string;
    collaboration: string;
    workspaceUrl: string;
    workspaceTooltip: string;
    assistantTooltip: string;
    availabilityLabel: string;
    profileName: string;
    profileTitle: string;
    profileDescription: string;
    profileImage: string;
    capabilitiesEyebrow: string;
    capabilitiesTitle: string;
    capabilitiesDescription: string;
    capabilityOneTitle: string;
    capabilityOneDescription: string;
    capabilityOneNote: string;
    capabilityTwoTitle: string;
    capabilityTwoDescription: string;
    capabilityTwoNote: string;
    capabilityThreeTitle: string;
    capabilityThreeDescription: string;
    capabilityThreeNote: string;
    showBlogPosts: boolean;
    homeBlogTitle: string;
    homeBlogSubtitle: string;
    homeBlogPostLimit: number;
    showProjects: boolean;
    homeProjectsTitle: string;
    homeProjectsSubtitle: string;
    homeProjectLimit: number;
    engineeringEyebrow: string;
    engineeringTitle: string;
    engineeringDescription: string;
    engineeringServices: string;
    engineeringButtonLabel: string;
    engineeringButtonUrl: string;
    engineeringStatus: string;
    projectsEyebrow: string;
    projectsStatement: string;
    projectsDescription: string;
    cloudEyebrow: string;
    cloudTitle: string;
    cloudDescription: string;
    cloudFeatures: string;
    cloudButtonLabel: string;
    cloudUrl: string;
    socialImage: string;
    openGraphImage: string;
    twitterImage: string;
    customMetaTags: string;
};

export type CustomMetaTag = { attribute: 'name' | 'property' | 'http-equiv'; key: string; content: string };

export const defaultHomepageContent: HomepageContent = {
    intro: "Hi, I'm Dr Necrotix. I build digital systems, creative projects and communities.",
    lineOne: 'DIGITAL LAB',
    lineTwoPrefix: 'DR.',
    lineTwoSuffix: 'NECROTIX',
    lineThreePrefix: 'BUILD',
    lineThreeSuffix: 'CREATE',
    collaboration: 'Open to meaningful collaborations, creative work and technical projects.',
    workspaceUrl: '/projects',
    workspaceTooltip: 'Explore Projects',
    assistantTooltip: 'Talk to my AI Assistant',
    availabilityLabel: 'AVAILABLE FOR OPPORTUNITY',
    profileName: '',
    profileTitle: 'Developer, Creator & Community Builder',
    profileDescription: 'Dr Necrotix builds software, digital experiences, creative projects and online communities with a focus on practical execution and distinctive identity.',
    profileImage: '',
    capabilitiesEyebrow: 'NecrotixLab / Independent digital studio',
    capabilitiesTitle: 'Ideas made useful, visual and real.',
    capabilitiesDescription: 'NecrotixLab is the independent practice of Dr. Necrotix - building digital products, community systems and visual stories from Bulgaria.',
    capabilityOneTitle: 'Community Hub',
    capabilityOneDescription: 'Useful entry points for projects, resources and connected digital experiences in one evolving space.',
    capabilityOneNote: 'Projects / Resources / Systems',
    capabilityTwoTitle: 'Discord Server',
    capabilityTwoDescription: 'BG-GAMER brings people, moderation, automation and community operations into one evolving ecosystem.',
    capabilityTwoNote: '2,800+ members / Automation / Operations',
    capabilityThreeTitle: 'Visual stories',
    capabilityThreeDescription: 'Digital art, photography and editorial experiences with a distinct identity.',
    capabilityThreeNote: 'Art direction / Content / Interaction',
    showBlogPosts: true,
    homeBlogTitle: 'Journal',
    homeBlogSubtitle: 'Recent publications, notes and ideas.',
    homeBlogPostLimit: 5,
    showProjects: true,
    homeProjectsTitle: 'Selected projects',
    homeProjectsSubtitle: 'Current and completed work from the lab.',
    homeProjectLimit: 5,
    engineeringEyebrow: 'Engineering / CNC Lab',
    engineeringTitle: 'From geometry to machine-ready logic.',
    engineeringDescription: 'A developing technical practice for CAD preparation, CNC programming, toolpath planning and production documentation.',
    engineeringServices: '2D technical drawings\nDXF / DWG preparation\nCNC programs\nG-code review\nToolpath planning\nSetup documentation',
    engineeringButtonLabel: 'Explore CAD & CNC',
    engineeringButtonUrl: '/services#engineering',
    engineeringStatus: 'Capability in development',
    projectsEyebrow: 'Selected work / Case studies',
    projectsStatement: 'Built with purpose.',
    projectsDescription: 'Not a wall of thumbnails. A small evidence board showing the problem, the system and the decisions that made each project useful.',
    cloudEyebrow: 'Kreatrics / Private cloud',
    cloudTitle: 'One space for work that needs to stay connected.',
    cloudDescription: 'cloud.kreatrics.com is the cloud access point for Kreatrics - a dedicated workspace for files, shared material and the services that will connect the wider platform.',
    cloudFeatures: 'Browser access\nOrganized files\nControlled sharing\nGrowing platform',
    cloudButtonLabel: 'Open Kreatrics Cloud',
    cloudUrl: 'https://cloud.kreatrics.com',
    socialImage: '',
    openGraphImage: '',
    twitterImage: '',
    customMetaTags: '',
};

export function normalizeHomepageContent(value: unknown): HomepageContent {
    const source = value && typeof value === 'object' && !Array.isArray(value) ? value as Partial<HomepageContent> : {};
    const blogLimit = Number(source.homeBlogPostLimit);
    const projectLimit = Number(source.homeProjectLimit);
    const normalized = {
        ...defaultHomepageContent,
        ...source,
        showBlogPosts: source.showBlogPosts !== false,
        homeBlogPostLimit: Number.isFinite(blogLimit) ? Math.max(1, Math.min(5, Math.round(blogLimit))) : defaultHomepageContent.homeBlogPostLimit,
        showProjects: source.showProjects !== false,
        homeProjectLimit: Number.isFinite(projectLimit) ? Math.max(1, Math.min(5, Math.round(projectLimit))) : defaultHomepageContent.homeProjectLimit,
    };
    if (normalized.homeBlogTitle === 'Latest from the blog') normalized.homeBlogTitle = 'Journal';
    return normalized;
}

export function parseCustomMetaTags(value: string): CustomMetaTag[] {
    return value.split('\n').map((line) => line.trim()).filter(Boolean).slice(0, 50).flatMap((line) => {
        const match = line.match(/^(name|property|http-equiv)\s*:\s*([^=]+?)\s*=\s*(.+)$/i);
        if (!match) return [];
        const attribute = match[1].toLowerCase() as CustomMetaTag['attribute'];
        const key = match[2].trim().replace(/[^a-zA-Z0-9:_-]/g, '').slice(0, 120);
        const content = match[3].trim().replace(/[\u0000-\u001f\u007f]/g, '').slice(0, 1000);
        if (!key || !content) return [];
        return [{ attribute, key, content }];
    });
}
