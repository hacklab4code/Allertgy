import React from 'react';
import { BlobSphereGL } from './BlobSphereGL';
import { ScanOrbFallback } from './ScanOrbFallback';

type Props = { size: number };

type State = { failed: boolean };

/** Blob 3D con fallback 2D se WebGL non parte. */
export class ScanOrbVisual extends React.Component<Props, State> {
  state: State = { failed: false };

  static getDerivedStateFromError(): State {
    return { failed: true };
  }

  render() {
    if (this.state.failed) {
      return <ScanOrbFallback size={this.props.size} />;
    }
    return <BlobSphereGL size={this.props.size} />;
  }
}
