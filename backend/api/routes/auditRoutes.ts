/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Router } from 'express';
import { auditController } from '../controllers/AuditController';

const router = Router();

// Cold archive audit logs
router.get('/audit-trail', auditController.getLogs);

export default router;
