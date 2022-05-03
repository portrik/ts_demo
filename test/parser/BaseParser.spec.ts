import { CardTypeMap, Options } from '../../src/cards';

import { Server, ServerArgument, Source } from '../../src/model';
import {
	isParser,
	Parser,
	registeredParsers,
	BaseParser,
} from '../../src/parser';

import { TestParser } from '../testUtil';

describe('Parser: BaseParser', () => {
	describe('isParser', () => {
		test('Should Be True on Testing a Proper Parser', () => {
			const parser = new TestParser();

			expect(isParser(parser)).toBeTruthy();
		});

		test.each([undefined, 24601, '24601', { getAll: () => false }])(
			'Should Be False on Testing Non-Parser',
			(tested) => {
				expect(isParser(tested)).toBeFalsy();
			}
		);
	});

	describe('Parser', () => {
		test('Should Register Valid Parser', () => {
			@Parser()
			class HollowParser implements BaseParser {
				supportedServers = [];
				supportedSources = [];
				supportedCards = [];
				supportedTypesMap = [];

				async getAll(
					server: Server,
					args: ServerArgument[]
				): Promise<Source[]> {
					return [];
				}

				async getSource<T extends keyof CardTypeMap>(
					type: T,
					source: Source
				): Promise<CardTypeMap[T]> {
					return {} as CardTypeMap[T];
				}

				async getOptions(source: Source): Promise<Options.Options> {
					return {};
				}
			}

			expect(registeredParsers).toHaveLength(1);
			expect(registeredParsers).toEqual(
				expect.arrayContaining([new HollowParser()])
			);

			for (let i = 0; i < registeredParsers.length; ++i) {
				registeredParsers.pop();
			}
		});

		test('Should Not Register Invalid Parser', () => {
			@Parser()
			class InvalidParser {
				randomValue: number;
			}

			expect(registeredParsers).toHaveLength(0);

			for (let i = 0; i < registeredParsers.length; ++i) {
				registeredParsers.pop();
			}
		});
	});
});
