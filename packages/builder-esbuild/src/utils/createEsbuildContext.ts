import * as esbuild from 'esbuild';
import type { Options } from 'storybook/internal/types';

import { getEsbuildConfig } from './getEsbuildConfig.js';

export const createEsbuildContext = async (
	stories: string[],
	options: Options,
	onRebuild?: () => void,
): Promise<esbuild.BuildContext> => {
	const config = await getEsbuildConfig(stories, options, onRebuild);

	return esbuild.context(config);
};
