import { API_URL } from "../config";
import { clearAuthSession, getAuthSession, setAuthSession } from "../storage";
import type { ApiFieldError, ApiResponse, AuthResponse, AuthSession } from "../types";

type ApiRequestInit = RequestInit & {
  auth?: boolean;
  retryOnUnauthorized?: boolean;
};

export class ApiError extends Error {
  errors: ApiFieldError[] | null;
  payload: unknown;
  status: number;

  constructor(message: string, status: number, payload: unknown, errors: ApiFieldError[] | null = null) {
    super(message);
    this.name = "ApiError";
    this.errors = errors;
    this.payload = payload;
    this.status = status;
  }
}

export async function apiFetch<T>(
  path: string,
  options: ApiRequestInit = {},
): Promise<T> {
  const withAuth = options.auth !== false;
  const retryOnUnauthorized = options.retryOnUnauthorized !== false;
  const response = await sendRequest(path, options, withAuth);

  if (response.status === 401 && withAuth && retryOnUnauthorized) {
    const refreshed = await refreshAuthSession();
    const retryResponse = await sendRequest(path, options, withAuth, refreshed);
    return parseResponse<T>(retryResponse);
  }

  return parseResponse<T>(response);
}

export function getApiErrorMessage(error: unknown) {
  if (error instanceof ApiError) {
    const fieldErrors = error.errors?.map((item) => item.message).filter(Boolean) ?? [];
    if (fieldErrors.length > 0) {
      return fieldErrors.join("\n");
    }

    if (error.message) {
      return error.message;
    }
    if (error.status === 401) {
      return "Tu sesión venció. Volvé a iniciar sesión.";
    }
    if (error.status === 409) {
      return "Hay un conflicto con el estado actual de esos datos.";
    }
    return `El backend respondió con estado ${error.status}.`;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return "Ocurrió un error inesperado.";
}

async function sendRequest(
  path: string,
  options: ApiRequestInit,
  withAuth: boolean,
  overrideSession?: AuthSession,
) {
  const headers = new Headers(options.headers);
  headers.set("Accept", "application/json");
  headers.set("Content-Type", "application/json");

  if (withAuth) {
    const session = overrideSession ?? (await getAuthSession());
    if (session?.accessToken) {
      headers.set("Authorization", `Bearer ${session.accessToken}`);
    }
  }

  return fetch(buildUrl(path), {
    ...options,
    headers,
  });
}

async function refreshAuthSession() {
  const currentSession = await getAuthSession();
  if (!currentSession?.refreshToken) {
    await clearAuthSession();
    throw new ApiError("No hay refresh token disponible.", 401, null);
  }

  const response = await fetch(buildUrl("/auth/refresh"), {
    body: JSON.stringify({ refreshToken: currentSession.refreshToken }),
    headers: { Accept: "application/json", "Content-Type": "application/json" },
    method: "POST",
  });

  try {
    const refreshed = await parseResponse<AuthResponse>(response);
    const nextSession: AuthSession = {
      ...refreshed,
      context: currentSession.context,
    };
    await setAuthSession(nextSession);
    return nextSession;
  } catch (error) {
    await clearAuthSession();
    throw error;
  }
}

async function parseResponse<T>(response: Response): Promise<T> {
  const text = await response.text();
  let payload: unknown = null;

  if (text) {
    try {
      payload = JSON.parse(text);
    } catch {
      payload = text;
    }
  }

  if (!response.ok) {
    const apiPayload = isApiResponse(payload) ? payload : null;
    throw new ApiError(
      apiPayload?.message || response.statusText || "Error de API",
      response.status,
      payload,
      apiPayload?.errors ?? null,
    );
  }

  if (isApiResponse(payload)) {
    if (!payload.success) {
      throw new ApiError(payload.message || "Error de API", response.status, payload, payload.errors);
    }
    return payload.data as T;
  }

  return payload as T;
}

function isApiResponse(value: unknown): value is ApiResponse<unknown> {
  return (
    typeof value === "object" &&
    value !== null &&
    "success" in value &&
    "message" in value &&
    "data" in value
  );
}

function buildUrl(path: string) {
  if (path.startsWith("http")) {
    return path;
  }

  return `${API_URL}${path}`;
}
