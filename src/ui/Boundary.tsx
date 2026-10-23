import { Component, type ReactNode } from 'react'
import { usePortfolio } from '../store'
import { disableWebGL } from '../webgl'

/** A failed 3D chunk or render falls back to the list view instead of a blank screen. */
export class Boundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false }
  static getDerivedStateFromError() {
    return { failed: true }
  }
  componentDidCatch() {
    disableWebGL()
    usePortfolio.getState().setView('list')
  }
  render() {
    return this.state.failed ? null : this.props.children
  }
}
