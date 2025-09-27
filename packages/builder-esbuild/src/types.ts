import type { BuildOptions } from 'esbuild';
import type { Builder, Options, Stats } from 'storybook/internal/types';

type EsbuildStats = Stats;

export type EsbuildBuilder = Builder<BuildOptions, EsbuildStats>;

export type EsbuildFinal = (
	config: BuildOptions,
	options: Options,
) => BuildOptions | Promise<BuildOptions>;

export type StorybookConfigEsbuild = {
	esbuildFinal?: EsbuildFinal;
};

export type BuilderOptions = {};
