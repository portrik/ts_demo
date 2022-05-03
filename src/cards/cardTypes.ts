import { Source } from '../model';

export interface Base<T> {
	type: string;
	source: Source;
	data: T;
}

export interface CardTypeMap {
	'Line Graph': LineGraph;
	'Iframe': IFrame;
	'Matrix': Matrix;
	'Single Value': SingleValue;
}

export type LineGraph = {
	labels: string[];
	data: number[];
};

export enum MatrixResult {
	SUCCESS = 'SUCCESS',
	WARNING = 'WARNING',
	FAILURE = 'FAILURE',
	RUNNING = 'RUNNING',
	NOTRUN = 'NOTRUN',
	UNKNOWN = 'UNKNOWN',
}

export type Matrix = {
	columns: string[];
	rows: string[];
	values: {
		[key: string]: {
			[key: string]: {
				result: MatrixResult;
				url?: string;
			};
		};
	};
};

export type IFrame = {
	url: string;
};

export type SingleValue = {
	name: string;
	value: any;
};
