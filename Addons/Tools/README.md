# Tools addon

The Tools package owns its page implementations, catalogue configuration and UI components. Thin Next.js route entries remain in `src/app/tools` because the framework discovers routes at build time. Server endpoints remain in `src/app/api/tools` for the same reason.

The CMS accepts only the bundled ZIP manifest version and validates its ID and format. Installing or updating from the CMS activates the code included in the deployed release; it does not execute uploaded scripts. Deploy a newer CMS build before importing a newer package version. The package can be disabled without deleting its settings.

New installations begin with `installed: false` and `active: false`. Existing installations without that marker retain their current behavior. Individual tools can be configured in Admin / Addons once the package is installed.

The Addons admin catalogue reads package manifests from `drnecrotix/NecrotixLab` on GitHub main. Each future plugin should live in its own `Addons/<Name>/` directory with a manifest and versioned ZIP.
