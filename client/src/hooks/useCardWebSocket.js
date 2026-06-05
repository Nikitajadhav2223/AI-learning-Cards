import { useRef, useCallback } from "react";

const WS_URL = "ws://localhost:3001";

export function useCardWebSocket({ onMessage, onOpen, onClose, onError }) {
  const wsRef = useRef(null);

  const connect = useCallback(() => {
    // Re-use existing open connection
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      return wsRef.current;
    }

    const ws = new WebSocket(WS_URL);
    wsRef.current = ws;

    ws.onopen = () => onOpen?.();
    ws.onclose = () => onClose?.();
    ws.onerror = (e) => onError?.(e);
    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        onMessage(data);
      } catch {
        console.error("Failed to parse WS message", event.data);
      }
    };

    return ws;
  }, [onMessage, onOpen, onClose, onError]);

  const send = useCallback((data) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(data));
    } else {
      console.warn("WebSocket not open, cannot send.");
    }
  }, []);

  const disconnect = useCallback(() => {
    wsRef.current?.close();
    wsRef.current = null;
  }, []);

  return { connect, send, disconnect, wsRef };
}
