# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Architecture

This is a monorepo for Storybook framework extensions, specifically focused on React and esbuild integration. The project uses Bun as the package manager and runtime.

**Repository Structure:**
- Root package.json defines the monorepo with workspaces in `packages/*`
- `packages/builder-esbuild/` - Builder package for Storybook with esbuild support (@makcbrain/storybook-builder-esbuild)
- `packages/framework-react-esbuild/` - Framework package for Storybook with React and esbuild support (@makcbrain/storybook-framework-react-esbuild)
- `stories/` - Test stories and components for Storybook development

**Technology Stack:**
- **Runtime:** Bun (>=1.2.20)
- **Build:** esbuild (0.25.9)  
- **Language:** TypeScript (5.9.2)
- **Module System:** ESNext with "Preserve" module mode
- **JSX:** React JSX transform

## Development Commands

**Installation:**
```bash
bun install
```

**Run main entry:**
```bash
bun run src/index.ts
```

## TypeScript Configuration

The project uses modern TypeScript with strict settings:
- Target: ESNext with bundler module resolution
- JSX: react-jsx transform
- Strict mode enabled with additional safety checks
- No emit (bundler handles compilation)
- Import extensions allowed for bundler compatibility

## Release Process

Both packages are always versioned and published together. Publishing is automated via GitHub Actions with OIDC trusted publishing (no npm tokens needed).

**How to release:**
1. Go to GitHub → Actions → "Publish" → Run workflow
2. Select bump type: `patch`, `minor`, or `major`
3. The workflow will: build, typecheck, test, bump versions, publish both packages to npm, commit version changes, and create a git tag

**Workflow:** `.github/workflows/publish.yml`

**Publish order:** `builder-esbuild` first, then `framework-react-esbuild` (framework depends on builder).

**Prerequisites (one-time setup):**
- Configure OIDC trusted publishing on npmjs.com for each package under Access settings
- Link to the `makcbrain/storybook-esbuild` repository and `publish.yml` workflow

## Claude Instructions

**Dependency Management:**
- Always install dependencies with exact versions using the `-E` flag: `bun add -E <package>`
- This ensures consistent builds across different environments and prevents version drift

**Development Guidelines:**
- Follow the existing code patterns and architecture
- Maintain TypeScript strict mode compliance
- Use Bun for all package management and runtime operations
- Use camelCase for file names and variables
- Use the English language for code
- Extract functions into separate files for better modularity and reusability
- Avoid using type assertions (as) in TypeScript where possible; prefer proper typing with generics or type annotations
- Prefer arrow functions over function syntax
