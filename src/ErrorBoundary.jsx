import React from "react";

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("Error caught by boundary:", error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-lg p-6 max-w-md w-full">
            <div className="text-center">
              <div className="text-4xl mb-4">😵</div>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                应用出错了
              </h2>
              <p className="text-gray-600 mb-4">
                抱歉，应用遇到了意外错误。您可以尝试刷新页面或重置应用。
              </p>
              <div className="space-y-2">
                <button
                  onClick={this.handleReset}
                  className="w-full bg-gray-900 text-white rounded-xl py-3 font-medium hover:bg-gray-800 transition-colors"
                >
                  刷新页面
                </button>
                <button
                  onClick={() => {
                    localStorage.clear();
                    window.location.reload();
                  }}
                  className="w-full bg-red-600 text-white rounded-xl py-3 font-medium hover:bg-red-700 transition-colors"
                >
                  重置所有数据（谨慎）
                </button>
              </div>
              {process.env.NODE_ENV === "development" && (
                <details className="mt-4 text-left">
                  <summary className="text-sm text-gray-500 cursor-pointer">
                    错误详情（开发模式）
                  </summary>
                  <pre className="mt-2 text-xs bg-gray-100 p-3 rounded-lg overflow-auto">
                    {this.state.error?.toString()}
                  </pre>
                </details>
              )}
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
