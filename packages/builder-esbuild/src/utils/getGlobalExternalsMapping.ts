export const getGlobalExternalsMapping = (globalsMap: Record<string, string>) => {
	return Object.entries(globalsMap).reduce<Record<string, { varName: string; type: 'cjs' }>>(
		(acc, [moduleName, globalName]) => {
			acc[moduleName] = {
				varName: globalName,
				type: 'cjs',
			};
			return acc;
		},
		{},
	);
};
