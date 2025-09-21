import type docgenTypescript from '@joshwooding/vite-plugin-react-docgen-typescript';
import type { BuilderOptions, StorybookConfigEsbuild } from '@makcbrain/storybook-builder-esbuild';
import type {
	CompatibleString,
	StorybookConfig as StorybookConfigBase,
	TypescriptOptions as TypescriptOptionsBase,
} from 'storybook/internal/types';
type FrameworkName = CompatibleString<'@makcbrain/storybook-framework-react-esbuild'>;
type BuilderName = CompatibleString<'@makcbrain/storybook-builder-esbuild'>;
export type FrameworkOptions = {
	builder?: BuilderOptions;
	strictMode?: boolean;
	/**
	 * Use React's legacy root API to mount components
	 *
	 * React has introduced a new root API with React 18.x to enable a whole set of new features (e.g.
	 * concurrent features) If this flag is true, the legacy Root API is used to mount components to
	 * make it easier to migrate step by step to React 18.
	 *
	 * @default false
	 */
	legacyRootApi?: boolean;
};
type StorybookConfigFramework = {
	framework:
		| FrameworkName
		| {
				name: FrameworkName;
				options: FrameworkOptions;
		  };
	core?: StorybookConfigBase['core'] & {
		builder?:
			| BuilderName
			| {
					name: BuilderName;
					options: BuilderOptions;
			  };
	};
};
type TypescriptOptions = TypescriptOptionsBase & {
	/**
	 * Sets the type of Docgen when working with React and TypeScript
	 *
	 * @default `'react-docgen'`
	 */
	reactDocgen: 'react-docgen-typescript' | 'react-docgen' | false;
	/** Configures `@joshwooding/vite-plugin-react-docgen-typescript` */
	reactDocgenTypescriptOptions: Parameters<typeof docgenTypescript>[0];
};
/** The interface for Storybook configuration in `main.ts` files. */
export type StorybookConfig = Omit<
	StorybookConfigBase,
	keyof StorybookConfigEsbuild | keyof StorybookConfigFramework | 'typescript'
> &
	StorybookConfigEsbuild &
	StorybookConfigFramework & {
		typescript?: Partial<TypescriptOptions>;
	};
