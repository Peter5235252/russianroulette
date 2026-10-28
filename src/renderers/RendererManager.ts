import { WebGPURenderer } from 'three/webgpu';

export const isWebGPUSupported = async (): Promise<{ supported: boolean; reason?: string }> => {
  const gpu = typeof navigator !== 'undefined' ? (navigator as any).gpu : undefined;
  if (!gpu) {
    return {
      supported: false,
      reason: 'WebGPU API (navigator.gpu) is not supported or disabled in your browser.',
    };
  }
  try {
    let adapter = null;
    try {
      adapter = await gpu.requestAdapter({ powerPreference: 'high-performance' });
    } catch {
      // ignore and try default requestAdapter below
    }
    if (!adapter) {
      try {
        adapter = await gpu.requestAdapter();
      } catch {
        // ignore
      }
    }
    if (!adapter) {
      return {
        supported: false,
        reason: 'No compatible WebGPU hardware adapter found on system.',
      };
    }
    return { supported: true };
  } catch (err: any) {
    return {
      supported: false,
      reason: err?.message || 'Failed to request WebGPU hardware adapter.',
    };
  }
};

export const createWebGPURenderer = async (canvas: HTMLCanvasElement, forceWebGL: boolean = false) => {
  const check = await isWebGPUSupported();
  const shouldUseWebGL = forceWebGL || !check.supported;

  if (shouldUseWebGL) {
    if (forceWebGL && check.supported) {
      console.info('WebGPU is supported but forced to WebGL fallback by user settings.');
    } else {
      console.warn(`WebGPU is unsupported (${check.reason || 'no hardware adapter'}). Falling back to WebGLBackend.`);
    }
  }

  // Safety filter to silence benign WebGL context lost errors on renderer teardown
  if (typeof window !== 'undefined' && !(window as any).__deviceLostFilterInstalled) {
    (window as any).__deviceLostFilterInstalled = true;
    const originalConsoleError = console.error.bind(console);
    console.error = (...args: any[]) => {
      if (args.length > 0 && typeof args[0] === 'string') {
        if (args[0].includes('WebGPURenderer') && args[0].includes('Device Lost')) {
          // Benign context loss during pipeline switch from WebGL to WebGPU
          return;
        }
      }
      originalConsoleError(...args);
    };
  }

  const renderer = new WebGPURenderer({
    canvas,
    antialias: false,
    powerPreference: 'high-performance',
    forceWebGL: shouldUseWebGL
  });

  let isDisposed = false;

  // Override onDeviceLost to prevent verbose error spam during intentional renderer destruction
  (renderer as any).onDeviceLost = (info: any) => {
    if (isDisposed) return;
    if (info?.api === 'WebGL') {
      return;
    }
    console.warn(`[WebGPURenderer] Device loss: ${info?.message || 'unknown'}`);
  };

  const originalDispose = renderer.dispose.bind(renderer);
  renderer.dispose = () => {
    isDisposed = true;
    try {
      const backend = (renderer as any).backend;
      if (backend && backend._onContextLost && renderer.domElement) {
        renderer.domElement.removeEventListener('webglcontextlost', backend._onContextLost, false);
      }
    } catch (e) {}
    try {
      originalDispose();
    } catch (e) {}
  };

  await (renderer as any).init();

  return renderer;
};


