import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

import { ReceiptSignature } from "./domain/evidence/ReceiptEngine.ts";
import { ContainerRegistry } from "./bootstrap/ContainerRegistry.ts";
import { container } from "./bootstrap/container.ts";
import { EnvironmentConfigValidator } from "./bootstrap/EnvironmentConfigValidator.ts";

// Validação de configuração no arranque: impede produção com DEV-*, SIMULATED ou endpoints fictícios
EnvironmentConfigValidator.validate(true);

// Injeta o assinador criptográfico abstrato via DI configurado no Container
ReceiptSignature.injectSigner(container.signatureProvider);

// Regista o contentor global de injeção de dependências no Registry para uso no domínio.
ContainerRegistry.register(container);

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

