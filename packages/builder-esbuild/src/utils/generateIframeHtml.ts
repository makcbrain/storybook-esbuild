import dedent from 'dedent';
import { normalizeStories } from 'storybook/internal/common';
import type { Options } from 'storybook/internal/types';

export const generateIframeHtml = async (
	options: Options,
	esbuildServerUrl: string,
): Promise<string> => {
	const { configType, features, presets } = options;

	// Get all required configuration from presets
	const [
		frameworkOptions,
		headHtmlSnippet,
		bodyHtmlSnippet,
		logLevel,
		docsOptions,
		tagsOptions,
		coreOptions,
		build,
	] = await Promise.all([
		presets.apply<Record<string, unknown> | null>('frameworkOptions'),
		presets.apply<string | undefined>('previewHead'),
		presets.apply<string | undefined>('previewBody'),
		presets.apply('logLevel', undefined),
		presets.apply('docs'),
		presets.apply('tags'),
		presets.apply('core'),
		presets.apply('build'),
	]);

	// Normalize stories with importPathMatcher
	const normalizedStories = normalizeStories(await options.presets.apply('stories', [], options), {
		configDir: options.configDir,
		workingDir: process.cwd(),
	}).map((specifier) => ({
		...specifier,
		importPathMatcher: specifier.importPathMatcher.source,
	}));

	// Prepare other globals (e.g., for test blocks)
	const otherGlobals = {
		...(build?.test?.disableBlocks ? { __STORYBOOK_BLOCKS_EMPTY_MODULE__: {} } : {}),
	};

	// Generate OTHER_GLOBALS code
	const otherGlobalsCode = Object.entries(otherGlobals)
		.map(([k, v]) => `window["${k}"] = ${JSON.stringify(v)};`)
		.join('\n    ');

	return dedent`
		<!DOCTYPE html>
		<html lang="en">
		<head>
		  <meta charset="utf-8" />
		  <title>Storybook</title>
		  <meta name="viewport" content="width=device-width, initial-scale=1" />

		  <!-- Global Config (pass to window) -->
		  <script>
		    window.CONFIG_TYPE = '${configType || ''}';
		    window.LOGLEVEL = '${logLevel || ''}';
		    window.FRAMEWORK_OPTIONS = ${JSON.stringify(frameworkOptions)};
		    window.CHANNEL_OPTIONS = ${JSON.stringify(coreOptions?.channelOptions || {})};
		    window.FEATURES = ${JSON.stringify(features || {})};
		    window.STORIES = ${JSON.stringify(normalizedStories || {})};
		    window.DOCS_OPTIONS = ${JSON.stringify(docsOptions || {})};
		    window.TAGS_OPTIONS = ${JSON.stringify(tagsOptions || {})};

		    ${otherGlobalsCode || ''}

		    // Compatibility
		    window.module = undefined;
		    window.global = window;
		  </script>
		  ${headHtmlSnippet || ''}
		</head>
		<body>
		  ${bodyHtmlSnippet || ''}
		  <div id="storybook-root"></div>
		  <div id="storybook-docs"></div>

		  <!-- Main Entry Point -->
		  <script type="module" src="${esbuildServerUrl}/virtualApp.js"></script>
		</body>
		</html>
	`;
};
