import { type BuildOptions, build as esbuildBuild } from 'esbuild';

export type BuildProps = {
	entryPoints: BuildOptions['entryPoints'];
	outDir?: string;
};

const baseConfig: BuildOptions = {
	bundle: false,
	format: 'esm',
	target: 'node22',
	minify: false,
};

export const build = async ({ entryPoints, outDir = 'dist' }: BuildProps) => {
	return esbuildBuild({ ...baseConfig, entryPoints, outdir: outDir });
};
