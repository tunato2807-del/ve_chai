import { Component } from 'react'

export default class PageBoundary extends Component {
  state = { failed: false }
  static getDerivedStateFromError() {
    return { failed: true }
  }
  render() {
    if (this.state.failed)
      return (
        <section className="container data-state" role="alert">
          <h1>Chưa mở được trang</h1>
          <p>Hãy tải lại để tiếp tục thao tác.</p>
          <button
            className="button button-secondary"
            type="button"
            onClick={() => window.location.reload()}
          >
            Tải lại trang
          </button>
        </section>
      )
    return this.props.children
  }
}
