export interface Options {
	singles?: SingleValue[];
	timespans?: TimeSpan[];
	multichoices?: MultiChoice[];
}

export interface Base {
	name: string;
	label: string;
	description: string;
}

export interface SingleValue extends Base {}

export interface TimeSpan extends Base {
	maxUnit: 'm' | 'h' | 'd';
}

export interface MultiChoice extends Base {
	options: string[];
}
