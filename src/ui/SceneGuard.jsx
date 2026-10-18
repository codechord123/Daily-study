import { Component } from 'react';

// 3D가 실패해도(오래된 기기·그래픽 끔) 미션과 메뉴는 쓸 수 있게 한다
export default class SceneGuard extends Component {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  componentDidCatch(err) {
    console.warn('3D 장면 오류', err);
  }
  render() {
    if (this.state.failed)
      return (
        <div className="scene-fallback">
          <p>이 기기에서는 3D 별을 보여 줄 수 없어요.<br />미션과 기록은 그대로 할 수 있어요.</p>
        </div>
      );
    return this.props.children;
  }
}

export function webglAvailable() {
  try {
    const c = document.createElement('canvas');
    return !!(c.getContext('webgl2') || c.getContext('webgl'));
  } catch {
    return false;
  }
}
