import React, {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { API_BASE_URL, apiRequest, artistSession, getFreshArtistAccessToken } from "../lib/api";
import { useAuth } from "./AuthContext";
import { useToast } from "./ToastContext";

const NOTIFICATION_ROLE = "artist" as const;
const SOCKET_PUBLIC_PROTOCOL = "sedabox.notifications";
const HEARTBEAT_INTERVAL_MS = 25_000;
const SOCKET_STALE_MS = 75_000;
const CONNECTED_RECONCILE_MS = 5 * 60_000;
const DISCONNECTED_RECONCILE_MS = 60_000;
const FOCUS_RECONCILE_AGE_MS = 45_000;

export interface ArtistNotification {
  id: number;
  recipient_role: typeof NOTIFICATION_ROLE;
  text: string;
  text_en?: string;
  has_read: boolean;
  created_at: string;
}

type RealtimeStatus = "disabled" | "connecting" | "connected" | "reconnecting";

type NotificationContextValue = {
  notifications: ArtistNotification[];
  unreadCount: number;
  hasUnread: boolean;
  isLoading: boolean;
  realtimeStatus: RealtimeStatus;
  refreshNotifications: () => Promise<void>;
  markAsRead: (id: number) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  formatTimeAgo: (value: string) => string;
};

const NotificationContext = createContext<NotificationContextValue | null>(null);

const normalizeNotification = (candidate: unknown): ArtistNotification | null => {
  const value = candidate as Record<string, unknown> | null;
  const id = Number(value?.id);
  if (
    !Number.isFinite(id) ||
    value?.recipient_role !== NOTIFICATION_ROLE ||
    typeof value?.text !== "string" ||
    typeof value?.has_read !== "boolean" ||
    typeof value?.created_at !== "string"
  ) {
    return null;
  }
  return {
    id,
    recipient_role: NOTIFICATION_ROLE,
    text: value.text,
    text_en: typeof value.text_en === "string" ? value.text_en : value.text,
    has_read: value.has_read,
    created_at: value.created_at,
  };
};

const normalizeList = (body: unknown): ArtistNotification[] => {
  const record = body as { results?: unknown } | null;
  const rows = Array.isArray(body)
    ? body
    : Array.isArray(record?.results)
      ? record.results
      : [];
  const byId = new Map<number, ArtistNotification>();
  rows.forEach((row) => {
    const notification = normalizeNotification(row);
    if (notification && !notification.has_read) byId.set(notification.id, notification);
  });
  return [...byId.values()].sort((a, b) => {
    const time = Date.parse(b.created_at) - Date.parse(a.created_at);
    return time || b.id - a.id;
  });
};

const upsertNotification = (
  current: ArtistNotification[],
  incoming: ArtistNotification,
): ArtistNotification[] =>
  [incoming, ...current.filter((item) => item.id !== incoming.id)].sort((a, b) => {
    const time = Date.parse(b.created_at) - Date.parse(a.created_at);
    return time || b.id - a.id;
  });

const eventKey = (notification: ArtistNotification) =>
  `${notification.id}:${notification.created_at}`;

const claimCrossTabToast = (key: string): boolean => {
  if (typeof window === "undefined" || document.visibilityState !== "visible") return false;
  try {
    const storageKey = `sedabox.notifications.${NOTIFICATION_ROLE}.last-toast`;
    const now = Date.now();
    const previous = JSON.parse(localStorage.getItem(storageKey) || "null") as
      | { key?: string; at?: number }
      | null;
    if (previous?.key === key && now - Number(previous.at || 0) < 15_000) return false;
    localStorage.setItem(storageKey, JSON.stringify({ key, at: now }));
  } catch {
    // A private browser may deny localStorage; per-tab dedupe still applies.
  }
  return true;
};

const buildSocketUrl = (): string => {
  const configured = process.env.NEXT_PUBLIC_NOTIFICATIONS_WS_URL?.trim();
  if (configured) {
    const url = new URL(configured, window.location.href);
    if (url.protocol === "https:") url.protocol = "wss:";
    if (url.protocol === "http:") url.protocol = "ws:";
    url.searchParams.set("role", NOTIFICATION_ROLE);
    return url.toString();
  }
  try {
    const url = new URL(API_BASE_URL);
    url.protocol = url.protocol === "https:" ? "wss:" : "ws:";
    url.pathname = "/ws/notifications/";
    url.search = "";
    url.searchParams.set("role", NOTIFICATION_ROLE);
    url.hash = "";
    return url.toString();
  } catch {
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    return `${protocol}//${window.location.host}/ws/notifications/?role=${NOTIFICATION_ROLE}`;
  }
};

export const NotificationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user, isLoggedIn, isInitializing } = useAuth();
  const { showToast } = useToast();
  const [notifications, setNotifications] = useState<ArtistNotification[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [realtimeStatus, setRealtimeStatus] = useState<RealtimeStatus>("disabled");

  const notificationsRef = useRef(notifications);
  notificationsRef.current = notifications;
  const requestRef = useRef<Promise<void> | null>(null);
  const requestVersionRef = useRef(0);
  const lastHttpSyncRef = useRef(0);
  const toastedKeysRef = useRef<Set<string>>(new Set());

  const showNotificationToast = useCallback(
    (notification: ArtistNotification) => {
      const key = eventKey(notification);
      if (toastedKeysRef.current.has(key)) return;
      toastedKeysRef.current.add(key);
      if (toastedKeysRef.current.size > 250) {
        toastedKeysRef.current = new Set([...toastedKeysRef.current].slice(-125));
      }
      if (!claimCrossTabToast(key)) return;
      showToast(notification.text, "info", 6000);
    },
    [showToast],
  );

  const refreshNotifications = useCallback((): Promise<void> => {
    if (!isLoggedIn) {
      requestVersionRef.current += 1;
      notificationsRef.current = [];
      setNotifications([]);
      setIsLoading(false);
      return Promise.resolve();
    }
    if (requestRef.current) return requestRef.current;

    const version = requestVersionRef.current;
    setIsLoading(true);
    const request = (async () => {
      try {
        const body = await apiRequest<unknown>("/notifications/", {
          query: { role: NOTIFICATION_ROLE },
        });
        if (version !== requestVersionRef.current) return;
        const rows = normalizeList(body);
        notificationsRef.current = rows;
        setNotifications(rows);
        lastHttpSyncRef.current = Date.now();
      } catch (error) {
        console.error("Artist notification refresh failed", error);
      } finally {
        setIsLoading(false);
      }
    })();
    requestRef.current = request;
    void request.finally(() => {
      if (requestRef.current === request) requestRef.current = null;
    });
    return request;
  }, [isLoggedIn]);

  const markAsRead = useCallback(async (id: number) => {
    await apiRequest(`/notifications/${id}/read/`, {
      method: "POST",
      query: { role: NOTIFICATION_ROLE },
    });
    requestVersionRef.current += 1;
    const remaining = notificationsRef.current.filter((item) => item.id !== id);
    notificationsRef.current = remaining;
    setNotifications(remaining);
  }, []);

  const markAllAsRead = useCallback(async () => {
    if (!notificationsRef.current.length) return;
    await apiRequest("/notifications/read/", {
      method: "POST",
      query: { role: NOTIFICATION_ROLE },
    });
    requestVersionRef.current += 1;
    notificationsRef.current = [];
    setNotifications([]);
  }, []);

  useEffect(() => {
    requestVersionRef.current += 1;
    requestRef.current = null;
    notificationsRef.current = [];
    setNotifications([]);
    toastedKeysRef.current.clear();
    if (!isInitializing && isLoggedIn) void refreshNotifications();
  }, [isInitializing, isLoggedIn, user?.id, refreshNotifications]);

  useEffect(() => {
    if (isInitializing || !isLoggedIn) {
      setRealtimeStatus("disabled");
      return;
    }

    let disposed = false;
    let socket: WebSocket | null = null;
    let reconnectTimer: number | null = null;
    let heartbeatTimer: number | null = null;
    let connectTimeout: number | null = null;
    let reconnectAttempt = 0;
    let lastMessageAt = Date.now();
    let forceRefreshBeforeConnect = false;
    let socketAccepted = false;
    let tokenUsed: string | null = null;

    const clearTimers = () => {
      if (heartbeatTimer !== null) window.clearInterval(heartbeatTimer);
      if (connectTimeout !== null) window.clearTimeout(connectTimeout);
      heartbeatTimer = null;
      connectTimeout = null;
    };

    const scheduleReconnect = () => {
      if (disposed || reconnectTimer !== null || !navigator.onLine) return;
      reconnectAttempt += 1;
      const base = Math.min(30_000, 1_000 * 2 ** Math.min(reconnectAttempt - 1, 5));
      const delay = Math.round(base * (0.8 + Math.random() * 0.4));
      setRealtimeStatus("reconnecting");
      reconnectTimer = window.setTimeout(() => {
        reconnectTimer = null;
        void connect();
      }, delay);
    };

    const handleMessage = (event: MessageEvent<string>) => {
      lastMessageAt = Date.now();
      let message: any;
      try {
        message = JSON.parse(event.data);
      } catch {
        return;
      }
      if (message?.type !== "pong" && message?.recipient_role !== NOTIFICATION_ROLE) {
        console.error("Blocked cross-role artist notification payload", message);
        return;
      }
      if (message.type === "notifications.connected") {
        void refreshNotifications();
        return;
      }
      if (message.type === "notification.created") {
        const incoming = normalizeNotification(message.notification);
        if (!incoming || incoming.has_read) return;
        requestVersionRef.current += 1;
        const next = upsertNotification(notificationsRef.current, incoming);
        notificationsRef.current = next;
        setNotifications(next);
        showNotificationToast(incoming);
        return;
      }
      if (message.type === "notification.read") {
        const id = Number(message.notification_id);
        if (!Number.isFinite(id)) return;
        const next = notificationsRef.current.filter((item) => item.id !== id);
        notificationsRef.current = next;
        setNotifications(next);
        void refreshNotifications();
        return;
      }
      if (message.type === "notifications.read_all") {
        const through = Number(message.read_through_id);
        const next = Number.isFinite(through) && through > 0
          ? notificationsRef.current.filter((item) => item.id > through)
          : [];
        notificationsRef.current = next;
        setNotifications(next);
        void refreshNotifications();
      }
    };

    const connect = async () => {
      if (disposed || !navigator.onLine) return;
      if (
        socket &&
        (socket.readyState === WebSocket.OPEN || socket.readyState === WebSocket.CONNECTING)
      ) return;
      setRealtimeStatus(reconnectAttempt ? "reconnecting" : "connecting");
      const token = await getFreshArtistAccessToken(forceRefreshBeforeConnect);
      forceRefreshBeforeConnect = false;
      if (disposed || !token) {
        if (!disposed) setRealtimeStatus("disabled");
        return;
      }
      tokenUsed = token;
      socketAccepted = false;
      try {
        socket = new WebSocket(buildSocketUrl(), [
          SOCKET_PUBLIC_PROTOCOL,
          `jwt.${token}`,
        ]);
      } catch {
        scheduleReconnect();
        return;
      }
      connectTimeout = window.setTimeout(() => {
        if (socket?.readyState === WebSocket.CONNECTING) socket.close(4000, "connect timeout");
      }, 12_000);
      socket.onopen = () => {
        socketAccepted = true;
        reconnectAttempt = 0;
        lastMessageAt = Date.now();
        clearTimers();
        setRealtimeStatus("connected");
        heartbeatTimer = window.setInterval(() => {
          if (!socket || socket.readyState !== WebSocket.OPEN) return;
          if (Date.now() - lastMessageAt > SOCKET_STALE_MS) {
            socket.close(4001, "heartbeat timeout");
            return;
          }
          socket.send(JSON.stringify({ type: "ping", ts: Date.now() }));
        }, HEARTBEAT_INTERVAL_MS);
      };
      socket.onmessage = handleMessage;
      socket.onerror = () => undefined;
      socket.onclose = (event) => {
        clearTimers();
        const rejectedBeforeAccept = !socketAccepted && event.code !== 1000;
        if (
          rejectedBeforeAccept &&
          tokenUsed &&
          tokenUsed === artistSession.access()
        ) {
          forceRefreshBeforeConnect = true;
        }
        tokenUsed = null;
        socketAccepted = false;
        socket = null;
        if (!disposed) {
          if (event.code !== 1000 && event.code !== 4002) void refreshNotifications();
          scheduleReconnect();
        }
      };
    };

    const handleOnline = () => {
      if (reconnectTimer !== null) window.clearTimeout(reconnectTimer);
      reconnectTimer = null;
      void connect();
      void refreshNotifications();
    };
    const handleOffline = () => {
      socket?.close(4002, "browser offline");
      setRealtimeStatus("reconnecting");
    };
    const handleFocus = () => {
      if (document.visibilityState !== "visible") return;
      if (!socket || socket.readyState !== WebSocket.OPEN) void connect();
      if (Date.now() - lastHttpSyncRef.current > FOCUS_RECONCILE_AGE_MS) {
        void refreshNotifications();
      }
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    window.addEventListener("focus", handleFocus);
    document.addEventListener("visibilitychange", handleFocus);
    void connect();

    return () => {
      disposed = true;
      if (reconnectTimer !== null) window.clearTimeout(reconnectTimer);
      clearTimers();
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
      window.removeEventListener("focus", handleFocus);
      document.removeEventListener("visibilitychange", handleFocus);
      if (socket) {
        socket.onopen = null;
        socket.onmessage = null;
        socket.onerror = null;
        socket.onclose = null;
        socket.close(1000, "provider cleanup");
      }
    };
  }, [isInitializing, isLoggedIn, refreshNotifications, showNotificationToast, user?.id]);

  useEffect(() => {
    if (isInitializing || !isLoggedIn) return;
    const interval = window.setInterval(() => {
      if (document.visibilityState === "visible") void refreshNotifications();
    }, realtimeStatus === "connected" ? CONNECTED_RECONCILE_MS : DISCONNECTED_RECONCILE_MS);
    return () => window.clearInterval(interval);
  }, [isInitializing, isLoggedIn, realtimeStatus, refreshNotifications]);

  const formatTimeAgo = useCallback((value: string) => {
    const timestamp = Date.parse(value);
    if (!Number.isFinite(timestamp)) return "";
    const seconds = Math.max(0, Math.floor((Date.now() - timestamp) / 1000));
    if (seconds < 60) return "همین حالا";
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes} دقیقه پیش`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours} ساعت پیش`;
    const days = Math.floor(hours / 24);
    return `${days} روز پیش`;
  }, []);

  const value = useMemo<NotificationContextValue>(() => ({
    notifications,
    unreadCount: notifications.length,
    hasUnread: notifications.length > 0,
    isLoading,
    realtimeStatus,
    refreshNotifications,
    markAsRead,
    markAllAsRead,
    formatTimeAgo,
  }), [
    notifications,
    isLoading,
    realtimeStatus,
    refreshNotifications,
    markAsRead,
    markAllAsRead,
    formatTimeAgo,
  ]);

  return <NotificationContext.Provider value={value}>{children}</NotificationContext.Provider>;
};

export const useNotifications = (): NotificationContextValue => {
  const value = useContext(NotificationContext);
  if (!value) throw new Error("هوک اعلان‌ها باید داخل فراهم‌کننده اعلان‌ها استفاده شود.");
  return value;
};
