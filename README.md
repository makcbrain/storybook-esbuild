# storybook-esbuild

A monorepo dedicated to integrating Storybook with esbuild.

## Packages

### [@makcbrain/storybook-builder-esbuild](./packages/builder-esbuild)

Storybook builder implementation using esbuild. Provides core build functionality with support for:

- TypeScript
- MDX
- Story reload on file changes
- Custom esbuild configuration

### [@makcbrain/storybook-framework-react-esbuild](./packages/framework-react-esbuild)

Storybook framework that combines React with the esbuild builder. Key features:

- React versions 16.8 - 19 support
- Automatic documentation generation (autodocs)
- MDX support
- TypeScript with type checking
- React Strict Mode
- Configurable esbuild settings

**Note:** Static build is not supported.

## Installation

```bash
bun install
```

## Usage

To build all packages and launch Storybook:
```bash
bun run tsl
```

## Technology

This project uses [Bun](https://bun.sh) — a fast all-in-one JavaScript runtime and package manager.
