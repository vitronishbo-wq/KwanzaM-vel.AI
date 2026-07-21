/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Router } from 'express';
import healthRoutes from './healthRoutes';
import chatRoutes from './chatRoutes';
import walletRoutes from './walletRoutes';
import settlementRoutes from './settlementRoutes';
import auditRoutes from './auditRoutes';
import ledgerRoutes from './ledgerRoutes';

const router = Router();

// Mount Health Endpoints under /api
router.use('/', healthRoutes);

// Mount Chat/FAQ Endpoints under /api
router.use('/', chatRoutes);

// Mount Wallet Endpoints under /api
router.use('/', walletRoutes);

// Mount Settlement & BNA Regulation Endpoints under /api
router.use('/', settlementRoutes);

// Mount Cold Archive Audit Endpoints under /api
router.use('/', auditRoutes);

// Mount Ledger Endpoints under /api
router.use('/', ledgerRoutes);

export default router;
