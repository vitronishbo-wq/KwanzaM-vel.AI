/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * ContainerRegistry
 * 
 * Um Service Locator seguro de nível industrial para expor o contentor de injeção
 * de dependências ao domínio sem induzir circularidade no grafo de compilação do TypeScript.
 */
export class ContainerRegistry {
  private static instance: any = null;

  public static register(container: any): void {
    ContainerRegistry.instance = container;
    if (typeof window !== "undefined") {
      (window as any).__kmos_container = container;
    }
  }

  public static get(): any {
    return ContainerRegistry.instance;
  }

  public static has(): boolean {
    return ContainerRegistry.instance !== null;
  }
}
