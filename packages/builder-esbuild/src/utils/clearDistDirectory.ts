import { rm } from 'node:fs/promises';
import type { Options } from 'storybook/internal/types';

import { getAbsolutePathToDistDir } from './getAbsolutePathToDistDir.js';

export const clearDistDirectory = async (options: Options): Promise<void> => {
	const dirPath = getAbsolutePathToDistDir(options);

	await rm(dirPath, { recursive: true, force: true });
};
