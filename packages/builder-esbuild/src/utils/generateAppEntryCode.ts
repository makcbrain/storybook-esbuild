import path from 'node:path';
import dedent from 'dedent';
import { loadPreviewOrConfigFile } from 'storybook/internal/common';
import type { Options } from 'storybook/internal/types';

import { listStories } from './listStories.js';

const isAnnotationObject = (value: unknown): value is { absolute: string } => {
	return typeof value === 'object' && value !== null && 'absolute' in value;
};

/**
 * Generate main entry point
 */
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

	const storyCSSEntries = stories
		.map((story) => {
			const relative = path.relative(process.cwd(), story);
			const key = story.startsWith('./') ? relative : `./${relative}`;
			const cssPath = key.replace(/\.([jt]sx?|mdx)$/, '.css');

			return `'${key}': new URL('${cssPath}', import.meta.url).href`;
		})
		.join(',\n        ');

	const storiesImports = stories
		.map((story) => {
			const relative = path.relative(process.cwd(), story);
			const key = story.startsWith('./') ? relative : `./${relative}`;
			const jsOutputPath = key.replace(/\.([jt]sx?|mdx)$/, '.js');

			return `'${key}': () => {
				// Use a variable so esbuild can't statically resolve this import.
				// This prevents story CSS from being pulled into virtualApp.css.
				const storyOutputPath = '${jsOutputPath}';
				return import(storyOutputPath);
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

		const __storyCSSMap = {
		    ${storyCSSEntries}
		};
		let __activeStoryCSSKey = null;

		function __findCSSUrl(importPath) {
		    var url = __storyCSSMap[importPath];
		    if (url) return url;
		    var alt = importPath.startsWith('./') ? importPath.slice(2) : './' + importPath;
		    return __storyCSSMap[alt] || null;
		}

		function __loadStoryCSS(importPath) {
		    if (__activeStoryCSSKey === importPath) return;
		    document.querySelectorAll('link[data-story-css]').forEach(function(el) { el.remove(); });
		    var cssUrl = __findCSSUrl(importPath);
		    if (cssUrl) {
		        var link = document.createElement('link');
		        link.rel = 'stylesheet';
		        link.href = cssUrl;
		        link.setAttribute('data-story-css', importPath);
		        document.head.appendChild(link);
		    }
		    __activeStoryCSSKey = importPath;
		}

		function __getImportPathForStory(storyId) {
		    var store = window.__STORYBOOK_STORY_STORE__
		        || (window.__STORYBOOK_PREVIEW__ && window.__STORYBOOK_PREVIEW__.storyStore);
		    if (!store) return null;

		    try {
		        var idx = store.storyIndex || store._storyIndex;
		        if (idx) {
		            var entries = idx.entries || idx._entries;
		            if (entries && entries[storyId]) return entries[storyId].importPath;
		        }
		    } catch(e) {}

		    try {
		        if (store.fromId) {
		            var entry = store.fromId(storyId);
		            if (entry && entry.importPath) return entry.importPath;
		        }
		    } catch(e) {}

		    try {
		        if (store.raw) {
		            var all = store.raw();
		            for (var i = 0; i < all.length; i++) {
		                if (all[i].id === storyId) return all[i].importPath;
		            }
		        }
		    } catch(e) {}

		    return null;
		}

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

		function __resolveAndLoadCSS(storyId) {
		    if (!storyId) return;
		    var importPath = __getImportPathForStory(storyId);
		    if (importPath) {
		        __loadStoryCSS(importPath);
		    }
		}

		channel.on('storyChanged', function(storyId) {
		    __resolveAndLoadCSS(storyId);
		});

		channel.on('storyRendered', function(storyId) {
		    __resolveAndLoadCSS(storyId);
		    if (!storyId) {
		        var preview = window.__STORYBOOK_PREVIEW__;
		        var sid = null;
		        try { sid = preview.currentSelection.storyId; } catch(e) {}
		        if (!sid) try { sid = preview.selectionStore.selection.storyId; } catch(e) {}
		        __resolveAndLoadCSS(sid);
		    }
		});
	`;
};
