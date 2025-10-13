import { isAbsolute, join, resolve } from 'node:path';
import { glob } from 'glob';
import slash from 'slash';
import { commonGlobOptions, normalizeStories } from 'storybook/internal/common';
import type { Options } from 'storybook/internal/types';

/**
 * Returns absolute paths to stories
 */
export const listStories = async (options: Options): Promise<string[]> => {
	const storiesGlobs = await options.presets.apply('stories', [], options);

	const normalizedStories = normalizeStories(storiesGlobs, {
		configDir: options.configDir,
		workingDir: process.cwd(),
	});

	return (
		await Promise.all(
			normalizedStories.map(async ({ directory, files }) => {
				const absoluteDirectory = isAbsolute(directory)
					? directory
					: resolve(process.cwd(), directory);
				const absolutePattern = join(absoluteDirectory, files);

				return glob(slash(absolutePattern), {
					...commonGlobOptions(absolutePattern),
					follow: true,
				});
			}),
		)
	)
		.flat()
		.sort();
};
