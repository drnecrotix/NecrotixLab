# NecrotixLab Addons

Each addon has its own directory: `Addons/<Name>/`. The public catalogue reads `manifest.json` in every directory on GitHub `main` and compares its version with the version installed in the CMS. The source repository can be changed using `ADDONS_GITHUB_REPOSITORY=owner/repo` when the catalogue moves to a dedicated public repository.

A manifest uses `format: necrotixlab-addon-v1`, a stable lower-case `id`, `name`, semantic `version`, `requiresCms`, and `description`. Distribute a versioned ZIP containing the directory and its manifest. Tools is the first example. Publish source under the MIT license and accept contributions through reviewed pull requests.

Current runtime contract: Next.js routes are compiled into the CMS build. Addon code and route wrappers must be present at build time. The admin ZIP importer validates a compatible manifest and enables the included module, but does not execute uploaded code. New third-party code needs a reviewed CMS build/deployment first. Do not claim that an uploaded archive alone can add server routes. Future runtime plugins will require an explicit extension API and an isolation/security design.
