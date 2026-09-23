// Compatibility entry point for updater processes started before v1.3.60.
// The old self-update script calls this path after rsync has replaced the app.
// Video Download now uses HTTP requests to the public X embed feed, so there
// is no executable to provision. Keep this file until old installations have
// completed the transition.
console.log('Video Download uses the public X embed feed; no extractor is required.');
