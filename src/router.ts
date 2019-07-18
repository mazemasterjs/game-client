import * as routes from './routes';
import express from 'express';

export const router = express.Router();

// team / user editors
router.get('/admin/team-editor', routes.editTeams);
router.get('/admin/user-editor', routes.editUsers);
router.get('/admin/quickHash', routes.quickHash);

// scoreboard
router.get('/scoreboard', routes.scoreboard);

// map the live/ready probes
router.get('/probes/live', routes.livenessProbe);
router.get('/probes/ready', routes.readinessProbe);

// all other content
router.get('/*', routes.serveFile);
