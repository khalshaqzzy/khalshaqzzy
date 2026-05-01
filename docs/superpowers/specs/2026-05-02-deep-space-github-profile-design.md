# Deep Space GitHub Profile Design

## Goal

Build Muhammad Khalfani Shaquille Indrajaya's GitHub profile as a polished, projectless technical dossier: astronomy-inspired, minimalist, professional, and optimized for AI/backend/systems credibility.

## Chosen Direction

Use **Deep Space Technical Dossier** rather than a standard portfolio. The profile should read like a restrained engineering document from an observatory or mission lab: precise metadata, thin orbital geometry, capability matrices, and technical language that signals depth without naming projects.

## Content Rules

- Do not mention named projects or case studies.
- Do not mention geospatial intelligence.
- Do not include "Product-Minded Developer", admin tools, customer portals, or operational dashboard positioning.
- Include systems architecture as a core focus.
- Do not mention developer tooling as a focus area.
- Recognition includes only:
  - Most Innovative Use of SEA-LION Models, Pan-SEA AI Developer Challenge 2025
  - 1st Place Software Development, IT Festival IPB University 2025
- Use standard README-style framework icons where available, then text capsules for concepts without reliable public icons.

## Information Architecture

1. Hero dossier
   - Name, role line, education metadata, and a custom local SVG star-chart banner.
2. Systems thesis
   - Short statement about building AI-native systems through retrieval, orchestration, backend services, systems architecture, and cloud-native execution.
3. Architecture layers
   - A matrix describing interface, orchestration, retrieval, service, data, cloud, and observability layers.
4. Capability index
   - Standard icon strips for languages, frontend, backend, cloud, and tools.
   - Text capsules for Gemini API, Vertex AI, RAG, LLM orchestration, Computer Vision, TTS, and SEA-LION.
5. Engineering modes
   - AI Systems Engineer, Backend Architect, Systems Architecture, Cloud Builder.
6. Recognition
   - Two compact award rows only.
7. GitHub telemetry
   - A local generated telemetry SVG, contribution tile SVG, and README table refreshed by GitHub Actions from the public GitHub API.
   - Keep data aggregate-only: no repository names, no case study names, no project list.
8. Contact
   - GitHub, LinkedIn, and email.

## Visual System

- Palette: near-black graphite, off-white text, muted cyan lines, restrained amber highlights for recognition.
- Geometry: star coordinates, thin orbital arcs, catalog lines, matrix dividers, sparse points.
- Typography: GitHub-rendered Markdown plus SVG text using system sans and monospace accents.
- Component style: flat dossier panels, tables, thin separators, no cartoon space imagery, no rockets, no planets, no purple blob gradients, no noisy badge wall.

## Implementation Notes

- GitHub README-safe only: Markdown, GitHub-supported HTML, remote image URLs from standard README services, and local SVG assets.
- Keep the README readable without CSS or JavaScript.
- Use local SVG assets for the advanced visual identity and systems map because GitHub strips arbitrary style/script behavior from Markdown.
- Avoid excessive external dependencies. Use `skillicons.dev` for common technology icons because it is familiar in GitHub READMEs.
- Use `.github/workflows/update-profile-telemetry.yml` and `scripts/update-profile-telemetry.mjs` to refresh aggregate public GitHub data and contribution tiles every six hours and on manual dispatch. Do not refresh on every push because the generated timestamp would create commit churn.

## Verification

- Confirm created files are tracked in the working tree.
- Confirm README does not contain banned project names or removed concepts.
- Confirm links and local asset references are present.
