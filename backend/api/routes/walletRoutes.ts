/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Router } from 'express';
import { walletController } from '../controllers/WalletController';

const router = Router();

// Wallet management and info
router.get('/wallets/:phone', walletController.getWallet);
router.post('/wallets', walletController.registerWallet);

// Operational transfers (Send/Receive)
router.post('/wallets/transfer', walletController.transfer);

// Operational payments (Pay)
router.post('/wallets/pay', walletController.pay);

// Query operations ledger
router.get('/ledger', walletController.getLedger);

// Query transactions history
router.get('/wallets/:phone/transactions', walletController.getTransactions);

export default router;
