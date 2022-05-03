// Express dependencies
import { DataSource, DataSourceOptions } from 'typeorm';
import request from 'supertest';

// Testing utilities
import {
	populateTestDatabase,
	createApp,
	TestParser,
	testConfiguration,
} from '../testUtil';

// Definitions
import { ServerConfiguration } from '../../src/config/Configuration';
import { getConfiguration } from '../../src/config';
import { Compatibility, Server, Source } from '../../src/model';

// Mocking available parsers
jest.mock('../../src/parser', () => ({
	_esModule: true,
	registeredParsers: [new TestParser()],
}));
// Mocking server configuration
jest.mock('../../src/config', () => ({
	_esModule: true,
	getConfiguration: () => new ServerConfiguration(testConfiguration),
}));

// Tested controller
import { router } from '../../src/router/Source.router';

let connection: DataSource;

describe('Source Controller', () => {
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

	describe('GET /source', () => {
		beforeEach(async () => {
			await populateTestDatabase();
		});

		test('Should Retrieve All Sources and Servers', async () => {
			const app = createApp(router);

			const response = await request(app).get('/source');

			expect(response.status).toBe(200);
			expect(response.body).toEqual({
				servers: [...(await Server.find())],
				sources: [...(await Source.find())],
				compatibilities: [...(await Compatibility.find())],
			});
		});
	});

	describe('GET /source/refresh', () => {
		beforeEach(async () => {
			await populateTestDatabase();
		});

		test('Should Refresh Sources', async () => {
			const fakeServer = new Server();
			fakeServer.name = 'Fake Server';
			fakeServer.url = 'https://fake.test/';
			fakeServer.type = 'fake';
			await fakeServer.save();

			const app = createApp(router);

			const response = await request(app)
				.get('/source/refresh')
				.query({ authorize: true });
			const fakeServerSources = await Source.find({
				where: { server: { id: fakeServer.id } },
			});

			expect(response.status).toBe(200);
			expect(response.body).toEqual({
				servers: await Server.find(),
				sources: await Source.find(),
			});
			expect(fakeServerSources).toHaveLength(0);
		});
	});

	describe('GET /source/:id/options', () => {
		beforeEach(async () => {
			await populateTestDatabase();
		});

		test('Should Return Source Options', async () => {
			const app = createApp(router);

			const response = await request(app).get('/source/1/options');

			expect(response.status).toBe(200);
			expect(response.body.singles).toEqual([
				{
					name: 'singleValue',
					label: 'Test List',
					description: 'Test List for Jenkins Makefile',
				},
			]);
			expect(response.body.timespans).toEqual([
				{
					name: 'testSpan',
					label: 'Test Span',
					description: 'Test Span for Jenkins Makefile',
					maxUnit: 'd',
				},
			]);
			expect(response.body.multichoices).toEqual([
				{
					name: 'testMulti',
					label: 'Test Multichoice',
					description: 'Test Multichoice for Jenkins Makefile',
					options: ['boo', 'far'],
				},
			]);
		});

		test('Should Throw on Invalid Source ID', async () => {
			const app = createApp(router);

			const response = await request(app).get('/source/24601/options');

			expect(response.status).toBe(500);
			expect(response.text).toBe('Source with the ID 24601 does not exist!');
		});
	});
});
