import { Component, type ReactNode } from 'react';

interface State {
  hasError: boolean;
  message: string;
}

export class ErrorBoundary extends Component<{ children: ReactNode }, State> {
  state: State = { hasError: false, message: '' };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, message: error.message };
  }

  componentDidCatch(error: Error, info: unknown) {
    console.error('PulseIQ render error:', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-screen items-center justify-center bg-[#04070d] p-6">
          <div className="max-w-md rounded-2xl border border-rose-500/30 bg-rose-500/10 p-6 text-rose-100">
            <h2 className="font-semibold text-lg">Something went wrong</h2>
            <p className="mt-2 text-sm text-rose-200/80">{this.state.message}</p>
            <button
              onClick={() => this.setState({ hasError: false, message: '' })}
              className="mt-4 rounded-lg bg-rose-500/20 px-3 py-1.5 text-sm hover:bg-rose-500/30"
            >
              Try again
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
