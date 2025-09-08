**Pirate Nation Monorepo**

- PNPM workspaces with Next.js apps and shared packages.
- Apps: `apps/web` (port 3000), `apps/admin` (port 3001).
- Packages: `packages/ui`, `packages/types`, `packages/config`.

**Quick Start**
- Install: `pnpm install`
- Dev: `pnpm dev` (starts both apps)
- Build: `pnpm build`
- Open: http://localhost:3000 and http://localhost:3001

**Notes**
- Tailwind preset shared via `@pirate-nation/config`.
- UI components live in `@pn/ui`.
- Shared types and Zod schemas in `@pirate-nation/types`.

See `docs/requirements.md` for requirements and next steps.
