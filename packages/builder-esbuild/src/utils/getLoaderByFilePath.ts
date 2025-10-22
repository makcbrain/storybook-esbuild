import type { Loader } from 'esbuild';

export const getLoaderByFilePath = (path: string): Loader | undefined => {
	switch (true) {
		case path.endsWith('.jsx'):
			return 'jsx';
		case path.endsWith('.js'):
		case path.endsWith('.mjs'):
			return 'js';
		case path.endsWith('.tsx'):
			return 'tsx';
		case path.endsWith('.ts'):
			return 'ts';
		default:
			return undefined;
	}
};
