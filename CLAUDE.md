# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Architecture

This is a monorepo for Storybook framework extensions, specifically focused on React and esbuild integration. The project uses Bun as the package manager and runtime.

**Repository Structure:**
- Root package.json defines the monorepo with workspaces in `packages/*`
- `packages/react-esbuild/` - Main package providing Storybook framework for React with esbuild support
- `src/index.ts` - Root-level entry point (currently minimal)

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