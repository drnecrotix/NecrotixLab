# Admin simplification proposals

Implemented: retire A/B tests and event collection, keeping Audience & traffic at its existing URL. Historical experiment tables are not dropped by this change.

The following are proposals only; usage cannot be inferred from the existence of code alone.

| Surface | Proposal | Reason |
| --- | --- | --- |
| Journey and Career Dossier | Group under Profile; keep separate editors | Related personal information, different public layouts |
| Blog Taxonomies | Nest under Blog | Configuration is meaningful while editing publications |
| Navigation, Footer, Appearance | One Appearance hub with subpages | Reduce top-level choices without merging unrelated forms |
| Service Monitoring and Site Health | Keep separate, clarify “Client services” vs “This website” | Avoid confusing customer monitoring with app operations |
| Revisions | Keep contextual links from editors plus the archive | Recovery is valuable even when used infrequently |
| AI Assistant | Make navigation visibility optional if unused | Requires provider configuration and has ongoing cost |
| Digital Store and Orders | Hide navigation when commerce is unused; preserve orders/download grants | Avoid destructive removal of financial history |
| Media and Gallery | Keep both; clarify “Files” and “Published works” | File storage and curated publishing serve different tasks |

Repository rename: use GitHub Settings > General > Repository name. After the owner renames Portfolio to NecrotixLab, update repository URLs, local remotes, self-update configuration and badges. Preserve existing database names, cookie keys and deployment directories for compatibility.
