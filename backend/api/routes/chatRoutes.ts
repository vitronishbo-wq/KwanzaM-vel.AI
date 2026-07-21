/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Router } from 'express';
import { chatController } from '../controllers/ChatController';
import { validateRequestBody, rateLimiterMiddleware, inputSanitizationMiddleware } from '../middlewares/security';
import { auditMiddleware } from '../middlewares/audit';

const router = Router();

// Endpoint for complete advisory console chat
router.post(
  '/chat',
  rateLimiterMiddleware,
  validateRequestBody({ messages: 'array' }),
  inputSanitizationMiddleware,
  auditMiddleware,
  chatController.chat
);

// Endpoint for Intelligent FAQ Widget
router.post(
  '/faq',
  rateLimiterMiddleware,
  validateRequestBody({ question: 'string' }),
  inputSanitizationMiddleware,
  auditMiddleware,
  chatController.faq
);

export default router;
