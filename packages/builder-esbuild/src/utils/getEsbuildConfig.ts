import { globalExternals } from '@fal-works/esbuild-plugin-global-externals';
import type { BuildOptions } from 'esbuild';
import { globalsNameReferenceMap } from 'storybook/internal/preview/globals';
import type { Options } from 'storybook/internal/types';

import { reactDocGenPlugin } from '../plugins/reactDocGenPlugin.js';
import { virtualModulesPlugin } from '../plugins/virtualModulesPlugin.js';
import type { BuilderOptions } from '../types.js';
import { getAbsolutePathToDistDir } from './getAbsolutePathToDistDir.js';
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
	const frameworkOptions = await presets.apply<{ builder?: BuilderOptions }>('framework');
	const builderOptions = frameworkOptions?.builder;
	let userEsbuildConfig: BuildOptions = {};

	if (typeof builderOptions?.esbuildConfig === 'object') {
		userEsbuildConfig = builderOptions?.esbuildConfig;
	} else if (typeof builderOptions?.esbuildConfig === 'function') {
		userEsbuildConfig = await builderOptions.esbuildConfig({
			isProduction: options.configType === 'PRODUCTION',
		});
	}

	const config: BuildOptions = {
		loader: {
			'.png': 'file',
			'.jpg': 'file',
			'.svg': 'file',
			'.woff': 'file',
			'.woff2': 'file',
		},
		resolveExtensions: ['.tsx', '.ts', '.jsx', '.js', '.mjs', '.json'],
		sourcemap: true,
		target: ['esnext'],
		...userEsbuildConfig,
		entryPoints: [
			'virtualSetup.js', // Setup module - must be loaded first
			'virtualApp.js', // Main entry point
			...stories, // All .stories files
		],
		outdir: getAbsolutePathToDistDir(options),
		outbase: process.cwd(),
		bundle: true,
		splitting: true,
		format: 'esm',
		define: {
			'process.env.NODE_ENV': JSON.stringify(
				options.configType === 'PRODUCTION' ? 'production' : 'development',
			),
			...stringifyEnvs(envs),
			...userEsbuildConfig.define,
		},
		plugins: [
			// Replace Storybook runtime imports with global variables
			// This maps imports like 'storybook/preview-api' to window.__STORYBOOK_MODULE_PREVIEW_API__
			globalExternals(getGlobalExternalsMapping(globalsNameReferenceMap)),
			virtualModulesPlugin(options),
			reactDocGenPlugin(),
			...(userEsbuildConfig.plugins || []),
		],
	};

	return presets.apply('esbuildFinal', config, options);
};
