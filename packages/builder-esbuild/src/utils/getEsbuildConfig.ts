import { join } from 'node:path';
import { globalExternals } from '@fal-works/esbuild-plugin-global-externals';
import type { BuildOptions } from 'esbuild';
import { globalsNameReferenceMap } from 'storybook/internal/preview/globals';
import type { Options } from 'storybook/internal/types';

import { csfPlugin } from '../plugins/csfPlugin.js';
import { virtualModulesPlugin } from '../plugins/virtualModulesPlugin.js';

function stringifyEnvs(envs: Record<string, string>): Record<string, string> {
	return Object.entries(envs).reduce<Record<string, string>>((acc, [key, value]) => {
		acc[`process.env.${key}`] = JSON.stringify(value);
		return acc;
	}, {});
}

export async function getEsbuildConfig(stories: string[], options: Options): Promise<BuildOptions> {
	const { presets } = options;

	// Get settings from presets
	const envs = await presets.apply<Record<string, string>>('env');

	const config: BuildOptions = {
		// Entry points: all story files + virtual app module
		entryPoints: [
			'virtual:app.js', // Main entry point
			...stories, // All .stories files
		],

		// Output
		outdir: join(options.configDir, '.storybook/esbuild-out'),
		outbase: process.cwd(),

		// Mode and format
		bundle: true,
		format: 'esm',
		splitting: true, // Code splitting for optimization
		metafile: true, // For bundle analysis

		// Source maps
		sourcemap: true,

		// Target
		target: ['es2020', 'chrome90', 'firefox88', 'safari14'],

		// Define global variables
		define: {
			'process.env.NODE_ENV': JSON.stringify(
				options.configType === 'PRODUCTION' ? 'production' : 'development',
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
			csfPlugin(),

			// Framework-specific plugins (React, Vue, etc.)
			// TODO: Add framework plugins
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
	};

	return presets.apply('esbuildFinal', config, options);
}
