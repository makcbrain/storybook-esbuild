import dedent from 'dedent';
import type { Plugin } from 'esbuild';
import { loadPreviewOrConfigFile } from 'storybook/internal/common';
import type { Options } from 'storybook/internal/types';

export function virtualModulesPlugin(options: Options): Plugin {
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
}

// Generate main entry point
async function generateAppEntryCode(options: Options): Promise<string> {
	const { presets, configDir } = options;

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

	return dedent`
		import { composeConfigs, PreviewWeb } from 'storybook/preview-api';

		// Import preview annotations
		${imports}

		// Compose configs
		const getProjectAnnotations = () => {
		  return composeConfigs([${configs}]);
		};

		// Initialize PreviewWeb with importFn from window
		// (importFn is defined in iframe.html)
		window.__STORYBOOK_PREVIEW__ = window.__STORYBOOK_PREVIEW__ || new PreviewWeb(
		  window.__STORYBOOK_IMPORT_FN__,
		  getProjectAnnotations
		);

		window.__STORYBOOK_STORY_STORE__ = window.__STORYBOOK_STORY_STORE__ || window.__STORYBOOK_PREVIEW__.storyStore;
	`;
}
