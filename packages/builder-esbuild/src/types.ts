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

export type GetEsbuildConfigProps = {
	isProduction: boolean;
};

export type BuilderOptions = {
	/**
	 * The easiest and recommended way to provide the esbuild config for your project.
	 * The builder will add a few configuration options over your configuration,
	 * and it should work out of the box.
	 * For some special cases you can use the esbuildFinal property at the top-level of configuration.
	 */
	esbuildConfig?:
		| BuildOptions
		| ((props: GetEsbuildConfigProps) => BuildOptions | Promise<BuildOptions>);
};
