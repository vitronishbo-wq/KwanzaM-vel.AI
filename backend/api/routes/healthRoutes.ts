/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Router } from 'express';
import { healthController } from '../controllers/HealthController';

const router = Router();

router.get('/live', healthController.live);
router.get('/ready', healthController.ready);
router.get('/health', healthController.health);
router.get('/health/readiness', healthController.readiness);
router.get('/readiness', healthController.readiness);

export default router;
