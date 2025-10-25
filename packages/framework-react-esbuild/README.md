# @makcbrain/storybook-framework-react-esbuild

Storybook framework for React with esbuild builder.

## Description

This framework integrates React with Storybook using esbuild as the build system. It supports autodocs and MDX.

**Supported React versions:** 16.8 - 19

**Note:** Static build is not supported.

## Installation

```bash
npm install --save-dev @makcbrain/storybook-framework-react-esbuild
```

## Configuration

### Basic Setup

`.storybook/main.ts`:

```typescript
import type { StorybookConfig } from '@makcbrain/storybook-framework-react-esbuild';

const config: StorybookConfig = {
  stories: ['../stories/**/*.mdx', '../stories/**/*.stories.@(js|jsx|mjs|ts|tsx)'],
  addons: ['@storybook/addon-docs'],
  framework: {
    name: '@makcbrain/storybook-framework-react-esbuild',
  },
};

export default config;
```

### Framework Options

```typescript
const config: StorybookConfig = {
  stories: ['../stories/**/*.stories.@(js|jsx|ts|tsx)'],
  framework: {
    name: '@makcbrain/storybook-framework-react-esbuild',
    options: {
      // Builder options
      builder: {
        esbuildConfig: ({ isProduction }) => {
          return {
            sourcemap: !isProduction,
            minify: isProduction,
          };
        },
      },
      // Enable React strict mode
      strictMode: true,
      // Use React 17 legacy root API (default: false)
      legacyRootApi: false,
    },
  },
};
```

### esbuild Configuration

#### builder.esbuildConfig (Recommended)

Use `builder.esbuildConfig` to provide your project's esbuild configuration. The framework will automatically add required properties such as `entryPoints` with story files and necessary plugins.

**This is the recommended approach for most users.**

```typescript
const config: StorybookConfig = {
  stories: ['../stories/**/*.stories.@(js|jsx|ts|tsx)'],
  framework: {
    name: '@makcbrain/storybook-framework-react-esbuild',
    options: {
      builder: {
        esbuildConfig: ({ isProduction }) => {
          // Return your project's esbuild config
          // Framework will merge this with required Storybook settings
          return {
            sourcemap: !isProduction,
            target: 'es2020',
            jsxDev: !isProduction,
          };
        },
      },
    },
  },
};
```

#### esbuildFinal (Advanced)

Use `esbuildFinal` only when you need to patch the final esbuild configuration after the framework has applied all settings. This is rarely needed.

```typescript
const config: StorybookConfig = {
  stories: ['../stories/**/*.stories.@(js|jsx|ts|tsx)'],
  framework: {
    name: '@makcbrain/storybook-framework-react-esbuild',
  },
  esbuildFinal: (config) => {
    // Modify the final esbuild config if needed
    // Most users should use builder.esbuildConfig instead
    return config;
  },
};
```

## Type Definitions

### StorybookConfig

Main configuration type for `.storybook/main.ts`.

### FrameworkOptions

- `builder`: Builder-specific options
  - `esbuildConfig`: Function that returns your project's esbuild configuration. The framework will merge this with required Storybook settings.
- `strictMode`: Enable React strict mode (boolean)
- `legacyRootApi`: Use React 17 legacy root API (boolean, default: false)

## Features

- **React 16.8 - 19**: Support for React versions from 16.8 to 19
- **Autodocs**: Automatic documentation generation from component props
- **MDX Support**: Write documentation in MDX format
- **TypeScript**: Full TypeScript support with type checking
- **Source Maps**: Configurable source map generation

## Limitations

- Static build is not supported
- No Hot Module Replacement (stories reload on file changes)

## License

MIT

## Links

- [Builder Package](https://www.npmjs.com/package/@makcbrain/storybook-builder-esbuild)
- [Storybook Documentation](https://storybook.js.org)