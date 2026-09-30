# Security and network tools

URL Scam Check uses [tldts](https://github.com/remusao/tldts) (MIT) and its Public Suffix List for registered-domain boundaries, including private suffixes. The browser's URL parser determines the actual host. Analysis stays local and does not fetch user targets. Findings are explainable heuristics, not a trained model, probability or guarantee. External Google Safe Browsing is a user-initiated hostname lookup; reputation is not checked automatically.

WHOIS uses existing IANA/RDAP resolution and adds TXT/CAA records, ASN, ISP, organization, timezone and estimated city coordinates from the existing ipwho.is provider. Location failure leaves registry results usable. Domain maps describe the first resolved server IP, not the domain owner. CDN/anycast, VPN and mobile networks can be far from the visitor. No accuracy radius is invented and coordinates are not persisted.

Maps use [Leaflet 1.9.4](https://github.com/Leaflet/Leaflet) (BSD-2-Clause) and OpenStreetMap tiles with visible attribution, no offline prefetching and no proxy stripping Referer. See [OSM tile policy](https://operations.osmfoundation.org/policies/tiles/). Provider quotas and production terms apply; replace the provider for larger traffic. No API key or paid subscription is introduced.
