import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertCircle, RefreshCw, Home } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Savouré ERP Caught Error:', error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  private handleDismiss = () => {
    this.setState({ hasError: false, error: null });
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#120F0D] text-[#EDE6DE] flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-[#171311] border border-[#2C211B] rounded-2xl p-6 sm:p-7 shadow-2xl text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-rose-500/20 border border-rose-500/30 flex items-center justify-center mx-auto text-rose-400">
              <AlertCircle className="w-6 h-6" />
            </div>

            <div>
              <h2 className="text-lg font-serif font-bold text-white tracking-wide">
                Something Needs Attention
              </h2>
              <p className="text-xs text-[#A69385] mt-1">
                Your session is completely safe. Savouré ERP prevented an interruption.
              </p>
            </div>

            {this.state.error?.message && (
              <div className="p-3 rounded-lg bg-[#221B17] border border-[#3A2D25] text-left text-xs font-mono text-[#DE9E74] max-h-24 overflow-y-auto">
                {this.state.error.message}
              </div>
            )}

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={this.handleDismiss}
                className="flex-1 py-2.5 px-4 rounded-lg bg-[#221B17] hover:bg-[#2C211B] text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
              >
                <Home className="w-4 h-4 text-[#A69385]" />
                <span>Return to Workspace</span>
              </button>

              <button
                type="button"
                onClick={this.handleReset}
                className="flex-1 py-2.5 px-4 rounded-lg bg-[#C98A5B] hover:bg-[#DE9E74] text-[#120F0D] text-xs font-bold flex items-center justify-center gap-1.5 transition-colors shadow-sm"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Reload Page</span>
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
