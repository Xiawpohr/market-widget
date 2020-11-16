import { useCallback, useState, useEffect, useRef } from "react";

const ReadyState = {
  UNINSTANTIATED: -1,
  CONNECTING: 0,
  OPEN: 1,
  CLOSING: 2,
  CLOSED: 3,
};

export default function useWebSocket(url = "", options = {}) {
  const {
    onOpen = () => {},
    onMessage = () => {},
    onClose = () => {},
    onError = () => {},
    retryCounts = 3,
    retryInterval = 5000,
  } = options;

  const webSocketRef = useRef();

  const [readyState, setReadyState] = useState();
  const [message, setMessage] = useState();
  const reconnectCount = useRef(0);

  const send = useCallback((message) => {
    if (
      webSocketRef.current &&
      webSocketRef.current.readyState === ReadyState.OPEN
    ) {
      webSocketRef.current.send(message);
    }
  }, []);

  const close = useCallback(() => {
    if (
      webSocketRef.current &&
      webSocketRef.current.readyState === ReadyState.OPEN
    ) {
      webSocketRef.current.close();
    }
  }, []);

  const connect = useCallback(
    (onOpen, onMessage, onClose, onError) => {
      console.log("connect");
      webSocketRef.current = new WebSocket(url);
      webSocketRef.current.addEventListener("open", onOpen);
      webSocketRef.current.addEventListener("message", onMessage);
      webSocketRef.current.addEventListener("close", onClose);
      webSocketRef.current.addEventListener("error", onError);

      return () => {
        webSocketRef.current.close();
        webSocketRef.current = null;
      };
    },
    [url]
  );

  useEffect(() => {
    let stale = false;
    let removeListeners;
    let reconnectTimeout;

    const _onOpen = () => {
      onOpen();
      if (!stale) {
        setReadyState(ReadyState.OPEN);
      }
    };

    const _onMessage = (event) => {
      onMessage(event);
      if (!stale) {
        setMessage(event.data);
      }
    };

    const _onClose = () => {
      onClose();
      if (!stale) {
        setReadyState(ReadyState.CLOSED);
      }
      if (reconnectCount.current < retryCounts) {
        reconnectTimeout = setTimeout(() => {
          console.log("retry");
          reconnectCount.current++;
          removeListeners = connect(_onOpen, _onMessage, _onClose, _onError);
        }, retryInterval);
      }
    };

    const _onError = (event) => {
      onError(event);
      if (!stale) {
        setReadyState(ReadyState.UNINSTANTIATED);
      }
      if (reconnectCount.current < retryCounts) {
        reconnectTimeout = setTimeout(() => {
          reconnectCount.current++;
          removeListeners = connect(_onOpen, _onMessage, _onClose, _onError);
        }, retryInterval);
      }
    };

    removeListeners = connect(_onOpen, _onMessage, _onClose, _onError);

    return () => {
      stale = true;
      removeListeners();
      if (reconnectTimeout) {
        clearTimeout(reconnectTimeout);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [connect, retryCounts, retryInterval]);

  return {
    readyState,
    message,
    send,
    close,
  };
}
