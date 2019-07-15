"use strict";
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const routes = __importStar(require("./routes"));
const express_1 = __importDefault(require("express"));
exports.router = express_1.default.Router();
// team editor
exports.router.get('/admin/team-editor', routes.editTeams);
exports.router.get('/admin/user-editor', routes.editUsers);
// router.get('/admin/quickhash', routes.quickHash);
// map the live/ready probes
exports.router.get('/probes/live', routes.livenessProbe);
exports.router.get('/probes/ready', routes.readinessProbe);
// all other content
exports.router.get('/*', routes.serveFile);
//# sourceMappingURL=router.js.map