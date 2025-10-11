import path from 'node:path';
import dedent from 'dedent';
import { loadPreviewOrConfigFile } from 'storybook/internal/common';
import type { Options } from 'storybook/internal/types';

import { listStories } from './listStories.js';

const isAnnotationObject = (value: unknown): value is { absolute: string } => {
	return typeof value === 'object' && value !== null && 'absolute' in value;
};

// Generate main entry point
export const generateAppEntryCode = async (options: Options): Promise<string> => {
	const { presets, configDir } = options;

	const stories = await listStories(options);

	// Get preview annotations (.storybook/preview.ts + addons)
	const previewAnnotations = await presets.apply<string[]>('previewAnnotations', [], options);

	const previewFile = loadPreviewOrConfigFile({ configDir });
	if (previewFile) {
		previewAnnotations.push(previewFile);
	}

	const annotationImports = previewAnnotations
		.map((annotation, index) => {
			const path = isAnnotationObject(annotation) ? annotation.absolute : annotation;

			return `import * as previewAnnotation${index} from '${path}';`;
		})
		.join('\n');

	const configs = previewAnnotations.map((_, index) => `previewAnnotation${index}`).join(', ');

	const storiesImports = stories
		.map((story) => {
			const relative = path.relative(process.cwd(), story);
			const key = story.startsWith('./') ? relative : `./${relative}`;

			// Get CSS file path by replacing story extension with .css
			const cssPath = key.replace(/\.[jt]sx?$/, '.css');

			return `'${key}': () => {
				const cssUrl = new URL('${cssPath}', import.meta.url);

				if (!document.querySelector('link[data-path="${cssPath}"]')) {
					const link = document.createElement('link');
					link.rel = 'stylesheet';
					link.href = cssUrl.href;
					link.setAttribute('data-path', '${cssPath}');
					document.head.appendChild(link);
				}

				return import('${story}');
			}`;
		})
		.join(',\n    ');

	return dedent`
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
		${annotationImports}

		// Compose configs
		const getProjectAnnotations = () => {
		  return composeConfigs([${configs}]);
		};

		window.__STORYBOOK_IMPORT_FN__ = (function() {
		  const importers = {
		    ${storiesImports}
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
