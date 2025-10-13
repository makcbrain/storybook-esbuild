import { join } from 'node:path';
import { globalExternals } from '@fal-works/esbuild-plugin-global-externals';
import type { BuildOptions } from 'esbuild';
import { globalsNameReferenceMap } from 'storybook/internal/preview/globals';
import type { Options } from 'storybook/internal/types';

import { csfPlugin } from '../plugins/csfPlugin.js';
import { virtualModulesPlugin } from '../plugins/virtualModulesPlugin.js';
import { getGlobalExternalsMapping } from './getGlobalExternalsMapping.js';

const stringifyEnvs = (envs: Record<string, string>): Record<string, string> => {
	return Object.entries(envs).reduce<Record<string, string>>((acc, [key, value]) => {
		acc[`process.env.${key}`] = JSON.stringify(value);
		return acc;
	}, {});
};

export const getEsbuildConfig = async (
	stories: string[],
	options: Options,
): Promise<BuildOptions> => {
	const { presets } = options;

	const envs = await presets.apply<Record<string, string>>('env');

	const config: BuildOptions = {
		entryPoints: [
			'virtualSetup.js', // Setup module - must be loaded first
			'virtualApp.js', // Main entry point
			...stories, // All .stories files
		],
		outdir: join(options.configDir, 'esbuild-out'),
		outbase: process.cwd(),
		bundle: true,
		splitting: true,
		format: 'esm',
		sourcemap: true,
		target: ['esnext'],
		define: {
			'process.env.NODE_ENV': JSON.stringify(
				options.configType === 'PRODUCTION' ? 'production' : 'development',
			),
			...stringifyEnvs(envs),
		},

		plugins: [
			// Replace Storybook runtime imports with global variables
			// This maps imports like 'storybook/preview-api' to window.__STORYBOOK_MODULE_PREVIEW_API__
			globalExternals(getGlobalExternalsMapping(globalsNameReferenceMap)),
			virtualModulesPlugin(options),
			csfPlugin(),
		],
		loader: {
			'.png': 'file',
			'.jpg': 'file',
			'.svg': 'file',
			'.woff': 'file',
			'.woff2': 'file',
		},
		resolveExtensions: ['.tsx', '.ts', '.jsx', '.js', '.mjs', '.json'],
	};

	return presets.apply('esbuildFinal', config, options);
};
