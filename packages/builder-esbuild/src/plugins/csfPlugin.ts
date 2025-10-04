import type { Plugin } from 'esbuild';

/**
 * Plugin for processing .stories files
 * - Adds export order metadata
 * - Processes CSF format
 */
export function csfPlugin(): Plugin {
	return {
		name: 'storybook-csf',

		setup(build) {
			// Process all .stories.(ts|tsx|js|jsx) files
			build.onLoad({ filter: /\.stories\.(tsx?|jsx?)$/ }, async (args) => {
				const fs = await import('node:fs/promises');
				const contents = await fs.readFile(args.path, 'utf-8');

				// TODO: Add CSF processing here
				// For example, via @storybook/csf-tools

				// Add export order for proper display
				const withExportOrder = injectExportOrder(contents);

				return {
					contents: withExportOrder,
					loader: getLoaderForFile(args.path),
				};
			});
		},
	};
}

function injectExportOrder(code: string): string {
	// Parse exports and add __namedExportsOrder
	// This is needed for proper story ordering

	// Simple implementation (can be enhanced with AST parser)
	const exports = [...code.matchAll(/export\s+(const|let|var|function)\s+(\w+)/g)]
		.map((match) => match[2])
		.filter((name) => name !== 'default');

	if (exports.length === 0) {
		return code;
	}

	return `
${code}

// Auto-injected by @storybook/builder-esbuild
export const __namedExportsOrder = ${JSON.stringify(exports)};
  `.trim();
}

function getLoaderForFile(path: string): 'ts' | 'tsx' | 'js' | 'jsx' {
	if (path.endsWith('.tsx')) {
		return 'tsx';
	}
	if (path.endsWith('.ts')) {
		return 'ts';
	}
	if (path.endsWith('.jsx')) {
		return 'jsx';
	}
	return 'js';
}
