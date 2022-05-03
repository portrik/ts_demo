import path from 'path';

import { ServerConfigurationExtension } from '../../src/config';

export const testConfiguration: ServerConfigurationExtension = {
	logging: {
		console: false,
		level: 'silent',
	},
	database: {
		type: 'sqlite',
		database: ':memory:',
		synchronize: true,
		entities: [
			path.join(
				path.dirname(path.dirname(__dirname)),
				'src',
				'model',
				'*.entity.ts'
			),
		],
	},
};
