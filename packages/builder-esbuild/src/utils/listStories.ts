import { isAbsolute, join } from 'node:path';
import { glob } from 'glob';
import slash from 'slash';
import { commonGlobOptions, normalizeStories } from 'storybook/internal/common';
import type { Options } from 'storybook/internal/types';

export const listStories = async (options: Options): Promise<string[]> => {
	const storiesGlobs = await options.presets.apply('stories', [], options);

	const normalizedStories = normalizeStories(storiesGlobs, {
		configDir: options.configDir,
		workingDir: process.cwd(),
	});

	const storyFiles = (
		await Promise.all(
			normalizedStories.map(async ({ directory, files }) => {
				const pattern = join(directory, files);
				const absolutePattern = isAbsolute(pattern) ? pattern : join(options.configDir, pattern);

				return glob(slash(absolutePattern), {
					...commonGlobOptions(absolutePattern),
					follow: true,
				});
			}),
		)
	)
		.flat()
		.sort(); // Sort for deterministic builds

	return storyFiles;
};
