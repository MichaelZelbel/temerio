import React from "react";
import { Button } from "@/components/ui/button";
import { AlertTriangle, RefreshCw, Bug } from "lucide-react";

interface Props {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error("[ErrorBoundary]", error, info.componentStack);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  handleReport = () => {
    const { error } = this.state;
    const body = encodeURIComponent(
      `Error: ${error?.message}\n\nStack:\n${error?.stack?.slice(0, 500)}`
    );
    window.open(`mailto:support@temerio.com?subject=Bug Report&body=${body}`);
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;

      return (
        <div className="flex min-h-[400px] items-center justify-center px-4">
          <div className="mx-auto max-w-md text-center space-y-5">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10">
              <AlertTriangle className="h-8 w-8 text-destructive" />
            </div>
            <div className="space-y-2">
              <h3>Something went wrong</h3>
              <p className="text-sm text-muted-foreground">
                An unexpected error occurred. You can try again or report this issue.
              </p>
              {this.state.error && (
                <pre className="mt-3 max-h-24 overflow-auto rounded-lg bg-muted p-3 text-left text-xs text-muted-foreground">
                  {this.state.error.message}
                </pre>
              )}
            </div>
            <div className="flex items-center justify-center gap-3">
              <Button onClick={this.handleRetry}>
                <RefreshCw className="mr-2 h-4 w-4" /> Try Again
              </Button>
              <Button variant="outline" onClick={this.handleReport}>
                <Bug className="mr-2 h-4 w-4" /> Report Issue
              </Button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
