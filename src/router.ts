import * as routes from './routes';
import express from 'express';

export const router = express.Router();

// team editor
router.get('/admin/team-editor', routes.editTeams);
router.get('/admin/user-editor', routes.editUsers);
router.get('/admin/quickHash', routes.quickHash);

// map the live/ready probes
router.get('/probes/live', routes.livenessProbe);
router.get('/probes/ready', routes.readinessProbe);

// all other content
router.get('/*', routes.serveFile);
