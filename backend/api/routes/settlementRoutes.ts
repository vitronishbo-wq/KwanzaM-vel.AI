/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Router } from 'express';
import { settlementController } from '../controllers/SettlementController';

const router = Router();

// BNA Custody and metrics
router.get('/settlement/custody', settlementController.getCustody);
router.post('/settlement/custody', settlementController.saveCustody);

// Regulator reconciliation operations
router.post('/settlement/reconcile', settlementController.reconcile);
router.get('/settlement/reconciliation-logs', settlementController.getReconciliationLogs);

export default router;
