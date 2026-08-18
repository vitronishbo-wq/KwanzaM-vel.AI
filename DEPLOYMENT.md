# Guia de Implantação e Configuração de Variáveis de Ambiente no Render (KMOS Hardening)

Este documento descreve o procedimento passo a passo para a configuração de variáveis de ambiente na plataforma **Render** para a solução **KwanzaMóvel (KMOS)**.

A arquitetura hexagonal do KMOS permite a transição transparente entre o modo de desenvolvimento/simulação (**SIMULATED / DEV**) e o ambiente de produção (**PRODUCTION**), sem alterar uma única linha do código do domínio (*Core*).

---

## 1. Mapeamento Geral de Variáveis de Ambiente

### A. Módulo de Persistência e Banco de Dados (Firestore / Firebase)

| Variável | Valor em Desenvolvimento (SIMULATED/DEV) | Valor em Produção (PRODUCTION) | Descrição |
| :--- | :--- | :--- | :--- |
| `FIREBASE_PROJECT_ID` | `kwanza-movel-ai-sandbox` | `kwanza-movel-prod` | ID do projeto Firebase/Firestore |
| `FIREBASE_CLIENT_EMAIL` | `firebase-adminsdk@kwanza-movel-ai-sandbox.iam.gserviceaccount.com` | `kmos-sa@kwanza-movel-prod.iam.gserviceaccount.com` | Email da Conta de Serviço (*Service Account*) |
| `FIREBASE_PRIVATE_KEY` | `-----BEGIN PRIVATE KEY-----\nDEV_KEY\n-----END PRIVATE KEY-----` | `-----BEGIN PRIVATE KEY-----\n[SEGREDO_REAL_PRODUCTION]\n-----END PRIVATE KEY-----` | Chave privada da conta de serviço |
| `FIREBASE_CREDENTIALS` | `{"type":"service_account","project_id":"kwanza-movel-ai-sandbox",...}` | `{"type":"service_account","project_id":"kwanza-movel-prod",...}` | JSON de credenciais completas da Conta de Serviço Firebase |

---

### B. Módulo de Segurança e Assinatura Digital (SignatureProvider / KMS / HSM)

| Variável | Valor em Desenvolvimento (SIMULATED/DEV) | Valor em Produção (PRODUCTION) | Descrição |
| :--- | :--- | :--- | :--- |
| `KM_SIGNATURE_MODE` | `SIMULATED` | `PRODUCTION` | Define o modo do `SignatureProvider` (Simulado em software ou KMS/HSM Real) |
| `KM_PRIV_KEY_REF` | `simulated://kmos-dev/keys/receipt-signer-v1` | `projects/kmos/locations/global/keyRings/bna-ring/cryptoKeys/receipt-signer` | **Referência/URI da Chave** (Desacopla o identificador opaco da chave privada real) |
| `HSM_SERIAL_NUMBER` | `DEV-HSM-001` | `HSM-SGP-BNA-9821-KM` | Identificador único do Hardware Security Module |
| `HSM_KEY_SLOT` | `SIGNING_SLOT_01` | `Slot-04-SovereignProduction` | Slot lógico contendo o par de chaves operacionais |
| `HSM_ALGORITHM` | `ECDSA_P256_SHA256` | `ECDSA_P256_SHA256` | Algoritmo criptográfico aprovado pelo regulador |
| `HSM_KMS_SECRET_KEY` | `DEV_SECRET_KEY_KMOS_2026` | `[SEGREDO_KMS_PRODUCAO]` | Chave de serviço/autenticação do Key Management Service |

> **Nota de Segurança Zero-Trust**: O KMOS segue o princípio de separação de segredos. A aplicação nunca armazena chaves privadas brutas (PEM/DER) em variáveis de ambiente nem na memória do processo. Apenas a referência de chave (`KM_PRIV_KEY_REF`) é configurada no serviço, sendo as assinaturas executadas internamente na fronteira do KMS/HSM via `SignatureProvider`.

---

### C. Módulo de Conectividade com o BNA (Bridge SPTR / mTLS)

| Variável | Valor em Desenvolvimento (SIMULATED/DEV) | Valor em Produção (PRODUCTION) | Descrição |
| :--- | :--- | :--- | :--- |
| `BNA_SPTR_MODE` | `SIMULATED` | `PRODUCTION` | Alterna o adaptador SPTR entre modo simulado e real |
| `BNA_SPTR_ENDPOINT` | `https://sandbox.sptr.local` | `https://sptr.bna.ao/api/v2/settlement/pacs008` | Endpoint da rede de liquidação do Banco Nacional de Angola |
| `BNA_MTLS_CERT_PATH` | `./certs/dev/client.crt` | `/etc/pki/mtls/kmos_bna_client.crt` | Caminho do certificado x509 cliente para mTLS |
| `BNA_MTLS_KEY_PATH` | `./certs/dev/client.key` | `/etc/pki/mtls/kmos_bna_client.key` | Caminho da chave privada do certificado mTLS |
| `BNA_MTLS_CA_PATH` | `./certs/dev/ca.crt` | `/etc/pki/mtls/bna_root_ca.crt` | Certificado de autoridade de raiz do BNA |

---

### D. Módulo de Gestão de Credenciais e Autenticação (CredentialManager / RBAC)

| Variável | Valor em Desenvolvimento (SIMULATED/DEV) | Valor em Produção (PRODUCTION) | Descrição |
| :--- | :--- | :--- | :--- |
| `KMOS_DEFAULT_PASSWORD` | `DeusFundador123!` | `[SEGREDO_PRODUCAO_MFA_HASH]` | Palavra-passe mestre padrão para autenticação de perfis |
| `KMOS_DEUS_FUNDADOR_EMAIL` | `ssilajaneiro1@gmail.com` | `ssilajaneiro1@gmail.com` | E-mail do utilizador raiz / Deus Fundador |
| `KMOS_DEUS_FUNDADOR_PHONE` | `+244 948323383` | `+244 948323383` | Telefone operacional do utilizador raiz |
| `KMOS_DEUS_FUNDADOR_NAME` | `Marcelo Truman` | `Marcelo Truman` | Nome completo do utilizador raiz |

---

## 2. Passo a Passo de Configuração no Painel do Render

1. **Aceda ao Dashboard do Render:**
   - Faça login em [https://dashboard.render.com](https://dashboard.render.com).

2. **Selecione o Serviço Web do KMOS:**
   - Navegue até o seu *Web Service* ou *Environment Group* correspondente ao KMOS.

3. **Navegue até "Environment":**
   - No menu lateral esquerdo, clique no separador **Environment**.

4. **Adicionar/Editar Variáveis (`Environment Variables`):**
   - Clique em **Add Environment Variable** ou utilize a opção **Edit Variables** / **Secret Files** caso opte por carregar certificados x509 diretamente.
   - Adicione cada uma das chaves listadas acima com os respetivos valores do ambiente pretendido (*SIMULATED* ou *PRODUCTION*).

5. **Guardar e Despoletar o Redeploy:**
   - Clique em **Save Changes**. O Render irá reiniciar o serviço (*Deploy*) promovendo a aplicação com as novas configurações ativas.

---

## 3. Verificação de Saúde e Observabilidade do Serviço

Após a implantação, pode validar a integridade da aplicação consultando o endpoint de saúde:

```bash
GET https://<seu-app-render>.onrender.com/health/readiness
```

O endpoint retornará a cobertura matemática de testes e a verificação de conformidade ativas no **Constitution Engine**:

```json
{
  "status": "HEALTHY",
  "readiness": {
    "coverageScore": "100%",
    "complianceVerification": "90.9%",
    "totalTestScenarios": 16,
    "riskScenariosCount": 16,
    "activeInvariants": 12,
    "totalRegulatoryRules": 13
  },
  "timestamp": "2026-07-21T14:58:00.000Z"
}
```
