import { Component, type ReactNode } from 'react'

interface Props {
  children: ReactNode
}

interface State {
  error: Error | null
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null }

  static getDerivedStateFromError(error: Error) {
    return { error }
  }

  render() {
    if (this.state.error) {
      return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center gap-4 p-8">
          <p className="text-4xl">😵</p>
          <h2 className="text-xl font-bold text-error">Something went wrong</h2>
          <p className="text-sm text-base-content/60 max-w-sm">
            {this.state.error.message}
          </p>
          <button
            className="btn btn-primary rounded-2xl"
            onClick={() => {
              this.setState({ error: null })
              window.location.href = '/'
            }}
          >
            Go Home
          </button>
        </div>
      )
    }
    return this.props.children
  }
}
