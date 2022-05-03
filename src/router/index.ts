import { Router } from 'express';

import { router as ServerController } from './Server.router';
import { router as SourceController } from './Source.router';

export const routers: Router[] = [ServerController, SourceController];
