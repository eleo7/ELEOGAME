import { Component, type ReactNode } from 'react';
export class ErrorBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    return this.state.failed ? (
      <main className="creation">
        <section className="panel">
          <h1>A jornada foi interrompida.</h1>
          <p>Seu último save continua no navegador. Recarregue para retomá-lo.</p>
          <button className="primary mt" onClick={() => window.location.reload()}>
            Recarregar jogo
          </button>
        </section>
      </main>
    ) : (
      this.props.children
    );
  }
}
