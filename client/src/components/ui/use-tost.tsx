import { createContext, useContext } from 'react';

type ToastContextType = {
  toast: (options: { title: string; description?: string; variant?: 'default' | 'destructive' }) => void;
};

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};