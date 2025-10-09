import path from 'node:path';
import dedent from 'dedent';
import type { Plugin } from 'esbuild';
import { loadPreviewOrConfigFile } from 'storybook/internal/common';
import type { Options } from 'storybook/internal/types';

import { listStories } from '../utils/listStories.js';

export const virtualModulesPlugin = (options: Options): Plugin => {
	return {
		name: 'virtual-modules',

		setup(build) {
			// ===================================
			// virtualApp.js - main entry point
			// ===================================
			build.onResolve({ filter: /^virtualApp\.js$/ }, () => ({
				path: 'virtualApp.js',
				namespace: 'virtual',
			}));

			build.onLoad({ filter: /.*/, namespace: 'virtual' }, async (args) => {
				if (args.path === 'virtualApp.js') {
					const code = await generateAppEntryCode(options);
					return {
						contents: code,
						loader: 'js',
						resolveDir: options.configDir,
					};
				}

				return null;
			});
		},
	};
};

// Generate main entry point
const generateAppEntryCode = async (options: Options): Promise<string> => {
	const { presets, configDir } = options;

	const stories = await listStories(options);

	// Get preview annotations (.storybook/preview.ts + addons)
	const previewAnnotations = await presets.apply<string[]>('previewAnnotations', [], options);

	const previewFile = loadPreviewOrConfigFile({ configDir });
	if (previewFile) {
		previewAnnotations.push(previewFile);
	}

	// Generate imports
	const imports = previewAnnotations
		.map((annotation, index) => `import * as previewAnnotation${index} from '${annotation}';`)
		.join('\n');

	const configs = previewAnnotations.map((_, index) => `previewAnnotation${index}`).join(', ');

	// Generate importMap for stories
	const importMap = stories
		.map((story) => {
			const relative = path.relative(process.cwd(), story);
			const key = story.startsWith('./') ? relative : `./${relative}`;
			return `'${key}': () => import('${story}')`;
		})
		.join(',\n    ');

	return dedent`
	    import { setup } from 'storybook/internal/preview/runtime';

        setup();

        import { createBrowserChannel } from 'storybook/internal/channels';
        import { addons } from 'storybook/preview-api';

		const channel = createBrowserChannel({ page: 'preview' });
		addons.setChannel(channel);
		window.__STORYBOOK_ADDONS_CHANNEL__ = channel;

		if (window.CONFIG_TYPE === 'DEVELOPMENT') {
		  window.__STORYBOOK_SERVER_CHANNEL__ = channel;
		}

		import { composeConfigs, PreviewWeb } from 'storybook/preview-api';

		// Import preview annotations
		${imports}

		// Compose configs
		const getProjectAnnotations = () => {
		  return composeConfigs([${configs}]);
		};

		window.__STORYBOOK_IMPORT_FN__ = (function() {
		  const importers = {
		    ${importMap}
		  };

		  return async function importFn(path) {
		    const importer = importers[path];

		    if (!importer) {
		      throw new Error('Story not found: ' + path + '. Available stories: ' + Object.keys(importers).join(', '));
		    }

		    return await importer();
		  };
		})();

		// Initialize PreviewWeb
		window.__STORYBOOK_PREVIEW__ = window.__STORYBOOK_PREVIEW__ || new PreviewWeb(
		  window.__STORYBOOK_IMPORT_FN__,
		  getProjectAnnotations
		);

		window.__STORYBOOK_STORY_STORE__ = window.__STORYBOOK_STORY_STORE__ || window.__STORYBOOK_PREVIEW__.storyStore;
	`;
};
