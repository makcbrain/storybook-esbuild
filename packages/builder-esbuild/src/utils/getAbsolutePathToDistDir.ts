import { join } from 'node:path';
import { cache } from 'empathic/package';
import type { Options } from 'storybook/internal/types';

import { DIST_DIR_NAME } from '../constants.js';

export const getAbsolutePathToDistDir = (options: Options): string => {
	const cacheDir = cache(`@makcbrain-storybook-builder-esbuild`, {
		create: true,
		cwd: options.configDir,
	});

	if (cacheDir) {
		return cacheDir;
	}

	console.warn(
		'[@makcbrain/storybook-builder-esbuild] Could not find or create cache directory in node_modules/.cache. ' +
			`Using ${DIST_DIR_NAME} directory in .storybook instead. ` +
			'Please ensure this directory is added to .gitignore and linter exclusions.',
	);

	return join(options.configDir, DIST_DIR_NAME);
};
