import dedent from 'dedent';
import type { Options } from 'storybook/internal/types';

export const generateIframeHtml = async (
	options: Options,
	esbuildServerUrl: string,
): Promise<string> => {
	const { configType, presets } = options;

	const [headHtmlSnippet, bodyHtmlSnippet] = await Promise.all([
		presets.apply<string | undefined>('previewHead'),
		presets.apply<string | undefined>('previewBody'),
	]);

	return dedent`
		<!DOCTYPE html>
		<html lang="en">
		<head>
		  <meta charset="utf-8" />
		  <title>Storybook</title>
		  <meta name="viewport" content="width=device-width, initial-scale=1" />

		  <script>
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

		  <!-- Setup Module - must be loaded first -->
		  <script type="module" src="${esbuildServerUrl}/virtualSetup.js"></script>
		  <!-- Main Entry Point -->
		  <script type="module" src="${esbuildServerUrl}/virtualApp.js"></script>
		  <!-- Live Reload (Development Only) -->
		  <script>
		    if (${configType === 'DEVELOPMENT'}) {
              setTimeout(() => {
                // Timeout to skip first event to prevent reloading at the beginning
                new EventSource('${esbuildServerUrl}/esbuild').addEventListener('change', () => {
                  console.log('[ESBuild Builder] File changed, reloading...');
                  location.reload();
                });
              }, 1000);
		    }
		  </script>
		</body>
		</html>
	`;
};
