# Addons: create, publish and install

NecrotixLab keeps addon sources in `Addons/<Name>/`. The admin catalogue reads `manifest.json` from each folder on the configured GitHub repository's `main` branch. The default source is this repository; `ADDONS_GITHUB_REPOSITORY=owner/repo` can point it to a separate catalogue. This guide describes the current implementation, including its execution limit.

## Install an available Addon

1. Log in with an administrator account and open **Admin → Addons → Available**.
2. Refresh or search the GitHub catalogue, then check the version and minimum CMS version.
3. Select **Install**. The CMS downloads `Addons/<Name>/necrotixlab-<id>-<version>.zip`, checks it against the published manifest and stores or activates it.
4. Open **Installed** to confirm the result. Tools has its own **Settings** page and can be activated or deactivated there. Use the update control when a compatible package and CMS build are available.

For a local ZIP, use **Admin → Addons → Add New**, choose a `.zip` file no larger than **2 MB**, upload it and check **Installed**. The archive must contain exactly one `Addons/<Name>/manifest.json` path. A custom package other than Tools is staged in private `storage/addons`; it is not executed automatically.

## Create an Addon

Create one folder per addon and a manifest at its root:

```text
Addons/
└── Example/
    ├── manifest.json
    └── README.md
```

Example `Addons/Example/manifest.json`:

```json
{
  "format": "necrotixlab-addon-v1",
  "id": "example",
  "name": "Example",
  "version": "1.0.0",
  "requiresCms": "1.3.78",
  "description": "A short description of this addon."
}
```

Use a stable lowercase ID and three-part numeric versions. `requiresCms` is the minimum compatible CMS version. Keep the description under 240 characters. Document configuration and dependencies in the addon's README. The folder name uses letters, digits, underscores or hyphens and may be different from the ID.

**Development currently requires CMS integration:** add the routes, components, authorization and settings integration to the CMS source, then build and test the application. The ZIP importer validates the manifest and stores the package; it does not register new Next.js routes or execute uploaded JavaScript. Tools is the bundled example and can activate only when its package version matches the CMS build. Review third-party source before integrating it into a deployment.

## Package and publish

From the repository root, create a ZIP whose path begins with `Addons/Example/`:

```bash
zip -r Addons/Example/necrotixlab-example-1.0.0.zip Addons/Example/manifest.json Addons/Example/README.md
```

Avoid including the ZIP itself, secrets or build artifacts. Keep the archive under 2 MB. Publish the folder and the versioned ZIP in the configured repository's `main` branch through a reviewed pull request. The catalogue discovers the manifest; the installer looks for the ZIP in that same folder with the exact `necrotixlab-<id>-<version>.zip` filename. When releasing an update, change `version`, publish the new archive and verify the CMS version requirement.

For a custom package, the ZIP does not need to be published to GitHub. Upload it under **Add New**. A staged addon can be downloaded or removed from **Installed**. Installing or updating the CMS does not automatically activate every addon in the source tree.

## Check before release

- Confirm the archive contains exactly one valid manifest at `Addons/<Name>/manifest.json` and fits the size limit.
- Confirm the matching CMS code and routes have been built and authorization checks are in place.
- Test installation, activation, settings, deactivation and update on a non-production instance.
- Run `npm run typecheck`, `npm run lint`, `npm run test:unit` and a production build for code changes.

See [`Addons/README.md`](../../Addons/README.md) for the source layout and current runtime contract.
