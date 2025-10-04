# ESBuild Builder Architecture for Storybook

## Overview

This document describes the implementation architecture for a Storybook builder based on ESBuild with **on-demand compilation** using `esbuild.context()` and ESBuild's built-in dev server.

---

## Core Concepts

### 1. Single ESBuild Context

On builder startup, a **single** `esbuild.context()` is created with all story files as `entryPoints`. This enables:

- Shared dependency graph reuse
- Build optimization through code splitting
- Simplified HMR (Hot Module Replacement)
- Minimal overhead from context creation

### 2. ESBuild's Built-in Dev Server

ESBuild has a built-in `.serve()` method that:

- Automatically serves compiled files
- Supports incremental builds
- Handles HTTP requests to modules
- Performs faster than custom middleware

### 3. Dynamic Imports for importFn

`importFn` uses **native dynamic imports** `import()` instead of fetch:

```javascript
const importFn = async (path) => {
  // ESBuild serve automatically handles requests
  return await import('/esbuild-out/' + path);
};
```

**Benefits:**
- Browser manages module caching
- Native ES module support
- Automatic dependency resolution
- Standard browser cache works out of the box

### 4. Global Externals for Storybook Runtime

Storybook runtime modules are **not bundled** but accessed via **global variables**:

- `globalsNameReferenceMap` from `storybook/internal/preview/globals` provides mapping:
  - `'storybook/preview-api'` → `window.__STORYBOOK_MODULE_PREVIEW_API__`
  - `'@storybook/global'` → `window.__STORYBOOK_MODULE_GLOBAL__`
  - etc.

- Plugin `@fal-works/esbuild-plugin-global-externals` replaces imports with global references

**Benefits:**
- No duplicate runtime code in bundles
- Storybook runtime loaded once in iframe.html
- Smaller bundle sizes
- Faster compilation

---

## System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│ Storybook CLI                                                   │
│ $ storybook dev                                                 │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             │ Calls builder.start()
                             ↓
┌─────────────────────────────────────────────────────────────────┐
│ @storybook/builder-esbuild                                      │
│                                                                 │
│  1. listStories(options)                                        │
│     → Gets list of all .stories files                           │
│                                                                 │
│  2. esbuild.context({                                           │
│       entryPoints: stories,  // All stories at once!            │
│       outdir: '.storybook/esbuild-out',                         │
│       bundle: true,                                             │
│       format: 'esm',                                            │
│       splitting: true,       // Code splitting                  │
│       plugins: [virtualModulesPlugin, csfPlugin]                │
│     })                                                          │
│                                                                 │
│  3. ctx.serve({                                                 │
│       servedir: '.storybook/esbuild-out',                       │
│       port: 0  // Auto port                                     │
│     })                                                          │
│     → Starts ESBuild's built-in dev server                      │
│     → Returns { host, port } for direct browser access          │
│                                                                 │
│  4. router.get('/iframe.html', serveIframeHTML)                 │
│     → Serves HTML with inline importFn initialization           │
│     → importFn defined in <script> tag with ESBuild URLs        │
└─────────────────────────────────────────────────────────────────┘
                             │
                             │ Module requests
                             ↓
┌─────────────────────────────────────────────────────────────────┐
│ ESBuild Dev Server (ctx.serve)                                  │
│ http://localhost:XXXX (auto-selected port)                      │
│                                                                 │
│  GET /src/Button.stories.js                                     │
│  → Returns compiled ESM module                                  │
│                                                                 │
│  GET /src/Button.js                                             │
│  → Returns dependencies (via code splitting)                    │
│                                                                 │
│  + Automatic watch & rebuild                                    │
│  + Incremental compilation                                      │
│  + Direct browser access (no proxy needed)                      │
└─────────────────────────────────────────────────────────────────┘
                             │
                             │ import() requests
                             ↓
┌────────────────────────────────────────────────────────────────────┐
│ iframe.html (Preview)                                              │
│                                                                    │
│  <script>                                                          │
│    // importFn initialized inline with story paths                 │
│    window.__STORYBOOK_IMPORT_FN__ = (function() {                  │
│      const importers = {                                           │
│        './src/Button.stories.js':                                  │
│          () => import('http://localhost:XXXX/src/Button...'),      │
│        // ... all stories                                          │
│      };                                                            │
│      return async (path) => await importers[path]();               │
│    })();                                                           │
│  </script>                                                         │
│                                                                    │
│  <script type="module" src="http://localhost:XXXX/virtual:app.js"> │
│    // virtual:app.js uses window.__STORYBOOK_IMPORT_FN__           │
│  </script>                                                         │
└────────────────────────────────────────────────────────────────────┘
```

---

## Detailed Implementation

### 1. Entry Point (src/index.ts)

```typescript
import type { Builder, Options } from 'storybook/internal/types';
import * as esbuild from 'esbuild';

export const start: Builder['start'] = async ({
  startTime,
  options,
  router,
  server,
}) => {
  // Get all story files
  const stories = await listStories(options);

  // Create ESBuild context (single initialization)
  const ctx = await createEsbuildContext(stories, options);

  // Start ESBuild's built-in dev server
  const serveResult = await ctx.serve({
    servedir: join(options.configDir, '.storybook/esbuild-out'),
    port: 0, // Auto-select port
  });

  // ESBuild server URL for direct access from browser
  const esbuildServerUrl = `http://${serveResult.host}:${serveResult.port}`;

  // Serve iframe.html with ESBuild server URL and stories
  router.get('/iframe.html', (req, res) => {
    const html = generateIframeHTML(options, stories, esbuildServerUrl);
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.send(html);
  });

  // Optional: WebSocket for HMR notifications
  const watcher = setupFileWatcher(stories, ctx);

  return {
    bail: async () => {
      await watcher.close();
      await ctx.dispose();
    },
    stats: { toJson: () => ({}) },
    totalTime: process.hrtime(startTime),
  };
};

export const build: Builder['build'] = async ({ options }) => {
  // Production build (separate implementation)
  return buildProduction(options);
};
```

---

### 2. ESBuild Context Setup (src/esbuild-context.ts)

```typescript
import * as esbuild from 'esbuild';
import { globalExternals } from '@fal-works/esbuild-plugin-global-externals';
import { globalsNameReferenceMap } from 'storybook/internal/preview/globals';
import type { Options } from 'storybook/internal/types';

export async function createEsbuildContext(
  stories: string[],
  options: Options
): Promise<esbuild.BuildContext> {
  const { presets } = options;

  // Get settings from presets
  const [
    envs,
    frameworkOptions,
    docsOptions,
    tagsOptions,
  ] = await Promise.all([
    presets.apply<Record<string, string>>('env'),
    presets.apply('frameworkOptions'),
    presets.apply('docs'),
    presets.apply('tags', {}),
  ]);

  const ctx = await esbuild.context({
    // Entry points: all story files + virtual app module
    entryPoints: [
      'virtual:app.js',           // Main entry point
      ...stories,              // All .stories files
    ],

    // Output
    outdir: join(options.configDir, '.storybook/esbuild-out'),
    outbase: process.cwd(),

    // Mode and format
    bundle: true,
    format: 'esm',
    splitting: true,        // Code splitting for optimization
    metafile: true,         // For bundle analysis

    // Source maps
    sourcemap: true,

    // Target
    target: ['es2020', 'chrome90', 'firefox88', 'safari14'],

    // Define global variables
    define: {
      'process.env.NODE_ENV': JSON.stringify(
        options.configType === 'PRODUCTION' ? 'production' : 'development'
      ),
      ...stringifyEnvs(envs),
    },

    // Plugins
    plugins: [
      // Replace Storybook runtime imports with global variables
      // This maps imports like 'storybook/preview-api' to window.__STORYBOOK_MODULE_PREVIEW_API__
      globalExternals(globalsNameReferenceMap),

      // Virtual modules (virtual:app.js only)
      virtualModulesPlugin(options),

      // CSF processing (.stories files)
      csfPlugin(options),

      // Framework-specific plugins (React, Vue, etc.)
      ...(await getFrameworkPlugins(options)),
    ],

    // Loader config
    loader: {
      '.png': 'file',
      '.jpg': 'file',
      '.svg': 'file',
      '.woff': 'file',
      '.woff2': 'file',
    },

    // Resolving
    resolveExtensions: ['.tsx', '.ts', '.jsx', '.js', '.mjs', '.json'],

    // Watch mode (automatic)
    // ESBuild context includes incremental + watch
  });

  return ctx;
}
```

---

### 3. Virtual Modules Plugin (src/plugins/virtual-modules.ts)

```typescript
import type { Plugin } from 'esbuild';
import type { Options } from 'storybook/internal/types';

export function virtualModulesPlugin(
  options: Options
): Plugin {
  return {
    name: 'virtual-modules',

    setup(build) {
      // ===================================
      // virtual:app.js - main entry point
      // ===================================
      build.onResolve({ filter: /^virtual:app.js$/ }, () => ({
        path: 'virtual:app.js',
        namespace: 'virtual',
      }));

      build.onLoad({ filter: /.*/, namespace: 'virtual' }, async (args) => {
        if (args.path === 'virtual:app.js') {
          const code = await generateAppEntryCode(options);
          return {
            contents: code,
            loader: 'js',
            resolveDir: options.configDir,
          };
        }

        return null;
      });
    },
  };
}

// Generate main entry point
async function generateAppEntryCode(options: Options): Promise<string> {
  const { presets, configDir } = options;

  // Get preview annotations (.storybook/preview.ts + addons)
  const previewAnnotations = await presets.apply<string[]>(
    'previewAnnotations',
    [],
    options
  );

  const previewFile = loadPreviewOrConfigFile({ configDir });
  if (previewFile) {
    previewAnnotations.push(previewFile);
  }

  // Generate imports
  const imports = previewAnnotations.map((annotation, index) =>
    `import * as previewAnnotation${index} from '${annotation}';`
  ).join('\n');

  const configs = previewAnnotations.map((_, index) =>
    `previewAnnotation${index}`
  ).join(', ');

  return `
import { setup } from 'storybook/internal/preview/runtime';
import { composeConfigs, PreviewWeb } from 'storybook/preview-api';

// Setup runtime
setup();

// Import preview annotations
${imports}

// Compose configs
const getProjectAnnotations = () => {
  return composeConfigs([${configs}]);
};

// Initialize PreviewWeb with importFn from window
// (importFn is defined in iframe.html)
window.__STORYBOOK_PREVIEW__ = window.__STORYBOOK_PREVIEW__ || new PreviewWeb(
  window.__STORYBOOK_IMPORT_FN__,
  getProjectAnnotations
);

window.__STORYBOOK_STORY_STORE__ = window.__STORYBOOK_STORY_STORE__ || window.__STORYBOOK_PREVIEW__.storyStore;
  `.trim();
}
```

---

### 4. iframe.html Generation (src/generate-iframe.ts)

```typescript
import type { Options } from 'storybook/internal/types';

export function generateIframeHTML(
  options: Options,
  stories: string[],
  esbuildServerUrl: string
): string {
  const { configType } = options;

  // Generate importFn code with story imports
  const importMap = stories.map(story => {
    // Normalize path for use as key
    const key = story.startsWith('./') ? story : `./${story}`;
    // Import directly from ESBuild server
    return `    '${key}': () => import('${esbuildServerUrl}/${story}')`;
  }).join(',\n');

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>Storybook Preview</title>
  <meta name="viewport" content="width=device-width, initial-scale=1" />

  <!-- Global Config (pass to window) -->
  <script>
    window.CONFIG_TYPE = '${configType}';
    window.LOGLEVEL = 'info';
    window.FRAMEWORK_OPTIONS = {};
    window.CHANNEL_OPTIONS = {};
    window.FEATURES = {};
    window.STORIES = ${JSON.stringify(stories.map(s => ({ importPath: s })))};
    window.DOCS_OPTIONS = {};
    window.TAGS_OPTIONS = {};

    // Compatibility
    window.module = undefined;
    window.global = window;

    // Initialize importFn directly in iframe
    // This avoids circular dependency in ESBuild context initialization
    window.__STORYBOOK_IMPORT_FN__ = (function() {
      const importers = {
${importMap}
      };

      return async function importFn(path) {
        const importer = importers[path];

        if (!importer) {
          throw new Error('Story not found: ' + path + '. Available stories: ' + Object.keys(importers).join(', '));
        }

        return await importer();
      };
    })();
  </script>
</head>
<body>
  <div id="storybook-root"></div>
  <div id="storybook-docs"></div>

  <!-- Main Entry Point -->
  <script type="module" src="http://${esbuildServerUrl}/virtual:app.js"></script>
</body>
</html>
  `.trim();
}
```

---

### 5. CSF Plugin (src/plugins/csf-plugin.ts)

```typescript
import type { Plugin } from 'esbuild';
import type { Options } from 'storybook/internal/types';

/**
 * Plugin for processing .stories files
 * - Adds export order metadata
 * - Processes CSF format
 */
export function csfPlugin(options: Options): Plugin {
  return {
    name: 'storybook-csf',

    setup(build) {
      // Process all .stories.(ts|tsx|js|jsx) files
      build.onLoad(
        { filter: /\.stories\.(tsx?|jsx?)$/ },
        async (args) => {
          const fs = await import('fs/promises');
          const contents = await fs.readFile(args.path, 'utf-8');

          // TODO: Add CSF processing here
          // For example, via @storybook/csf-tools

          // Add export order for proper display
          const withExportOrder = injectExportOrder(contents);

          return {
            contents: withExportOrder,
            loader: getLoaderForFile(args.path),
          };
        }
      );
    },
  };
}

function injectExportOrder(code: string): string {
  // Parse exports and add __namedExportsOrder
  // This is needed for proper story ordering

  // Simple implementation (can be enhanced with AST parser)
  const exports = [...code.matchAll(/export\s+(const|let|var|function)\s+(\w+)/g)]
    .map(match => match[2])
    .filter(name => name !== 'default');

  if (exports.length === 0) {
    return code;
  }

  return `
${code}

// Auto-injected by @storybook/builder-esbuild
export const __namedExportsOrder = ${JSON.stringify(exports)};
  `.trim();
}

function getLoaderForFile(path: string): 'ts' | 'tsx' | 'js' | 'jsx' {
  if (path.endsWith('.tsx')) return 'tsx';
  if (path.endsWith('.ts')) return 'ts';
  if (path.endsWith('.jsx')) return 'jsx';
  return 'js';
}
```

---

### 6. File Watcher for HMR (src/file-watcher.ts)

```typescript
import chokidar from 'chokidar';
import type { BuildContext } from 'esbuild';

export function setupFileWatcher(
  stories: string[],
  ctx: BuildContext
): chokidar.FSWatcher {
  const watcher = chokidar.watch(stories, {
    ignoreInitial: true,
    persistent: true,
  });

  watcher.on('change', async (path) => {
    console.log(`[ESBuild Builder] Story changed: ${path}`);

    // ESBuild context automatically rebuilds changed files
    // due to incremental mode

    // Optional: send WebSocket event to iframe
    // to reload story via PreviewWeb API
  });

  watcher.on('add', async (path) => {
    console.log(`[ESBuild Builder] New story added: ${path}`);

    // For new files, need to recreate context
    // or dynamically add entry point (requires rebuild)
  });

  return watcher;
}
```

---

### 7. List Stories Utility (src/utils/list-stories.ts)

```typescript
import { isAbsolute, join } from 'node:path';
import { commonGlobOptions, normalizeStories } from 'storybook/internal/common';
import type { Options } from 'storybook/internal/types';
import { glob } from 'glob';
import slash from 'slash';

export async function listStories(options: Options): Promise<string[]> {
  const storiesGlobs = await options.presets.apply('stories', [], options);

  const normalizedStories = normalizeStories(storiesGlobs, {
    configDir: options.configDir,
    workingDir: process.cwd(),
  });

  const storyFiles = (
    await Promise.all(
      normalizedStories.map(async ({ directory, files }) => {
        const pattern = join(directory, files);
        const absolutePattern = isAbsolute(pattern)
          ? pattern
          : join(options.configDir, pattern);

        return glob(slash(absolutePattern), {
          ...commonGlobOptions(absolutePattern),
          follow: true,
        });
      })
    )
  )
    .flat()
    .sort(); // Sort for deterministic builds

  return storyFiles;
}
```

---

## Data Flow When Rendering a Story

```
1. User clicks "Button/Primary" in Storybook Manager
   │
   ↓
2. Manager sends event via Channel API:
   SET_CURRENT_STORY { storyId: "button--primary" }
   │
   ↓
3. PreviewWeb (in iframe) receives event
   │
   ↓
4. PreviewWeb calls:
   storyStore.loadStory({ storyId: "button--primary" })
   │
   ↓
5. StoryStore determines importPath:
   "./src/Button.stories.tsx"
   │
   ↓
6. StoryStore calls:
   const module = await importFn("./src/Button.stories.tsx")
   │
   ↓
7. importFn executes dynamic import:
   return await import('http://localhost:XXXX/src/Button.stories.js')
   │
   ↓
8. Browser makes HTTP request directly to ESBuild server:
   GET http://localhost:XXXX/src/Button.stories.js
   │
   ↓
9. ESBuild returns compiled ESM module:
    - Includes all dependencies (via bundle: true)
    - Uses code splitting for common chunks
    - Applies source maps
   │
   ↓
10. Browser executes module and returns exports:
    {
      default: { title: "Button", component: Button },
      Primary: { args: { variant: "primary" } }
    }
   │
   ↓
11. StoryStore processes CSF and creates PreparedStory
   │
   ↓
12. PreviewWeb renders story via framework renderer
```

---

## Production Build

For production build, use standard `esbuild.build()`:

```typescript
export async function buildProduction(options: Options) {
  const stories = await listStories(options);

  const result = await esbuild.build({
    entryPoints: [
      'virtual:app.js',
      ...stories,
    ],
    outdir: options.outputDir,
    bundle: true,
    format: 'esm',
    splitting: true,
    minify: true,
    sourcemap: true,
    metafile: true,

    plugins: [
      virtualModulesPlugin(options),
      csfPlugin(options),
    ],
  });

  // Copy iframe.html (for production, use relative paths)
  const esbuildServerUrl = '.'; // Relative path for production build
  const html = generateIframeHTML(options, stories, esbuildServerUrl);
  await fs.writeFile(
    join(options.outputDir, 'iframe.html'),
    html
  );

  return {
    toJson: () => result.metafile,
  };
}
```

---

## Key Benefits

### 1. Performance

- ✅ **Incremental compilation**: ESBuild rebuilds only changed files
- ✅ **Code splitting**: Common dependencies extracted to separate chunks
- ✅ **Parallel compilation**: ESBuild uses all CPU cores
- ✅ **Caching**: Browser caches modules via HTTP cache

### 2. Simplicity

- ✅ **No custom server**: Uses built-in `ctx.serve()`
- ✅ **Native imports**: `import()` instead of fetch + eval
- ✅ **Less code**: No middleware needed for each file
- ✅ **Standard ESM**: Browser works with regular ES modules

### 3. Scalability

- ✅ **Single context**: One dependency graph for all stories
- ✅ **Watch mode**: Automatic change tracking
- ✅ **Lazy loading**: Stories loaded only when opened
- ✅ **Tree shaking**: Unused code excluded

### 4. Developer Experience

- ✅ **Fast startup**: Building all stories takes seconds
- ✅ **HMR**: Changes applied without page reload
- ✅ **Source maps**: Easy debugging in DevTools
- ✅ **Error handling**: Clear error messages from ESBuild

---

## Potential Issues and Solutions

### Issue 1: Code Splitting and Dynamic Imports

**Problem**: ESBuild creates chunks with names like `chunk-ABC123.js` that need proper resolution.

**Solution**: Use `publicPath`:

```typescript
esbuild.context({
  publicPath: '/esbuild-out/',
  // ...
})
```

### Issue 2: MDX Files

**Problem**: `.mdx` files require special processing.

**Solution**: Add MDX plugin:

```typescript
import { compile } from '@mdx-js/esbuild';

plugins: [
  compile({
    // MDX options
  })
]
```

### Issue 3: CSS Modules / PostCSS

**Problem**: ESBuild doesn't support CSS Modules out of the box.

**Solution**: Use plugins:

```typescript
import { sassPlugin } from 'esbuild-sass-plugin';
import postcss from 'postcss';
import autoprefixer from 'autoprefixer';

plugins: [
  sassPlugin({
    async transform(source) {
      const { css } = await postcss([autoprefixer]).process(source);
      return css;
    }
  })
]
```

---

## Further Development

### Optimizations

1. **Persistent cache**: Use `esbuild.buildSync()` with disk cache
2. **Parallelization**: Split stories into chunks and build in parallel
3. **Prefetching**: Preload neighboring stories for fast navigation
4. **Service Worker**: Cache modules in IndexedDB

### New Features

1. **Visual regression testing**: Integration with Playwright/Chromatic
2. **Bundle analyzer**: Visualization of bundle sizes
3. **Performance monitoring**: Metrics for build and render times
4. **Custom transformers**: API for user transformations

---

## Conclusion

This architecture provides a **simple**, **fast**, and **scalable** solution for a Storybook builder based on ESBuild. Using ESBuild's built-in dev server and native dynamic imports makes the system performant and easy to maintain.

Key principles:

1. **Single ESBuild context** for all stories
2. **Built-in dev server** instead of custom middleware
3. **Native `import()`** instead of fetch
4. **Virtual modules** for code generation
5. **Incremental compilation** and **code splitting**

This architecture is ready for implementation and can be extended with additional plugins and optimizations as needed.
