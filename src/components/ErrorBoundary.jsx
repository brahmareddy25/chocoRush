import React from 'react';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    console.error('NutBliss render error:', error, info);
  }

  render() {
    if (this.state.error) {
      return (
        <main className="error-page">
          <section className="error-card">
            <p>NutBliss could not start</p>
            <h1>The app hit a browser error instead of rendering.</h1>
            <pre>{this.state.error.message}</pre>
            <span>Open DevTools Console and share the red error if this message stays here.</span>
          </section>
        </main>
      );
    }

    return this.props.children;
  }
}
