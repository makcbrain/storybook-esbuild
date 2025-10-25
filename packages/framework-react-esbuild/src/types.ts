import type { BuilderOptions, StorybookConfigEsbuild } from '@makcbrain/storybook-builder-esbuild';
import type {
	CompatibleString,
	StorybookConfig as StorybookConfigBase,
} from 'storybook/internal/types';

type FrameworkName = CompatibleString<'@makcbrain/storybook-framework-react-esbuild'>;

export type FrameworkOptions = {
	builder?: BuilderOptions;
	/**
	 * Enables <StrictMode> for React.
	 */
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
};

/** The interface for Storybook configuration in `main.ts` files. */
export type StorybookConfig = Omit<
	StorybookConfigBase,
	keyof StorybookConfigEsbuild | keyof StorybookConfigFramework
> &
	StorybookConfigEsbuild &
	StorybookConfigFramework;
