// Small pieces every page uses for the three states of loading data:
//   loading -> <PageLoader />     failed -> <ErrorBox />     nothing found -> <EmptyState />

export const PageLoader = ({ text = 'Loading...' }) => (
  <div className="flex items-center justify-center gap-3 py-16 text-bread-brown" role="status">
    <span className="h-5 w-5 animate-spin rounded-full border-2 border-bread-latte border-t-bread-caramel"></span>
    <p>{text}</p>
  </div>
)

export const ErrorBox = ({ message, onRetry }) => (
  <div className="my-6 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800" role="alert">
    <p>{message}</p>
    {onRetry && (
      <button onClick={onRetry} className="btn-outline mt-3">
        Try again
      </button>
    )}
  </div>
)

export const EmptyState = ({ text }) => <p className="py-10 text-center text-bread-brown">{text}</p>
