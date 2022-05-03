import { DataSource, DataSourceOptions } from 'typeorm';

import { CardTypeMap } from '../../src/cards';

import { ServerConfiguration } from '../../src/config/Configuration';
import { getConfiguration } from '../../src/config';

// Test Utils
import {
	populateTestDatabase,
	TestParser,
	testConfiguration,
} from '../testUtil';

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

// Tested module
import { getSourceService } from '../../src/service/Source.service';
import { CardType, Server, Source, SourceType } from '../../src/model';

let connection: DataSource;

describe('Source Service', () => {
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

	describe('getCard', () => {
		beforeEach(async () => {
			await populateTestDatabase();
		});

		test.each([
			{
				cardType: 'Line Graph',
				expected: [
					{
						labels: ['foo', 'bar', 'boo', 'far'],
						data: [1, 2, 3, 4],
					},
				],
			},
			{
				cardType: 'Iframe',
				expected: [
					{
						url: 'https://test.url/source/api.json',
					},
				],
			},
			{
				cardType: 'Matrix',
				expected: [
					{
						columns: ['foo', 'bar'],
						rows: ['boo', 'far'],
						values: {
							foo: {
								boo: {
									result: 'NOTBUILT',
								},
								far: {
									result: 'SUCCESS',
									url: 'https://test.url/0/success',
								},
							},
							bar: {
								boo: {
									result: 'FAILURE',
									url: 'https://test.url/0/failure',
								},
								far: {
									result: 'LOADING',
								},
							},
						},
					},
				],
			},
			{
				cardType: 'Single Value',
				expected: [
					{
						name: 'SingleValue',
						value: 'SUCCESS',
					},
				],
			},
		])(
			'Should Return Valid Data for Type $cardType with Single Source',
			async ({ cardType, expected }) => {
				let testedType = await CardType.findOne({ where: { name: cardType } });

				if (!testedType) {
					testedType = new CardType();
					testedType.name = cardType;
					await testedType.save();
				}

				const sources = [
					await Source.findOne({
						where: { id: 1 },
					}),
				] as Source[];

				const service = getSourceService();
				const result = await service.getSourceData(
					sources,
					cardType as keyof CardTypeMap
				);

				expect(result).toEqual(expected);
			}
		);

		test('Should Throw on Unsupported Source Type', async () => {
			const testType = new SourceType();
			testType.name = 'test';
			await testType.save();

			const testSource = new Source();
			testSource.name = 'Test Source';
			testSource.address = 'https://test.test/source/';
			testSource.type = testType;
			testSource.server = (await Server.findOne({
				where: { id: 1 },
			})) as Server;
			await testSource.save();

			const sources = [testSource];

			const service = getSourceService();
			await expect(async () =>
				service.getSourceData(sources, testType.name as keyof CardTypeMap)
			).rejects.toThrow('Source type "test" is not supported for card "test"!');
		});
	});

	describe('refreshSource', () => {
		beforeEach(async () => {
			await populateTestDatabase();
		});

		test('Should Refresh Sources', async () => {
			const fakeServer = new Server();
			fakeServer.name = 'Fake Server';
			fakeServer.url = 'https://fake.test/';
			fakeServer.type = 'fake';
			await fakeServer.save();

			const previousSources = await Source.find();

			const service = getSourceService();
			await service.refreshSource();
			const result = await Source.find();
			const newSource = await Source.findOne({
				where: { name: 'Jenkins New' },
			});
			const fakeServerSources = await Source.find({
				where: { server: { id: fakeServer.id } },
			});

			expect(result).toEqual(expect.arrayContaining(previousSources));
			expect(result).toContainEqual(newSource);
			expect(fakeServerSources).toHaveLength(0);
		});
	});

	describe('getOptions', () => {
		beforeEach(async () => {
			await populateTestDatabase();
		});

		test('Should Return Card Options', async () => {
			const source = (await Source.findOne({ where: { id: 1 } })) as Source;

			const service = getSourceService();
			const result = await service.getOptions(source);

			expect(result.singles).toEqual([
				{
					name: 'singleValue',
					label: 'Test List',
					description: `Test List for ${source.name}`,
				},
			]);
			expect(result.timespans).toEqual([
				{
					name: 'testSpan',
					label: 'Test Span',
					description: `Test Span for ${source.name}`,
					maxUnit: 'd',
				},
			]);
			expect(result.multichoices).toEqual([
				{
					name: 'testMulti',
					label: 'Test Multichoice',
					description: `Test Multichoice for ${source.name}`,
					options: ['boo', 'far'],
				},
			]);
		});

		test('Should Throw on Unsupported Source Type', async () => {
			const testType = new SourceType();
			testType.name = 'test';
			await testType.save();

			const testSource = new Source();
			testSource.name = 'Test Source';
			testSource.address = 'https://test.test/source/';
			testSource.type = testType;
			testSource.server = (await Server.findOne({
				where: { id: 1 },
			})) as Server;
			await testSource.save();

			const service = getSourceService();

			await expect(async () => {
				await service.getOptions(testSource);
			}).rejects.toThrow('Source type "test" is not supported!');
		});
	});
});
