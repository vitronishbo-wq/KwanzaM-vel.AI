/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Request, Response } from 'express';
import { ChatUseCase } from '../../application/usecases/ChatUseCase';
import { FaqUseCase } from '../../application/usecases/FaqUseCase';
import { Logger } from '../../shared/logger';

export class ChatController {
  private chatUseCase = new ChatUseCase();
  private faqUseCase = new FaqUseCase();

  /**
   * POST /api/chat
   */
  public chat = async (req: Request, res: Response): Promise<void> => {
    try {
      const { messages } = req.body;
      if (!messages || !Array.isArray(messages)) {
        res.status(400).json({ error: 'Parâmetro "messages" ausente ou inválido.' });
        return;
      }

      Logger.info('[ChatController] Recebido pedido de chat.', { messageCount: messages.length });
      const answer = await this.chatUseCase.execute(messages);

      res.status(200).json({ text: answer });
    } catch (err: any) {
      Logger.error('[ChatController] Falha ao processar chat de especialistas.', {
        error: err.message,
        stack: err.stack,
      });
      res.status(500).json({
        error: 'Erro no servidor assistente do KwanzaMóvel',
        details: err.message,
      });
    }
  };

  /**
   * POST /api/faq
   */
  public faq = async (req: Request, res: Response): Promise<void> => {
    try {
      const { question } = req.body;
      if (!question || typeof question !== 'string') {
        res.status(400).json({ error: 'Parâmetro "question" ausente ou inválido.' });
        return;
      }

      Logger.info('[ChatController] Recebida dúvida FAQ.', { questionLength: question.length });
      const answer = await this.faqUseCase.execute(question);

      res.status(200).json({ answer });
    } catch (err: any) {
      Logger.error('[ChatController] Falha ao processar pergunta de FAQ inteligente.', {
        error: err.message,
        stack: err.stack,
      });
      res.status(500).json({
        error: 'Erro no motor de FAQ Inteligente',
        details: err.message,
      });
    }
  };
}

export const chatController = new ChatController();
