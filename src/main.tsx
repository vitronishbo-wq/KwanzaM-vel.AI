import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

import { ReceiptSignature } from "./domain/evidence/ReceiptEngine.ts";
import { HsmSignerAdapter } from "./infrastructure/adapters/hsm/HsmSignerAdapter.ts";
import { MockSigner } from "./infrastructure/adapters/hsm/MockSigner.ts";
import { ContainerRegistry } from "./bootstrap/ContainerRegistry.ts";
import { container } from "./bootstrap/container.ts";

// Injeta o assinador criptográfico abstrato via DI com base na configuração de ambiente
const isDevMock = process.env.NODE_ENV === "test" || (typeof localStorage !== "undefined" && localStorage.getItem("kmos_use_mock_signer") === "true");
const activeSigner = isDevMock ? new MockSigner() : new HsmSignerAdapter();

ReceiptSignature.injectSigner(activeSigner);

// Regista o contentor global de injeção de dependências no Registry para uso no domínio.
ContainerRegistry.register(container);

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

