/**
 * WorkBridge API client — the single place the frontend talks to the backend.
 * Every backend endpoint has a typed function here. The base URL comes from
 * NEXT_PUBLIC_API_URL and defaults to the local dev server, so it works with no
 * env file. The JWT is read from localStorage on each request.
 *
 * The endpoints are built on a transport, so the public live demo (/demo/*) can
 * run the same client against an in-browser backend. The real workspaces
 * (/app/*) always use `api`, which only ever talks to the real server.
 */

export const API_BASE =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api/v1";

const TOKEN_KEY = "wb.token";
const USER_KEY = "wb.user";

export type Role = "CLIENT" | "STUDENT" | "MODERATOR";

/**
 * An uploaded deliverable: metadata plus extracted text, plus base64 for
 * images / scanned PDFs so the AI judge can see them (never stored).
 * A folder upload becomes one Attachment whose `files` are its members; a single
 * file becomes an Attachment with one file. The same shape is understood by the
 * real API and the in-browser demo backend.
 */
export interface UploadedFile {
  name: string; // file name, or relative path within a folder
  mime: string;
  size: number; // bytes
  content: string | null; // extracted text for text-like files; null for binary
  // base64 of an image / scanned PDF so the AI judge can look at it. Sent with
  // the upload, used for the evaluation, never stored.
  data?: string | null;
}
export interface Attachment {
  kind: "file" | "folder";
  name: string;
  files: UploadedFile[];
}

export interface AuthUser {
  id: string;
  email: string;
  role: Role;
  name: string;
  phone?: string | null;
  avatarUrl?: string | null;
}

export interface ApiEnvelope<T> {
  success: boolean;
  message: string;
  data?: T;
  meta?: unknown;
  details?: unknown;
}

export class ApiError extends Error {
  status: number;
  details?: unknown;
  constructor(status: number, message: string, details?: unknown) {
    super(message);
    this.status = status;
    this.details = details;
  }
}

// ── token / user persistence ──
export const tokenStore = {
  get(): string | null {
    try {
      return localStorage.getItem(TOKEN_KEY);
    } catch {
      return null;
    }
  },
  set(token: string) {
    try {
      localStorage.setItem(TOKEN_KEY, token);
    } catch {
      /* ignore */
    }
  },
  clear() {
    try {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(USER_KEY);
    } catch {
      /* ignore */
    }
  },
  getUser(): AuthUser | null {
    try {
      const raw = localStorage.getItem(USER_KEY);
      return raw ? (JSON.parse(raw) as AuthUser) : null;
    } catch {
      return null;
    }
  },
  setUser(user: AuthUser) {
    try {
      localStorage.setItem(USER_KEY, JSON.stringify(user));
    } catch {
      /* ignore */
    }
  },
};

async function httpRequest<T>(
  method: string,
  path: string,
  body?: unknown
): Promise<T> {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  const token = tokenStore.get();
  if (token) headers.Authorization = `Bearer ${token}`;

  let res: Response;
  try {
    res = await fetch(`${API_BASE}${path}`, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new ApiError(0, "Cannot reach the server. Is the API running?");
  }

  let json: ApiEnvelope<T> | null = null;
  try {
    json = (await res.json()) as ApiEnvelope<T>;
  } catch {
    /* non-JSON */
  }

  if (!res.ok || !json?.success) {
    // Zod validation errors come back as "Validation failed" plus a list of
    // field messages; show the first field message, which says what to fix.
    const first = Array.isArray(json?.details) ? (json.details[0] as { message?: string } | undefined)?.message : undefined;
    throw new ApiError(
      res.status,
      first ?? json?.message ?? `Request failed (${res.status})`,
      json?.details
    );
  }
  return json.data as T;
}

/** Sends one request and resolves with the envelope's data (or throws ApiError). */
export type Transport = <T>(method: string, path: string, body?: unknown) => Promise<T>;

// ── endpoints ──
export function createApi(request: Transport) {
  const get = <T>(p: string) => request<T>("GET", p);
  const post = <T>(p: string, b?: unknown) => request<T>("POST", p, b);
  const patch = <T>(p: string, b?: unknown) => request<T>("PATCH", p, b);

  return {
    // auth
    register: (body: Record<string, unknown>) =>
      post<{ user: AuthUser; token: string }>("/auth/register", body),
    login: (email: string, password: string) =>
      post<{ user: AuthUser; token: string }>("/auth/login", { email, password }),
    me: () => get<AuthUser>("/users/me"),
    setAvatar: (avatarUrl: string) => patch<AuthUser>("/users/me/avatar", { avatarUrl }),

    // client
    client: {
      postJob: (body: { brief: string; title?: string; budget?: number; attachments?: Attachment[] }) =>
        post<{ job: unknown; price: unknown }>("/client/jobs", body),
      listJobs: () => get<unknown[]>("/client/jobs"),
      getJob: (id: string) => get<unknown>(`/client/jobs/${id}`),
      reviewTrial: (taskId: string, decision: "approve" | "changes", note?: string) =>
        post(`/client/tasks/${taskId}/trial-check`, { decision, note }),
      deposit: (taskId: string, paymentMethodId?: string) =>
        post(`/client/tasks/${taskId}/deposit`, { paymentMethodId }),
      signOff: (taskId: string, decision: "accept" | "revision", note?: string) =>
        post(`/client/tasks/${taskId}/signoff`, { decision, note }),
      dispute: (taskId: string, claim: string, amount: number, evidence?: string[]) =>
        post(`/client/tasks/${taskId}/dispute`, { claim, amount, evidence }),
      payments: () => get<unknown[]>("/client/payments"),
      paymentMethods: () => get<unknown[]>("/client/payment-methods"),
      addPaymentMethod: (body: { kind: string; label: string; isDefault?: boolean }) =>
        post("/client/payment-methods", body),
      messages: (taskId: string) => get<unknown[]>(`/client/tasks/${taskId}/messages`),
      sendMessage: (taskId: string, text: string) =>
        post(`/client/tasks/${taskId}/messages`, { body: text }),
    },

    // student
    student: {
      profile: () => get<unknown>("/student/profile"),
      updateProfile: (body: Record<string, unknown>) => patch("/student/profile", body),
      kyc: () => get<unknown>("/student/kyc"),
      submitKyc: (documents: { label: string; detail: string }[]) =>
        post("/student/kyc", { documents }),
      browse: (sectorId?: string) =>
        get<unknown[]>(`/student/tasks${sectorId ? `?sectorId=${sectorId}` : ""}`),
      taskDetail: (taskId: string) => get<unknown>(`/student/tasks/${taskId}`),
      apply: (taskId: string, summary: string, minutesTaken: number, attachments?: Attachment[]) =>
        post(`/student/tasks/${taskId}/apply`, { summary, minutesTaken, attachments }),
      trials: () => get<unknown[]>("/student/trials"),
      points: () => get<{ total: number; entries: unknown[] }>("/student/points"),
      active: () => get<unknown[]>("/student/active"),
      progress: (taskId: string, progress: number) =>
        post(`/student/tasks/${taskId}/progress`, { progress }),
      submit: (taskId: string, note: string, files?: Attachment[]) =>
        post(`/student/tasks/${taskId}/submit`, { note, files }),
      record: () => get<unknown[]>("/student/record"),
      earnings: () => get<{ total: number; payments: unknown[] }>("/student/earnings"),
      dispute: (taskId: string, claim: string, amount: number, evidence?: string[]) =>
        post(`/student/tasks/${taskId}/dispute`, { claim, amount, evidence }),
      messages: (taskId: string) => get<unknown[]>(`/student/tasks/${taskId}/messages`),
      sendMessage: (taskId: string, text: string) =>
        post(`/student/tasks/${taskId}/messages`, { body: text }),
    },

    // moderator
    moderator: {
      scopes: () => get<unknown[]>("/moderator/scopes"),
      approveScope: (jobId: string, body?: Record<string, unknown>) =>
        post(`/moderator/scopes/${jobId}/approve`, body ?? {}),
      rejectScope: (jobId: string, reason: string) =>
        post(`/moderator/scopes/${jobId}/reject`, { reason }),
      selectRounds: () => get<unknown[]>("/moderator/select"),
      selectStudent: (taskId: string, studentId: string, reason: string) =>
        post(`/moderator/tasks/${taskId}/select`, { studentId, reason }),
      reviews: () => get<unknown[]>("/moderator/reviews"),
      scoreWork: (taskId: string, scores: { dim: string; score: number; max: number }[], note?: string) =>
        post(`/moderator/tasks/${taskId}/score`, { scores, note }),
      kyc: () => get<unknown[]>("/moderator/kyc"),
      decideKyc: (id: string, decision: "approve" | "reject" | "resubmit", note?: string) =>
        post(`/moderator/kyc/${id}`, { decision, note }),
      payments: () => get<unknown[]>("/moderator/payments"),
      refund: (taskId: string, reason: string) =>
        post(`/moderator/tasks/${taskId}/refund`, { reason }),
      disputes: (status?: string) =>
        get<unknown[]>(`/moderator/disputes${status ? `?status=${status}` : ""}`),
      ruleDispute: (id: string, outcome: "client" | "student" | "split", resolution: string) =>
        post(`/moderator/disputes/${id}/rule`, { outcome, resolution }),
      tickets: (status?: string) =>
        get<unknown[]>(`/moderator/support${status ? `?status=${status}` : ""}`),
      replyTicket: (id: string, reply: string) =>
        post(`/moderator/support/${id}/reply`, { reply }),
      users: (role?: Role) =>
        get<unknown[]>(`/moderator/users${role ? `?role=${role}` : ""}`),
      setUserActive: (id: string, isActive: boolean) =>
        post(`/moderator/users/${id}/active`, { isActive }),
      controls: () => get<unknown>("/moderator/controls"),
    },

    // support (client/student)
    support: {
      create: (body: { subject: string; body: string; priority?: "high" | "normal" }) =>
        post("/support", body),
      listMine: () => get<unknown[]>("/support"),
    },
  };
}

/** The real API — used by sign-in and every /app workspace. */
export const api = createApi(httpRequest);

export type Api = ReturnType<typeof createApi>;
