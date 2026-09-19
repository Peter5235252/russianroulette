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
    const adapter = await gpu.requestAdapter();
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
  let requiredLimits: Record<string, number> = {};
  const check = await isWebGPUSupported();
  
  if (check.supported && !forceWebGL) {
    const gpu = (navigator as any).gpu;
    if (gpu) {
      try {
        const adapter = await gpu.requestAdapter({ powerPreference: 'high-performance' });
        if (adapter && adapter.limits) {
          if (adapter.limits.maxColorAttachmentBytesPerSample) {
            requiredLimits.maxColorAttachmentBytesPerSample = adapter.limits.maxColorAttachmentBytesPerSample;
          }
          if (adapter.limits.maxStorageBufferBindingSize) {
            requiredLimits.maxStorageBufferBindingSize = adapter.limits.maxStorageBufferBindingSize;
          }
          if (adapter.limits.maxComputeWorkgroupStorageSize) {
            requiredLimits.maxComputeWorkgroupStorageSize = adapter.limits.maxComputeWorkgroupStorageSize;
          }
        }
      } catch (e) {
        console.warn('Could not query WebGPU adapter limits:', e);
      }
    }
  } else {
    console.warn(`WebGPU is unsupported or forced off by settings. Falling back to WebGLBackend.`);
  }

  const renderer = new WebGPURenderer({
    canvas,
    antialias: false,
    powerPreference: 'high-performance',
    requiredLimits,
    forceWebGL: forceWebGL || !check.supported
  });

  await (renderer as any).init();

  return renderer;
};


