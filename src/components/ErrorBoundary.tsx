import { Component, type ErrorInfo, type ReactNode } from 'react';
import { Button } from '@/components/ui/button';

interface Props {
  children: ReactNode;
}

interface State {
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('应用渲染错误:', error, info);
  }

  handleReset = () => {
    localStorage.removeItem('sales-ledger-storage');
    window.location.reload();
  };

  render() {
    if (this.state.error) {
      return (
        <div className="flex min-h-screen items-center justify-center bg-slate-50 p-6">
          <div className="max-w-md rounded-xl border border-red-200 bg-white p-6 shadow-lg">
            <h1 className="text-lg font-bold text-red-600">页面加载失败</h1>
            <p className="mt-2 text-sm text-slate-600">
              {this.state.error.message || '未知错误，可能是本地缓存数据损坏。'}
            </p>
            <Button className="mt-4" onClick={this.handleReset}>
              清除缓存并刷新
            </Button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
