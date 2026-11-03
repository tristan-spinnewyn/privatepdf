import { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { describeProcessingError } from '../i18n/processing-error-message';

/**
 * Success / error banner state shared by every tool
 */
export function useToolFeedback() {
  const { t } = useTranslation();
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

  /** Logs a failed operation and shows why it failed, or `fallbackMessage` for unexpected errors */
  const showProcessingError = useCallback(
    (error: unknown, fallbackMessage: string) => {
      console.error(error);
      showError(describeProcessingError(error, t, fallbackMessage));
    },
    [showError, t]
  );

  const resetFeedback = useCallback(() => {
    setSuccessMessage(null);
    setErrorMessage(null);
  }, []);

  return { successMessage, errorMessage, showSuccess, showError, showProcessingError, resetFeedback };
}
