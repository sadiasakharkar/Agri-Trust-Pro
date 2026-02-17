import { useCallback, useEffect, useState } from "react";

interface QueueItem {
  id: string;
  label: string;
  payload: unknown;
  createdAt: number;
  retryCount: number;
  dedupeKey: string;
}

const STORAGE_KEY = "agri_trust_offline_queue";

function loadQueue(): QueueItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as QueueItem[];
  } catch {
    return [];
  }
}

function saveQueue(items: QueueItem[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
}

function buildDedupeKey(label: string, payload: unknown): string {
  return `${label}:${JSON.stringify(payload)}`;
}

export function useOfflineQueue() {
  const [items, setItems] = useState<QueueItem[]>(() => loadQueue());
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);

  useEffect(() => {
    const onOnline = () => setIsOnline(true);
    const onOffline = () => setIsOnline(false);

    window.addEventListener("online", onOnline);
    window.addEventListener("offline", onOffline);

    return () => {
      window.removeEventListener("online", onOnline);
      window.removeEventListener("offline", onOffline);
    };
  }, []);

  const enqueue = useCallback((label: string, payload: unknown) => {
    const dedupeKey = buildDedupeKey(label, payload);
    setItems((prev) => {
      const existing = prev.find((item) => item.dedupeKey === dedupeKey);
      if (existing) {
        return prev;
      }

      const next: QueueItem = {
        id: crypto.randomUUID(),
        label,
        payload,
        createdAt: Date.now(),
        retryCount: 0,
        dedupeKey,
      };
      const updated = [...prev, next];
      saveQueue(updated);
      return updated;
    });
  }, []);

  const bumpRetry = useCallback((id: string) => {
    setItems((prev) => {
      const updated = prev.map((item) =>
        item.id === id ? { ...item, retryCount: item.retryCount + 1 } : item,
      );
      saveQueue(updated);
      return updated;
    });
  }, []);

  const dequeue = useCallback((id: string) => {
    setItems((prev) => {
      const updated = prev.filter((item) => item.id !== id);
      saveQueue(updated);
      return updated;
    });
  }, []);

  const clear = useCallback(() => {
    setItems([]);
    saveQueue([]);
  }, []);

  return { items, enqueue, bumpRetry, dequeue, clear, isOnline };
}
