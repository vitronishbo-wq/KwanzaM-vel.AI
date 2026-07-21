/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface CircuitBreakerOptions {
  failureThreshold: number; // Number of failures before opening
  resetTimeoutMs: number;  // Time before transitioning from OPEN to HALF-OPEN
  requestTimeoutMs: number; // Max time to wait for a request
}

export type CircuitBreakerState = "CLOSED" | "OPEN" | "HALF-OPEN";

/**
 * Resilient Circuit Breaker implementation for high-criticality financial bridges (BNA / SPTR).
 * Prevents cascading failures when BNA network interfaces experience latency spikes or downtime.
 */
export class CircuitBreaker {
  private state: CircuitBreakerState = "CLOSED";
  private failures = 0;
  private lastFailureTime = 0;

  constructor(private options: CircuitBreakerOptions = {
    failureThreshold: 3,
    resetTimeoutMs: 10000,
    requestTimeoutMs: 5000,
  }) {}

  public getState(): CircuitBreakerState {
    if (this.state === "OPEN") {
      const now = Date.now();
      if (now - this.lastFailureTime > this.options.resetTimeoutMs) {
        this.state = "HALF-OPEN";
      }
    }
    return this.state;
  }

  public async execute<T>(fn: () => Promise<T>): Promise<T> {
    const currentState = this.getState();

    if (currentState === "OPEN") {
      throw new Error(`[CircuitBreaker] Circuit is OPEN for BNA SPTR Bridge. Requests are rejected to preserve system integrity.`);
    }

    try {
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error(`[CircuitBreaker] Request timeout after ${this.options.requestTimeoutMs}ms`)), this.options.requestTimeoutMs);
      });

      const result = await Promise.race([fn(), timeoutPromise]);

      this.onSuccess();
      return result;
    } catch (error: any) {
      this.onFailure();
      throw error;
    }
  }

  private onSuccess(): void {
    this.failures = 0;
    this.state = "CLOSED";
  }

  private onFailure(): void {
    this.failures++;
    this.lastFailureTime = Date.now();
    if (this.failures >= this.options.failureThreshold) {
      this.state = "OPEN";
    }
  }

  public getMetrics() {
    return {
      state: this.getState(),
      failures: this.failures,
      lastFailureTime: this.lastFailureTime ? new Date(this.lastFailureTime).toISOString() : null,
    };
  }
}
