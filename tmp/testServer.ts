import fs from 'fs';

import { createServer, ServerConfigurationExtension } from '../packages/server';

const configuration: ServerConfigurationExtension = {
	admins: [{ name: 'portrik' }],
	database: { type: 'sqlite', database: 'tmp/testDatabase.sqlite' },
	logging: { console: true },
	security: {
		certificate: {
			cert: fs.readFileSync(
				'/Users/patrik.dvoracek/Desktop/Gits/Work/TRPUX/tmp/cert/localhost.pem'
			),
			key: fs.readFileSync(
				'/Users/patrik.dvoracek/Desktop/Gits/Work/TRPUX/tmp/cert/localhost-key.pem'
			),
		},
	},
};

createServer(configuration);
