import { readFile } from 'node:fs/promises';
import type { Plugin } from 'esbuild';
import type { Documentation } from 'react-docgen';
import {
	builtinHandlers as docGenHandlers,
	builtinResolvers as docGenResolver,
	ERROR_CODES,
	parse,
} from 'react-docgen';

import { actualNameHandler } from '../utils/actualNameHandler.js';
import { getLoaderByFilePath } from '../utils/getLoaderByFilePath.js';

type DocObj = Documentation & { actualName: string; definedInFile: string };

const defaultHandlers = Object.values(docGenHandlers).map((handler) => handler);
const defaultResolver = new docGenResolver.FindExportedDefinitionsResolver();
const handlers = [...defaultHandlers, actualNameHandler];

/**
 * Plugin for generating React component documentation for @storybook/addon-docs
 * Uses react-docgen which supports both JavaScript and TypeScript
 */
export const reactDocGenPlugin = (): Plugin => {
	return {
		name: 'react-doc-gen',

		setup(build) {
			build.onLoad({ filter: /\.(mjs|jsx?|tsx?)$/, namespace: '' }, async (args) => {
				if (args.path.includes('node_modules') || args.path.includes('.stories.')) {
					return null;
				}

				try {
					let fileContent = await readFile(args.path, 'utf-8');

					const docGenResults = parse(fileContent, {
						resolver: defaultResolver,
						handlers,
						filename: args.path,
					}) as DocObj[];

					if (docGenResults.length === 0) {
						return null;
					}

					// Inject __docgenInfo for each component
					for (const info of docGenResults) {
						const { actualName, definedInFile, ...docGenInfo } = info;
						// Only inject if component is defined in this file and has a name
						if (actualName && definedInFile === args.path) {
							const docGenJson = JSON.stringify(docGenInfo);

							fileContent = addDocGenInfo(fileContent, actualName, docGenJson);
						}
					}

					return {
						contents: fileContent,
						loader: getLoaderByFilePath(args.path),
					};
				} catch (error: unknown) {
					if (
						typeof error === 'object' &&
						error !== null &&
						'code' in error &&
						error.code !== ERROR_CODES.MISSING_DEFINITION
					) {
						console.warn('Error parsing documentation:', error);
					}

					return null;
				}
			});
		},
	};
};

function addDocGenInfo(fileContent: string, actualName: string, docGenJson: string): string {
	fileContent += `
try {
    ${actualName}.__docgenInfo=${docGenJson}
} catch (error) {
    console.warn('Error setting __docgenInfo:', error)
};`;

	return fileContent;
}
