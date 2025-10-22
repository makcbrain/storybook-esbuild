import { join } from 'node:path';
import type { Options } from 'storybook/internal/types';

import { DIST_DIR_NAME } from '../constants.js';

export const getAbsolutePathToDistDir = (options: Options): string => {
	return join(options.configDir, DIST_DIR_NAME);
};
