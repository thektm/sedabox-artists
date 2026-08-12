import React, { createContext, ReactNode, useContext, useEffect, useState } from "react";
import { apiRequest, artistSession } from "../lib/api";

interface LiveListenersContextType {
  liveListeners: number;
  isPolling: boolean;
}

interface LiveListenersResponse {
  live_listeners?: number;
  changed?: boolean;
}

const LiveListenersContext = createContext<LiveListenersContextType | undefined>(undefined);

export const useLiveListeners = () => {
  const context = useContext(LiveListenersContext);
  if (!context) throw new Error("هوک شنوندگان زنده باید داخل فراهم‌کننده مربوط استفاده شود.");
  return context;
};

const wait = (milliseconds: number, signal: AbortSignal) =>
  new Promise<void>((resolve) => {
    const timer = window.setTimeout(resolve, milliseconds);
    signal.addEventListener(
      "abort",
      () => {
        window.clearTimeout(timer);
        resolve();
      },
      { once: true },
    );
  });

export const LiveListenersProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [liveListeners, setLiveListeners] = useState(0);
  const [isPolling, setIsPolling] = useState(false);

  useEffect(() => {
    const controller = new AbortController();

    const poll = async () => {
      if (!artistSession.access() && !artistSession.refresh()) return;
      setIsPolling(true);
      let retryDelay = 2_000;

      try {
        const initial = await apiRequest<LiveListenersResponse>("/artist/live-listeners/", {
          signal: controller.signal,
        });
        if (typeof initial.live_listeners === "number") setLiveListeners(initial.live_listeners);
      } catch (error) {
        if ((error as Error)?.name === "AbortError") return;
      }

      while (!controller.signal.aborted) {
        try {
          const result = await apiRequest<LiveListenersResponse>("/artist/live-listeners/poll/", {
            signal: controller.signal,
          });
          if (typeof result.live_listeners === "number") setLiveListeners(result.live_listeners);
          retryDelay = 2_000;
        } catch (error) {
          if ((error as Error)?.name === "AbortError") break;
          await wait(retryDelay, controller.signal);
          retryDelay = Math.min(30_000, retryDelay * 2);
        }
      }

      setIsPolling(false);
    };

    void poll();
    return () => controller.abort();
  }, []);

  return (
    <LiveListenersContext.Provider value={{ liveListeners, isPolling }}>
      {children}
    </LiveListenersContext.Provider>
  );
};

export default LiveListenersProvider;
