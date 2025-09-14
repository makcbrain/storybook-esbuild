# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Architecture

This is a monorepo for Storybook framework extensions, specifically focused on React and esbuild integration. The project uses Bun as the package manager and runtime.

**Repository Structure:**
- Root package.json defines the monorepo with workspaces in `packages/*`
- `packages/builder-esbuild/` - Builder package for Storybook with esbuild support (@makcbrain/builder-esbuild)
- `packages/storybook-framework-react-esbuild/` - Framework package for Storybook with React and esbuild support (@makcbrain/storybook-framework-react-esbuilfld)
- `stories/` - Test stories and components for Storybook development

**Current Development Status:**
- Storybook is currently configured with `@storybook/react-vite` framework for testing and debugging purposes
- This is a temporary setup to compare functionality with the target `@makcbrain/storybook-framework-react-esbuild` framework
- **Goal:** Migrate to use `@makcbrain/storybook-framework-react-esbuild` as the primary framework

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

## Claude Instructions

**Dependency Management:**
- Always install dependencies with exact versions using the `-E` flag: `bun add -E <package>`
- This ensures consistent builds across different environments and prevents version drift

**Development Guidelines:**
- Follow the existing code patterns and architecture
- Maintain TypeScript strict mode compliance
- Use Bun for all package management and runtime operations
