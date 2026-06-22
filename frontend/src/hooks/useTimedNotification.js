import { useCallback, useEffect, useRef, useState } from "react";

export function useTimedNotification(duration = 3000) {
  const [notification, setNotification] = useState({ message: "", type: "" });
  const timeoutRef = useRef(null);

  const clearNotification = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = null;
    setNotification({ message: "", type: "" });
  }, []);

  const showNotification = useCallback(
    (message, type = "success") => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      setNotification({ message, type });
      timeoutRef.current = setTimeout(clearNotification, duration);
    },
    [clearNotification, duration]
  );

  useEffect(() => clearNotification, [clearNotification]);

  return { notification, showNotification, clearNotification };
}
