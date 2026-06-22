import { useCallback, useRef, useState } from "react";
import ConfirmDialog from "../components/common/ConfirmDialog";

export function useConfirmDialog() {
  const resolverRef = useRef(null);
  const [dialog, setDialog] = useState(null);

  const closeDialog = useCallback((result) => {
    resolverRef.current?.(result);
    resolverRef.current = null;
    setDialog(null);
  }, []);

  const confirm = useCallback((options) => {
    return new Promise((resolve) => {
      resolverRef.current = resolve;
      setDialog(options);
    });
  }, []);

  const confirmDialog = (
    <ConfirmDialog
      open={Boolean(dialog)}
      title={dialog?.title}
      message={dialog?.message}
      confirmLabel={dialog?.confirmLabel}
      cancelLabel={dialog?.cancelLabel}
      tone={dialog?.tone}
      onConfirm={() => closeDialog(true)}
      onCancel={() => closeDialog(false)}
    />
  );

  return { confirm, confirmDialog };
}
