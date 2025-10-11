import type { Plugin } from 'esbuild';
import type { Options } from 'storybook/internal/types';

import { generateAppEntryCode } from '../utils/generateAppEntryCode.js';
import { generateSetupCode } from '../utils/generateSetupCode.js';

export const virtualModulesPlugin = (options: Options): Plugin => {
	return {
		name: 'virtual-modules',

		setup(build) {
			build.onResolve({ filter: /^virtualSetup\.js$/ }, () => ({
				path: 'virtualSetup.js',
				namespace: 'virtual',
			}));

			build.onResolve({ filter: /^virtualApp\.js$/ }, () => ({
				path: 'virtualApp.js',
				namespace: 'virtual',
			}));

			build.onLoad({ filter: /.*/, namespace: 'virtual' }, async (args) => {
				if (args.path === 'virtualSetup.js') {
					const code = generateSetupCode();
					return {
						contents: code,
						loader: 'js',
						resolveDir: options.configDir,
					};
				}

				if (args.path === 'virtualApp.js') {
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
};
