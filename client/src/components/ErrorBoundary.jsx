import { Component } from 'react'

// If a page crashes while it is drawn, show a message with the reason instead of a blank white screen.
class ErrorBoundary extends Component {
  state = { error: null }

  static getDerivedStateFromError(error) {
    return { error }
  }

  render() {
    if (!this.state.error) return this.props.children
    return (
      <div className="py-24 text-center">
        <h1 className="text-3xl">Something went wrong on this page</h1>
        <p className="mt-3 text-bread-brown">{String(this.state.error?.message || this.state.error)}</p>
        <button className="btn-primary mt-6" onClick={() => window.location.reload()}>Reload the page</button>
      </div>
    )
  }
}

export default ErrorBoundary
