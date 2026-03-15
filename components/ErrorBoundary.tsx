import { Component, ErrorInfo, ReactNode } from 'react';

interface ErrorBoundaryProps {
  children?: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

/**
 * ErrorBoundary class component to catch rendering errors in the component tree.
 */
class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  // Explicitly declare state as a class property
  public state: ErrorBoundaryState = {
    hasError: false,
    error: null,
  };

  // Update state when an error occurs during rendering.
  public static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  // Catch errors in the component tree and log them.
  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  public render(): ReactNode {
    const { hasError, error } = this.state;

    if (hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4 font-sans">
          <div className="bg-white p-8 rounded-2xl shadow-xl max-w-md w-full text-center border border-red-100">
            <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-10 h-10">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
              </svg>
            </div>
            <h2 className="text-2xl font-black text-gray-900 mb-2 uppercase tracking-tight">Something went wrong</h2>
            <p className="text-gray-500 mb-6 text-sm">
              An unexpected error occurred in the application. We've logged the details.
            </p>
            {error && (
              <details className="text-left text-[10px] text-gray-400 bg-gray-50 p-3 rounded-xl mb-6 overflow-auto max-h-32 border border-gray-100">
                <summary className="cursor-pointer font-bold uppercase tracking-widest mb-1 outline-none">Error Trace</summary>
                <code className="whitespace-pre-wrap">{error.toString()}</code>
              </details>
            )}
            <button
              onClick={() => window.location.reload()}
              className="w-full py-4 bg-gray-900 text-white rounded-xl font-black uppercase tracking-[0.2em] hover:bg-black transition-all active:scale-95 shadow-lg"
            >
              Reload System
            </button>
          </div>
        </div>
      );
    }

    return (this as any).props.children;
  }
}

export default ErrorBoundary;