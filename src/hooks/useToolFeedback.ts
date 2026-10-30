import { useCallback, useState } from 'react';

/**
 * Success / error banner state shared by every tool
 */
export function useToolFeedback() {
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const showSuccess = useCallback((message: string) => {
    setErrorMessage(null);
    setSuccessMessage(message);
  }, []);

  const showError = useCallback((message: string) => {
    setSuccessMessage(null);
    setErrorMessage(message);
  }, []);

  const resetFeedback = useCallback(() => {
    setSuccessMessage(null);
    setErrorMessage(null);
  }, []);

  return { successMessage, errorMessage, showSuccess, showError, resetFeedback };
}
