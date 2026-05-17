import EventSource from "react-native-sse";

import type { DeliverySessionResponse, OrderResponse } from "../types";

export type SSEEventMap = {
  "order.created": OrderResponse;
  "order.updated": OrderResponse;
  "delivery.started": DeliverySessionResponse;
  "delivery.location": DeliverySessionResponse;
  "delivery.finished": DeliverySessionResponse;
  "stock.broadcast": unknown;
};

export type SSEEventName = keyof SSEEventMap;

type Handler<E extends SSEEventName> = (payload: SSEEventMap[E]) => void;

type SSEClientOptions = {
  getToken: () => Promise<string | null>;
  onConnect?: () => void;
  onError?: (error: unknown) => void;
  url: string;
};

const BACKOFF_SCHEDULE_MS = [1_000, 2_000, 5_000, 10_000, 30_000];

const SSE_EVENT_NAMES: SSEEventName[] = [
  "order.created",
  "order.updated",
  "delivery.started",
  "delivery.location",
  "delivery.finished",
  "stock.broadcast",
];

export class SSEClient {
  private source: EventSource<SSEEventName> | null = null;
  private handlers = new Map<SSEEventName, Set<Handler<SSEEventName>>>();
  private retryIndex = 0;
  private retryTimeout: ReturnType<typeof setTimeout> | null = null;
  private stopped = true;

  constructor(private readonly options: SSEClientOptions) {}

  on<E extends SSEEventName>(event: E, handler: Handler<E>) {
    let set = this.handlers.get(event);
    if (!set) {
      set = new Set();
      this.handlers.set(event, set);
    }
    set.add(handler as Handler<SSEEventName>);
    return () => {
      set!.delete(handler as Handler<SSEEventName>);
    };
  }

  async start() {
    this.stopped = false;
    this.retryIndex = 0;
    if (this.source) {
      return;
    }
    await this.openConnection();
  }

  stop() {
    this.stopped = true;
    this.clearRetry();
    this.closeConnection();
  }

  private async openConnection() {
    if (this.stopped) {
      return;
    }

    const token = await this.options.getToken();
    if (!token) {
      this.scheduleRetry();
      return;
    }

    this.closeConnection();

    const source = new EventSource<SSEEventName>(this.options.url, {
      headers: { Authorization: `Bearer ${token}` },
      pollingInterval: 0,
      timeout: 0,
    });

    source.addEventListener("open", () => {
      this.retryIndex = 0;
      this.options.onConnect?.();
    });

    source.addEventListener("error", (event) => {
      this.options.onError?.(event);
      this.scheduleRetry();
    });

    SSE_EVENT_NAMES.forEach((name) => {
      source.addEventListener(name, (event) => {
        const raw = (event as { data?: string }).data;
        if (!raw) {
          return;
        }
        try {
          const payload = JSON.parse(raw);
          const handlers = this.handlers.get(name);
          handlers?.forEach((handler) => handler(payload));
        } catch {
          // ignore malformed payload
        }
      });
    });

    this.source = source;
  }

  private closeConnection() {
    if (!this.source) {
      return;
    }
    try {
      this.source.removeAllEventListeners();
    } catch {
      // ignore
    }
    try {
      this.source.close();
    } catch {
      // ignore
    }
    this.source = null;
  }

  private scheduleRetry() {
    if (this.stopped) {
      return;
    }
    this.clearRetry();
    const delay =
      BACKOFF_SCHEDULE_MS[Math.min(this.retryIndex, BACKOFF_SCHEDULE_MS.length - 1)];
    this.retryIndex += 1;
    this.retryTimeout = setTimeout(() => {
      this.retryTimeout = null;
      this.openConnection().catch(() => this.scheduleRetry());
    }, delay);
  }

  private clearRetry() {
    if (this.retryTimeout) {
      clearTimeout(this.retryTimeout);
      this.retryTimeout = null;
    }
  }
}
