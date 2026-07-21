# Segurança da Informação, Criptografia e KYC/AML (`backend/security`)

## 📌 Visão Geral
A pasta `backend/security` é responsável por abrigar a **Camada de Segurança, Criptografia e Regras de Conformidade Regulatória** do ecossistema **KwanzaMóvel**. 

Dada a natureza regulada e soberana do KwanzaMóvel sob a supervisão direta do Banco Nacional de Angola (BNA), a segurança não é uma adição de última hora, mas uma base fundamental do sistema. Este diretório encapsula os algoritmos de criptografia de dados confidenciais (PII), validação de NIF angolano, regras anti-lavagem de dinheiro (AML - Anti-Money Laundering) e políticas de KYC (Know Your Customer).

---

## 🛠️ Principais Responsabilidades
As principais responsabilidades técnicas centralizadas nesta pasta incluem:

1. **Criptografia e Proteção de Dados Sensíveis:** Algoritmos para cifrar informações confidenciais de identificação pessoal e saldos em trânsito e em repouso no banco de dados.
2. **Conformidade Regulatória KYC (Know Your Customer):** Regras de validação estritas de documentos, perfis e níveis transacionais (Tiers 1, 2 e 3). Define os limites operacionais associados a cada Tier de acordo com os regulamentos do BNA para prevenir fraudes.
3. **Triagem AML (Anti-Money Laundering) e Detecção de Fraude:** Algoritmos e lógica preventiva para rastrear e sinalizar transações que apresentem comportamento atípico de circulação de capital (ex: múltiplos saques rápidos ou transferências que violam limites operacionais consolidados).
4. **Assinaturas Digitais e Verificação de Payload:** Mecanismos de validação de chaves de assinatura digital em requisições críticas vindas de outros bancos parceiros ou de liquidações internas.
5. **Validação de NIF (NIF Angolano):** Algoritmos especializados na verificação da integridade do Número de Identificação Fiscal nacional de cidadãos e empresas.

---

## 🏛️ Alinhamento com o Plano Diretor de Engenharia
As seguintes regras arquiteturais regem este diretório de forma estrita:

* **Isolamento de Algoritmos:** Toda lógica de criptografia ou validação regulatória complexa deve ser abstraída de forma a expor apenas métodos limpos e de fácil utilização para o restante da aplicação.
* **Prevenção Ativa (Padrão Inegociável):** Qualquer violação de segurança ou KYC deve interromper imediatamente o fluxo da transação e disparar um log estruturado na camada de Telemetria com prioridade máxima de auditoria.
* **Isolamento do BNA Compliance:** Garante o cumprimento estrito dos limites diários e mensais permitidos para transações em Kwanzas, garantindo que o sistema nunca execute movimentos que possam colocar a plataforma em situação de inconformidade jurídica ou regulatória.
