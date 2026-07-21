/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { GoogleGenAI } from '@google/genai';
import { Logger } from '../shared/logger';

export class GeminiService {
  private static instance: GeminiService | null = null;
  private aiClient: GoogleGenAI | null = null;

  private constructor() {}

  public static getInstance(): GeminiService {
    if (!GeminiService.instance) {
      GeminiService.instance = new GeminiService();
    }
    return GeminiService.instance;
  }

  private getClient(): GoogleGenAI {
    if (!this.aiClient) {
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        throw new Error('A variável de ambiente GEMINI_API_KEY é obrigatória para o motor de IA.');
      }
      this.aiClient = new GoogleGenAI({ apiKey });
      Logger.info('[GeminiService] GoogleGenAI client initialized successfully.', { component: 'AIService' });
    }
    return this.aiClient;
  }

  public async generateChatResponse(
    messages: { sender: 'user' | 'agent' | 'model'; text: string }[],
    systemPrompt: string,
  ): Promise<string> {
    const client = this.getClient();
    const contents = messages.map((m) => ({
      role: m.sender === 'user' ? 'user' : 'model',
      parts: [{ text: m.text }],
    }));

    try {
      const start = Date.now();
      const response = await client.models.generateContent({
        model: 'gemini-2.5-flash',
        contents,
        config: {
          systemInstruction: systemPrompt,
          temperature: 0.7,
        },
      });
      const latencyMs = Date.now() - start;

      Logger.info('[GeminiService] Chat generation succeeded.', {
        component: 'AIService',
        latencyMs,
        messageCount: messages.length,
      });

      return response.text || 'Desculpe, não conseguimos gerar uma resposta de momento.';
    } catch (err: any) {
      Logger.error('[GeminiService] Error generating chat response.', {
        component: 'AIService',
        error: err.message,
        stack: err.stack,
      });
      throw err;
    }
  }

  public async generateFaqResponse(question: string, systemPrompt: string): Promise<string> {
    const client = this.getClient();

    try {
      const start = Date.now();
      const response = await client.models.generateContent({
        model: 'gemini-3.5-flash',
        contents: question,
        config: {
          systemInstruction: systemPrompt,
          temperature: 0.5,
        },
      });
      const latencyMs = Date.now() - start;

      Logger.info('[GeminiService] FAQ generation succeeded.', {
        component: 'AIService',
        latencyMs,
        questionLength: question.length,
      });

      return response.text || 'Não foi possível responder a esta questão de momento.';
    } catch (err: any) {
      Logger.error('[GeminiService] Error generating FAQ response.', {
        component: 'AIService',
        error: err.message,
        stack: err.stack,
      });
      throw err;
    }
  }
}

export const geminiService = GeminiService.getInstance();
