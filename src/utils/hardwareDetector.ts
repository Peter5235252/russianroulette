export interface GpuDetectionResult {
  isDetected: boolean;
  gpuName: string;
  vendor: string;
  architecture: string;
  driverInfo?: string;
  os: string;
  renderApi: string;
  maxStorageBufferMB?: number;
  maxTextureSize?: number;
  isLowEndOrIntegrated: boolean;
  isIntegrated: boolean;
  isFallback: boolean;
  isWebGPU: boolean;
  reason: string;
  deviceMemory?: number;
  hardwareConcurrency?: number;
}

const LOW_END_PATTERNS = [
  // Software / Emulated Fallback
  /swiftshader/i,
  /llvmpipe/i,
  /softpipe/i,
  /software/i,
  /warp/i,
  /basic render/i,
  /microsoft basic/i,
  /virgl/i,
  /vbox/i,
  /vmware/i,

  // Intel integrated
  /intel.*(?:hd|uhd|iris|gma|graphics|plus|xe)/i,
  /intel\s+corporation/i,
  /intel\s+inc/i,
  /hd graphics/i,
  /uhd graphics/i,
  /iris xe/i,
  /iris plus/i,
  /iris pro/i,
  /iris\(r\)/i,
  /intel\(r\)/i,

  // AMD integrated
  /radeon\s+(?:vega|graphics|\(tm\)\s+graphics|r[2-5]|6[1-8]0m|7[4-8]0m|8[89]0m)/i,
  /amd\s+custom\s+gpu/i,
  /picasso/i,
  /renoir/i,
  /cezanne/i,
  /barcelo/i,
  /rembrandt/i,
  /phoenix/i,
  /mendocino/i,
  /hawk point/i,
  /strix point/i,
  /lucine/i,

  // Mobile / Embedded / Low-power ARM
  /mali(?:-t|-g\d{1,2}|-400|-450)/i,
  /adreno\s*(?:[2-6]\d{2}|702|710)/i,
  /powervr/i,
  /apple a\d+/i,
  /videocore/i,
  /vivante/i,

  // Low-end legacy discrete
  /geforce\s+(?:gt\s*[2-7]\d{2}|gt\s*1030|mx\d{3}|9[1-4]0m|8[1-4]0m)/i,
  /radeon\s+(?:r5\s*\d+|r7\s*2\d+|rx\s*550|rx\s*540|rx\s*6400)/i,
];

const INTEGRATED_KEYWORDS = [
  'intel hd',
  'intel uhd',
  'iris',
  'uhd graphics',
  'hd graphics',
  'integrated',
  'mali',
  'adreno',
  'powervr',
  'vega 3',
  'vega 6',
  'vega 7',
  'vega 8',
  'vega 10',
  'vega 11',
  'radeon 660m',
  'radeon 680m',
  'radeon 740m',
  'radeon 760m',
  'radeon 780m',
  'radeon 880m',
  'radeon 890m',
  'apu',
];

/**
 * Detect host Operating System accurately across Windows, macOS, Linux, ChromeOS, Android, iOS.
 */
export function detectOperatingSystem(): string {
  if (typeof navigator === 'undefined') return 'Unknown OS';

  const ua = navigator.userAgent || '';
  const platform = (navigator as any).userAgentData?.platform || navigator.platform || '';
  const is64 = /x86_64|x64|win64|amd64|wow64/i.test(ua) || /x86_64|x64|win64|amd64/i.test(platform);

  // 1. macOS / iOS / Apple
  if (/macintosh|mac os x|macintel|macppc|mac68k/i.test(platform) || /mac os x/i.test(ua)) {
    // Check if Apple Silicon or Intel
    const isAppleSilicon = (navigator.maxTouchPoints > 0 && /macintel/i.test(platform)) || /arm64|aarch64/i.test(ua);
    return isAppleSilicon ? 'macOS (Apple Silicon)' : 'macOS (Universal/x64)';
  }
  if (/iphone|ipad|ipod/i.test(ua) || (/macintel/i.test(platform) && navigator.maxTouchPoints > 1)) {
    return 'iOS / iPadOS';
  }

  // 2. Windows
  if (/win32|win64|windows|wince/i.test(platform) || /windows nt/i.test(ua)) {
    if (/windows nt 10\.0/i.test(ua)) {
      return is64 ? 'Windows 11 / 10 (x64)' : 'Windows 11 / 10 (x86)';
    }
    if (/windows nt 6\.3/i.test(ua)) return 'Windows 8.1';
    if (/windows nt 6\.1/i.test(ua)) return 'Windows 7';
    return is64 ? 'Windows (x64)' : 'Windows (x86)';
  }

  // 3. Linux / Unix
  if (/cros/i.test(ua)) {
    return 'ChromeOS';
  }
  if (/android/i.test(ua)) {
    return 'Android OS';
  }
  if (/linux/i.test(platform) || /linux/i.test(ua)) {
    const arch = /aarch64|arm64/i.test(ua) ? 'ARM64' : is64 ? 'x86_64' : 'x86';
    return `Linux (${arch})`;
  }

  return platform || 'Universal Environment';
}

/**
 * Clean up raw WebGL and WebGPU renderer/adapter strings, eliminating artificial
 * suffixes like ", or similar", ANGLE wrappers, Direct3D compiler targets, and driver artifacts.
 */
export function sanitizeGpuString(raw: string): string {
  if (!raw) return '';

  let cleaned = raw
    // Remove "or similar" and variants
    .replace(/,\s*or\s+similar/gi, '')
    .replace(/\(or\s+similar\)/gi, '')
    // Remove Direct3D shader model tags and feature levels
    .replace(/Direct3D\d+\s+(?:vs_\d+_\d+|ps_\d+_\d+|fl_\d+_\d+).*/gi, '')
    .replace(/Direct3D\s*\d+.*/gi, '')
    .replace(/D3D11-[0-9A-Fa-f.-]+/gi, '')
    .replace(/D3D12-[0-9A-Fa-f.-]+/gi, '')
    // Remove PCI device hex IDs e.g. (0x00002684) or (0x2484)
    .replace(/\(0x[0-9A-Fa-f]+\)/gi, '')
    // Remove ANGLE prefix wrapper: "ANGLE (Vendor, Model, Extra)" -> extract clean model
    .replace(/^ANGLE\s*\(([^,]+),\s*([^,]+)(?:,\s*.*)?\)$/i, '$2')
    .replace(/^ANGLE\s*\((.*)\)$/i, '$1')
    // Remove OpenGL / Vulkan renderer trailing junk
    .replace(/OpenGL\s+Engine/gi, '')
    .replace(/OpenGL\s+ES\s+[\d.]+\s+(?:Chromium|Mesa|Apple|Android)?/gi, '')
    .replace(/\/PCIe\/SSE2/gi, '')
    // Remove Mesa driver bracket details if overly verbose
    .replace(/\((radeonsi|radv|iris|crocus|zink|anv|llvmpipe|swrast)[^\)]*\)/gi, '')
    // Remove duplicate consecutive whitespaces
    .replace(/\s+/g, ' ')
    .trim();

  // Normalize known vendors cleanly
  if (/^NVIDIA Corporation\s*--\s*(.*)/i.test(cleaned)) {
    cleaned = cleaned.replace(/^NVIDIA Corporation\s*--\s*/i, '');
  }
  if (/^Intel\s+Inc\.\s*--\s*(.*)/i.test(cleaned)) {
    cleaned = cleaned.replace(/^Intel\s+Inc\.\s*--\s*/i, '');
  }
  if (/^Apple\s*--\s*(.*)/i.test(cleaned)) {
    cleaned = cleaned.replace(/^Apple\s*--\s*/i, '');
  }

  return cleaned.trim();
}

/**
 * Infer human-readable micro-architecture if not explicitly provided by the WebGPU driver.
 */
function inferGpuArchitecture(gpuName: string, vendor: string): string {
  const name = `${gpuName} ${vendor}`.toLowerCase();

  // NVIDIA
  if (/rtx\s*50\d{2}/.test(name)) return 'Blackwell';
  if (/rtx\s*40\d{2}/.test(name)) return 'Ada Lovelace';
  if (/rtx\s*30\d{2}/.test(name)) return 'Ampere';
  if (/rtx\s*20\d{2}|gtx\s*16\d{2}/.test(name)) return 'Turing';
  if (/gtx\s*10\d{2}/.test(name)) return 'Pascal';
  if (/gtx\s*9\d{2}/.test(name)) return 'Maxwell';

  // AMD
  if (/rx\s*7\d{3}|7[4-8]0m|880m|890m/.test(name)) return 'RDNA 3 / 3.5';
  if (/rx\s*6\d{3}|6[6-8]0m/.test(name)) return 'RDNA 2';
  if (/rx\s*5\d{3}/.test(name)) return 'RDNA 1';
  if (/rx\s*5[4-9]0|rx\s*4[78]0|vega/.test(name)) return 'GCN / Vega';

  // Intel
  if (/arc\s*b\d{3}/.test(name)) return 'Xe2-HPG (Battlemage)';
  if (/arc\s*a\d{3}/.test(name)) return 'Xe-HPG (Alchemist)';
  if (/iris\s*xe|uhd\s*7\d{2}/.test(name)) return 'Xe-LP (Gen12)';
  if (/uhd\s*6\d{2}|hd\s*6\d{2}/.test(name)) return 'Gen9.5 (Kaby Lake)';

  // Apple
  if (/m4/.test(name)) return 'Apple M4 Family';
  if (/m3/.test(name)) return 'Apple M3 Family';
  if (/m2/.test(name)) return 'Apple M2 Family';
  if (/m1/.test(name)) return 'Apple M1 Family';
  if (/apple/.test(name)) return 'Apple Silicon';

  // ARM / Qualcomm
  if (/adreno\s*7\d{2}/.test(name)) return 'Adreno 7xx';
  if (/mali-g\d{2}/.test(name)) return 'Valhall / Immortalis';

  return 'Universal Architecture';
}

export async function detectGpuHardware(): Promise<GpuDetectionResult> {
  let rawGpuName = '';
  let vendor = 'Unknown';
  let architecture = 'Unknown';
  let driverInfo = '';
  let isFallback = false;
  let isIntegrated = false;
  let isLowEnd = false;
  let isWebGPU = false;
  let renderApi = 'WebGL 2.0';
  let reason = '';
  let maxStorageBufferMB: number | undefined = undefined;
  let maxTextureSize: number | undefined = undefined;

  const os = detectOperatingSystem();
  const deviceMemory = typeof navigator !== 'undefined' && 'deviceMemory' in navigator 
    ? (navigator as any).deviceMemory 
    : undefined;
  const hardwareConcurrency = typeof navigator !== 'undefined' ? navigator.hardwareConcurrency : undefined;

  // 1. Primary inspection via WebGPU adapter info (if navigator.gpu is available)
  if (typeof navigator !== 'undefined' && 'gpu' in navigator && (navigator as any).gpu) {
    try {
      const gpu = (navigator as any).gpu;
      const adapter = await gpu.requestAdapter({ powerPreference: 'high-performance' });
      if (adapter) {
        isWebGPU = true;
        renderApi = 'WebGPU (Dawn Hardware Pipeline)';

        // Inspect adapter info
        let info: any = adapter.info;
        if (!info && typeof (adapter as any).requestAdapterInfo === 'function') {
          try {
            info = await (adapter as any).requestAdapterInfo();
          } catch (e) {}
        }

        if (info) {
          vendor = info.vendor || vendor;
          architecture = info.architecture || architecture;
          driverInfo = info.driver || info.description || '';
          const desc = info.description || info.device || '';

          if (desc && desc !== '0x0') {
            rawGpuName = desc;
          } else if (info.architecture && info.vendor) {
            rawGpuName = `${info.vendor} ${info.architecture}`;
          }

          if (info.isFallbackAdapter || (adapter as any).isFallbackAdapter) {
            isFallback = true;
          }
        }

        // Query precise WebGPU limits
        const limits = adapter.limits;
        if (limits) {
          if (limits.maxStorageBufferBindingSize) {
            maxStorageBufferMB = Math.round(limits.maxStorageBufferBindingSize / (1024 * 1024));
            if (limits.maxStorageBufferBindingSize <= 134217728) {
              isLowEnd = true;
              reason = 'Limited WebGPU buffer binding capacity (≤128MB)';
            }
          }
          if (limits.maxTextureDimension2D) {
            maxTextureSize = limits.maxTextureDimension2D;
          }
        }
      }
    } catch (err) {
      console.warn('[HardwareDetector] WebGPU inspection notice:', err);
    }
  }

  // 2. Supplementary / Fallback inspection via WebGL unmasked renderer
  try {
    const canvas = document.createElement('canvas');
    const gl = (canvas.getContext('webgl2') || canvas.getContext('webgl')) as WebGLRenderingContext | null;
    if (gl) {
      if (!isWebGPU) {
        renderApi = gl instanceof (window as any).WebGL2RenderingContext ? 'WebGL 2.0' : 'WebGL 1.0';
      }

      if (!maxTextureSize) {
        maxTextureSize = gl.getParameter(gl.MAX_TEXTURE_SIZE);
      }

      const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
      if (debugInfo) {
        const unmaskedRenderer = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL);
        const unmaskedVendor = gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL);

        if (unmaskedRenderer && (!rawGpuName || rawGpuName.length < 5 || /generic/i.test(rawGpuName))) {
          rawGpuName = unmaskedRenderer;
        }
        if (unmaskedVendor && (vendor === 'Unknown' || vendor.length === 0)) {
          vendor = unmaskedVendor;
        }

        // Parse render API driver details from ANGLE / Mesa if in WebGL mode
        if (!isWebGPU && unmaskedRenderer) {
          if (/direct3d11/i.test(unmaskedRenderer)) renderApi = 'WebGL 2.0 (ANGLE D3D11)';
          else if (/direct3d12/i.test(unmaskedRenderer)) renderApi = 'WebGL 2.0 (ANGLE D3D12)';
          else if (/metal/i.test(unmaskedRenderer)) renderApi = 'WebGL 2.0 (Metal)';
          else if (/vulkan/i.test(unmaskedRenderer)) renderApi = 'WebGL 2.0 (Vulkan / ANGLE)';
          else if (/mesa/i.test(unmaskedRenderer)) renderApi = 'WebGL 2.0 (Mesa / Linux)';
          else if (/opengl/i.test(unmaskedRenderer)) renderApi = 'WebGL 2.0 (OpenGL Core)';
        }
      }
    }
  } catch (e) {}

  // 3. Sanitize and format GPU name cleanly
  let cleanGpuName = sanitizeGpuString(rawGpuName);

  // If still empty or generic, build from vendor and architecture
  if (!cleanGpuName || cleanGpuName === 'Generic GPU Adapter' || cleanGpuName === 'Unknown') {
    if (vendor !== 'Unknown' && architecture !== 'Unknown') {
      cleanGpuName = `${vendor.toUpperCase()} (${architecture})`;
    } else if (os.includes('Apple Silicon')) {
      cleanGpuName = 'Apple Silicon Unified GPU';
      vendor = 'Apple';
    } else {
      cleanGpuName = 'Standard Dedicated/Integrated GPU Adapter';
    }
  }

  // Format vendor if raw
  if (vendor === 'Unknown' || !vendor) {
    if (/nvidia/i.test(cleanGpuName)) vendor = 'NVIDIA';
    else if (/amd|radeon/i.test(cleanGpuName)) vendor = 'AMD';
    else if (/intel/i.test(cleanGpuName)) vendor = 'Intel';
    else if (/apple/i.test(cleanGpuName)) vendor = 'Apple';
    else if (/google|swiftshader/i.test(cleanGpuName)) vendor = 'Google (CPU Emulation)';
    else if (/qualcomm|adreno/i.test(cleanGpuName)) vendor = 'Qualcomm';
    else if (/arm|mali/i.test(cleanGpuName)) vendor = 'ARM';
  }

  // Infer architecture if unknown or generic
  if (architecture === 'Unknown' || architecture === 'Generic' || !architecture) {
    architecture = inferGpuArchitecture(cleanGpuName, vendor);
  }

  const combinedString = `${cleanGpuName} ${vendor} ${architecture}`.toLowerCase();

  // 4. Classify hardware tier based on signature patterns
  if (isFallback || /swiftshader|llvmpipe|softpipe|warp|microsoft basic|virgl|vbox/i.test(combinedString)) {
    isFallback = true;
    isLowEnd = true;
    reason = 'Software CPU-emulated fallback adapter detected';
  } else {
    for (const pattern of LOW_END_PATTERNS) {
      if (pattern.test(combinedString)) {
        isLowEnd = true;
        break;
      }
    }

    for (const kw of INTEGRATED_KEYWORDS) {
      if (combinedString.includes(kw)) {
        isIntegrated = true;
        isLowEnd = true;
        break;
      }
    }
  }

  // 5. Memory / core constraint heuristic
  if (!isLowEnd) {
    if (deviceMemory !== undefined && deviceMemory <= 4) {
      isLowEnd = true;
      reason = reason || `Host System RAM constrained (≤${deviceMemory} GB)`;
    } else if (hardwareConcurrency !== undefined && hardwareConcurrency <= 4) {
      isLowEnd = true;
      reason = reason || `Host CPU threads constrained (${hardwareConcurrency} cores)`;
    }
  }

  if (isLowEnd && !reason) {
    if (isIntegrated) {
      reason = 'Integrated GPU architecture detected (Shared VRAM)';
    } else {
      reason = 'Power-constrained or legacy GPU detected';
    }
  }

  return {
    isDetected: true,
    gpuName: cleanGpuName || 'Standard GPU Adapter',
    vendor: vendor || 'Generic',
    architecture: architecture || 'Universal Architecture',
    driverInfo: driverInfo ? sanitizeGpuString(driverInfo) : undefined,
    os,
    renderApi,
    maxStorageBufferMB,
    maxTextureSize,
    isLowEndOrIntegrated: isLowEnd,
    isIntegrated,
    isFallback,
    isWebGPU,
    reason: reason || 'Optimal dedicated hardware pipeline verified',
    deviceMemory,
    hardwareConcurrency,
  };
}
