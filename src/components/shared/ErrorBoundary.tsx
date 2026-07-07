"use client";

import { Component } from "react";

interface Props {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

interface State {
  hasError: boolean;
}

export default class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error) {
    console.error("Panel error:", error);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div className="rounded-xl bg-white/3 backdrop-blur-xl border border-red-500/30 p-5">
          <p className="text-xs text-red-400 font-mono">⚠️ Panel error — check console</p>
        </div>
      );
    }
    return this.props.children;
  }
}
