// Express dependencies
import { DataSourceOptions, DataSource } from 'typeorm';
import request from 'supertest';

// Testing utilities
import {
	TestParser,
	createApp,
	testConfiguration,
	populateTestDatabase,
} from '../testUtil';
// Definitions
import { Server } from '../../src/model';
import { ServerConfiguration } from '../../src/config/Configuration';
import { getConfiguration } from '../../src/config';

// Mocking available parsers
jest.mock('../../src/parser', () => ({
	_esModule: true,
	registeredParsers: [new TestParser()],
}));
const config = new ServerConfiguration(testConfiguration);
// Mocking server configuration
jest.mock('../../src/config', () => ({
	_esModule: true,
	getConfiguration: () => config,
}));

import { router } from '../../src/router/Server.router';

let connection: DataSource;

describe('Server Router', () => {
	beforeAll(async () => {
		const config = getConfiguration();

		if (!config) {
			throw new Error('Could not load test configuration!');
		}

		connection = new DataSource(config.getDatabaseConfiguration());
		await connection.initialize();
	});

	afterAll(async () => {
		await connection.destroy();
	});

	describe('GET /server', () => {
		beforeEach(async () => {
			await populateTestDatabase();
		});

		test('Should Retrieve the List of Servers', async () => {
			const app = createApp(router);

			const response = await request(app).get('/server');

			expect(response.status).toBe(200);
			expect(response.body).toEqual(await Server.find());
		});
	});

	describe('POST /server', () => {
		beforeEach(async () => {
			await populateTestDatabase();
		});

		test('Should Create Valid Server', async () => {
			const app = createApp(router);

			const response = await request(app)
				.post('/server')
				.type('json')
				.query({ authorize: true })
				.send({
					name: 'New Server',
					url: 'https://jenkins.example/api',
					type: 'jenkins',
					disabled: false,
					arguments: [{ key: 'custom', value: 'argument' }],
				});

			expect(response.status).toBe(200);
			expect(response.body).toEqual(
				await Server.findOne({ where: { name: 'New Server' } })
			);
			expect(response.body.arguments).toHaveLength(1);
		});

		test.each([
			{
				name: '',
				url: 'https://jenkins.example/api',
				type: 'test',
				error: 'Server name cannot be empty!',
			},
			{
				name: 'Test',
				url: 'https://jenkins.example/api',
				type: null,
				error: 'Server type cannot be empty!',
			},
			{
				name: 'Test',
				url: '      ',
				type: 'test',
				error: 'Invalid URL',
			},
		])(
			'Should Not Create Invalid Server',
			async ({ name, type, url, error }) => {
				const app = createApp(router);
				const servers = await Server.find();

				const response = await request(app)
					.post('/server')
					.type('json')
					.query({ authorize: true })
					.send({
						name: name,
						url: url,
						type: type,
						disabled: false,
						arguments: { arg: 'custom', anotherArg: 'another' },
					});
				const newServers = await Server.find();

				expect(response.status).toBe(500);
				expect(response.text).toEqual(error);
				expect(newServers).toEqual(servers);
			}
		);
	});

	describe('PUT /server/:id', () => {
		beforeEach(async () => {
			await populateTestDatabase();
		});

		test('Should Update Valid Server', async () => {
			const app = createApp(router);

			const response = await request(app)
				.put('/server/1')
				.type('json')
				.query({ authorize: true })
				.send({
					name: 'New Test Name',
					url: 'https://new.example.com/api/',
					type: 'new-type',
					disabled: true,
					arguments: { test: 'argument' },
				});

			expect(response.status).toBe(200);
			expect(response.body).toEqual(await Server.findOne({ where: { id: 1 } }));
			expect(response.body.name).toBe('New Test Name');
			expect(response.body.arguments).toHaveLength(1);
		});

		test('Should Not Update Non-Existent Server', async () => {
			const app = createApp(router);
			const servers = await Server.find();

			const response = await request(app)
				.put('/server/24601')
				.type('json')
				.query({ authorize: true })
				.send({
					name: 'New Test Name',
					url: 'https://new.example.com/api/',
					type: 'new-type',
					disabled: true,
					arguments: { test: 'argument' },
				});
			const newServers = await Server.find();

			expect(response.status).toBe(500);
			expect(response.text).toEqual('Server with the ID 24601 does not exist!');
			expect(newServers).toEqual(servers);
		});

		test.each([
			{
				name: '',
				url: 'https://jenkins.example/api',
				type: 'test',
				error: 'Server name cannot be empty!',
			},
			{
				name: 'Test',
				url: 'https://jenkins.example/api',
				type: null,
				error: 'Server type cannot be empty!',
			},
			{
				name: 'Test',
				url: '      ',
				type: 'test',
				error: 'Invalid URL',
			},
		])(
			'Should Not Update Invalid Server',
			async ({ name, type, url, error }) => {
				const app = createApp(router);
				const servers = await Server.find();

				const response = await request(app)
					.put('/server/1')
					.type('json')
					.query({ authorize: true })
					.send({
						name: name,
						url: url,
						type: type,
						disabled: false,
						arguments: { arg: 'custom', anotherArg: 'another' },
					});
				const newServers = await Server.find();

				expect(response.status).toBe(500);
				expect(response.text).toEqual(error);
				expect(newServers).toEqual(servers);
			}
		);
	});

	describe('DELETE /server/:id', () => {
		beforeEach(async () => {
			await populateTestDatabase();
		});

		test('Should Delete Server', async () => {
			const app = createApp(router);
			const servers = await Server.find();

			const response = await request(app)
				.delete('/server/1')
				.query({ authorize: true });
			const newServers = await Server.find();
			const deleted = await Server.findOne({ where: { id: 1 } });

			expect(response.status).toBe(200);
			expect(newServers).toHaveLength(servers.length - 1);
			expect(deleted).toBeNull();
		});

		test('Should Do Nothing on Deletion of Non-Existent Server', async () => {
			const app = createApp(router);
			const servers = await Server.find();

			const response = await request(app)
				.delete('/server/24601')
				.query({ authorize: true });
			const newServers = await Server.find();

			expect(response.status).toBe(500);
			expect(response.text).toBe('Server with the ID 24601 does not exist!');
			expect(newServers).toEqual(servers);
		});
	});
});
