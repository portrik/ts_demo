import express, { Router, urlencoded, json } from 'express';
import compression from 'compression';

/**
 * Creates testable application with the selected router.
 *
 * @param router    Router to test
 *
 * @returns         Express application to be tested with the router
 */
export function createApp(router: Router): express.Application {
	const app = express();
	app.use(urlencoded({ extended: true }));
	app.use(json());
	app.use(compression());
	app.use(router);

	return app;
}
