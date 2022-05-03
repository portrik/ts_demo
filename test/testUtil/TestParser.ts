import { CardTypeMap, Options } from '../../src/cards';
import { Server, Source, SourceType } from '../../src/model';
import { BaseParser } from '../../src/parser';

export class TestParser implements BaseParser {
	supportedServers = ['jenkins'];
	supportedSources = ['jenkins', 'jenkins-makefile', 'jenkins-matrix'];
	supportedCards = [
		{ name: 'Line Graph', aggregated: true },
		{ name: 'Iframe', aggregated: false },
		{ name: 'Matrix', aggregated: false },
	];
	supportedTypesMap = [
		{
			cardType: 'Line Graph',
			sourceTypes: ['jenkins', 'jenkins-matrix', 'jenkins-makefile'],
		},
		{ cardType: 'Iframe', sourceTypes: ['jenkins-makefile'] },
		{ cardType: 'Matrix', sourceTypes: ['jenkins-matrix', 'jenkins-makefile'] },
		{ cardType: 'Single Value', sourceTypes: ['jenkins-makefile'] },
	];

	async getAll(server: Server): Promise<Source[]> {
		const sourceData = [
			{
				name: 'Jenkins Makefile',
				address: 'https://jenkins.test/makefile/',
				type: 'jenkins-makefile',
			},
			{
				name: 'Jenkins Matrix',
				address: 'https://jenkins.test/matrix/',
				type: 'jenkins-matrix',
			},
			{
				name: 'Jenkins Makefile',
				address: 'https://jenkins.test/makefile/',
				type: 'jenkins-makefile',
			},
			{
				name: 'Jenkins New',
				address: 'https://jenkins.test/new/',
				type: 'jenkins',
			},
		];
		const types = await SourceType.find();

		return sourceData.map((data) => {
			const source = new Source();
			source.name = data.name;
			source.server = server;
			source.address = data.address;
			source.type = types.find((type) => type.name === data.type) as SourceType;

			return source;
		});
	}

	async getSource<T extends keyof CardTypeMap>(
		type: T
	): Promise<CardTypeMap[T]> {
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		let result: any;

		switch (type) {
			case 'Line Graph':
				result = {
					labels: ['foo', 'bar', 'boo', 'far'],
					data: [1, 2, 3, 4],
				};
				break;
			case 'Iframe':
				result = {
					url: 'https://test.url/source/api.json',
				};
				break;
			case 'Matrix':
				result = {
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
				};
				break;
			case 'Single Value':
				result = {
					name: 'SingleValue',
					value: 'SUCCESS',
				};
				break;
			default:
				throw new Error(`Unknown card type ${type}!`);
		}

		return result as CardTypeMap[T];
	}

	async getOptions(source: Source): Promise<Options.Options> {
		return {
			singles: [
				{
					name: 'singleValue',
					label: 'Test List',
					description: `Test List for ${source.name}`,
				},
			],
			timespans: [
				{
					name: 'testSpan',
					label: 'Test Span',
					description: `Test Span for ${source.name}`,
					maxUnit: 'd',
				},
			],
			multichoices: [
				{
					name: 'testMulti',
					label: 'Test Multichoice',
					description: `Test Multichoice for ${source.name}`,
					options: ['boo', 'far'],
				},
			],
		};
	}
}
