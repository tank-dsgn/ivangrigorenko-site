# ivangrigorenko.com

**Problem.** The portfolio was built in Figma Sites, so it could be changed only inside Figma.

**Idea.** Rebuild it on a stack that can be edited, and generate the layout from the Figma export instead of writing it by hand.

**Built.** A Next.js site in Russian and English: six case studies, About and Home. A generator turns the Figma export into pages, the components live in Storybook, and the build is checked against the original at three breakpoints.

**Decision.** Layout values are carried over one to one as inline styles, not Tailwind classes. Every number can be traced back to the design file, and nothing is lost to rounding.

## Stack

- Next.js 16 (App Router) + React 19
- TypeScript
- Tailwind CSS 4 (CSS-first, no `tailwind.config`)
- Storybook for the components
- Deployed on Vercel

## Running it

Node lives in `~/.local/node/bin` and is not on the default PATH:

```bash
export PATH="$HOME/.local/node/bin:$PATH"
npm install
npm run dev
```

Open http://localhost:3000 — the root redirects to `/home-ru`.

## Layout

```
app/                  one route per page, Russian and English
  layout.tsx          fonts, metadata, og image
  page.tsx            / → /home-ru
  globals.css         colour, shadow and breakpoint tokens
components/           hand-written components the generated pages call
components/generated/ the pages themselves, emitted from the Figma export
lib/                  page registry, metadata, asset map
tools/figma/          the generator: fetch, resolve, emit
tools/verify/         compares the build against the original site
public/a/             assets from the original export, by their Figma hash
```

Pages exist in both languages: six cases (`eazychange`, `autotor`, `pot`,
`ostral`, `vv`, `mikulich`), `about`, and `home`, each with a `-ru` and an
`-en` route, plus a `-menu-` route for the narrow-screen menu.

## How the pages are built

`tools/figma/` walks the Figma tree and emits JSX. Layout values are carried
over one to one as inline styles rather than Tailwind classes: that way every
number is traceable to the design file and nothing is lost to rounding.

Breakpoints match the original — three frames in Figma:

| | width | Tailwind prefix |
|---|---|---|
| Mobile | < 800 | no prefix |
| Tablet | 800–1279 | `md:` |
| Desktop | ≥ 1280 | `xl:` |

Geometry is checked against the original by computed style: page height and the
coordinates of cards and footer match at all three breakpoints. `tools/verify/`
holds that comparison.

Text corrections are applied on top of the export through
`tools/figma/overrides.json` (`textFixes`), so the Figma file is never edited
to fix a typo.

## Deploying

The repository is connected to the Vercel project `ivangrigorenko-site`
(Tank-dsgn team). A push to `main` ships production at
https://ivangrigorenko.com; a push to any other branch makes a preview.

Manual deploy, if it is ever needed:

```bash
npx vercel@latest deploy --prod
```
