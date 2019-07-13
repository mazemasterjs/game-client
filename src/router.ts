import * as routes from './routes';
import express from 'express';

export const router = express.Router();

// map the live/ready probes
router.get('/probes/live', routes.livenessProbe);
router.get('/probes/ready', routes.readinessProbe);

// all other content
router.get('/*', routes.serveFile);
