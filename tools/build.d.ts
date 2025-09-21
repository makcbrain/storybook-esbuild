import { type BuildOptions } from 'esbuild';
export type BuildProps = {
	entryPoints: BuildOptions['entryPoints'];
	outDir?: string;
};
export declare const build: ({ entryPoints, outDir }: BuildProps) => Promise<
	import('esbuild').BuildResult<{
		entryPoints:
			| (
					| string
					| {
							in: string;
							out: string;
					  }
			  )[]
			| Record<string, string>
			| undefined;
		outdir: string;
		bundle?: boolean;
		splitting?: boolean;
		preserveSymlinks?: boolean;
		outfile?: string;
		metafile?: boolean;
		outbase?: string;
		external?: string[];
		packages?: 'bundle' | 'external';
		alias?: Record<string, string>;
		loader?: {
			[ext: string]: import('esbuild').Loader;
		};
		resolveExtensions?: string[];
		mainFields?: string[];
		conditions?: string[];
		write?: boolean;
		allowOverwrite?: boolean;
		tsconfig?: string;
		outExtension?: {
			[ext: string]: string;
		};
		publicPath?: string;
		entryNames?: string;
		chunkNames?: string;
		assetNames?: string;
		inject?: string[];
		banner?: {
			[type: string]: string;
		};
		footer?: {
			[type: string]: string;
		};
		stdin?: import('esbuild').StdinOptions;
		plugins?: import('esbuild').Plugin[];
		absWorkingDir?: string;
		nodePaths?: string[];
		sourcemap?: boolean | 'linked' | 'inline' | 'external' | 'both';
		legalComments?: 'none' | 'inline' | 'eof' | 'linked' | 'external';
		sourceRoot?: string;
		sourcesContent?: boolean;
		format?: import('esbuild').Format;
		globalName?: string;
		target?: string | string[];
		supported?: Record<string, boolean>;
		platform?: import('esbuild').Platform;
		mangleProps?: RegExp;
		reserveProps?: RegExp;
		mangleQuoted?: boolean;
		mangleCache?: Record<string, string | false>;
		drop?: import('esbuild').Drop[];
		dropLabels?: string[];
		minify?: boolean;
		minifyWhitespace?: boolean;
		minifyIdentifiers?: boolean;
		minifySyntax?: boolean;
		lineLimit?: number;
		charset?: import('esbuild').Charset;
		treeShaking?: boolean;
		ignoreAnnotations?: boolean;
		jsx?: 'transform' | 'preserve' | 'automatic';
		jsxFactory?: string;
		jsxFragment?: string;
		jsxImportSource?: string;
		jsxDev?: boolean;
		jsxSideEffects?: boolean;
		define?: {
			[key: string]: string;
		};
		pure?: string[];
		keepNames?: boolean;
		absPaths?: import('esbuild').AbsPaths[];
		color?: boolean;
		logLevel?: import('esbuild').LogLevel;
		logLimit?: number;
		logOverride?: Record<string, import('esbuild').LogLevel>;
		tsconfigRaw?: string | import('esbuild').TsconfigRaw;
	}>
>;
