// Default 3D Model Loader: Triple-Twist Möbius Strip (.glb)
import defaultGlbUrl from '../../triple_twist_mobius_strip.glb?url';
import { parseGLB, GLBParseResult } from './glb-loader';
import { GeometryPalette } from './geometry';
import { createMobiusStripPreset } from './obj-loader';

let cachedGlbBuffer: ArrayBuffer | null = null;

export const DEFAULT_MODEL_NAME = 'Triple-Twist Möbius Strip';

/**
 * Loads and parses the default triple_twist_mobius_strip.glb model.
 * Caches the raw binary buffer so subsequent theme palette switches re-shade instantly.
 */
export async function loadDefaultMobiusModel(palette?: GeometryPalette): Promise<GLBParseResult> {
  if (cachedGlbBuffer) {
    return parseGLB(cachedGlbBuffer, DEFAULT_MODEL_NAME, palette);
  }

  // 1. Try fetching via Vite asset URL
  try {
    const response = await fetch(defaultGlbUrl);
    if (response.ok) {
      const buf = await response.arrayBuffer();
      cachedGlbBuffer = buf;
      return parseGLB(buf, DEFAULT_MODEL_NAME, palette);
    }
  } catch (err) {
    // Continue to next strategy
  }

  // 2. Try fetching from root path if available
  if (typeof window !== 'undefined') {
    try {
      const resp = await fetch('/triple_twist_mobius_strip.glb');
      if (resp.ok) {
        const buf = await resp.arrayBuffer();
        cachedGlbBuffer = buf;
        return parseGLB(buf, DEFAULT_MODEL_NAME, palette);
      }
    } catch (err) {
      // Continue to next strategy
    }
  }

  // 3. Node.js environment fallback (for Vitest test suites)
  if (typeof process !== 'undefined' && (process as any).versions?.node) {
    try {
      const fs = await import('node:fs');
      const path = await import('node:path');
      const possiblePaths = [
        path.resolve(process.cwd(), 'triple_twist_mobius_strip.glb'),
        path.resolve(process.cwd(), '../triple_twist_mobius_strip.glb')
      ];
      for (const p of possiblePaths) {
        if (fs.existsSync(p)) {
          const fileBuf = fs.readFileSync(p);
          const buf = fileBuf.buffer.slice(fileBuf.byteOffset, fileBuf.byteOffset + fileBuf.byteLength);
          cachedGlbBuffer = buf;
          return parseGLB(buf, DEFAULT_MODEL_NAME, palette);
        }
      }
    } catch (err) {
      // Fall through to procedural
    }
  }

  // 4. Procedural fallback if binary file is unreachable
  const fallbackMesh = createMobiusStripPreset(palette);
  return {
    mesh: fallbackMesh,
    vertexCount: fallbackMesh.positions.length / 3,
    triangleCount: fallbackMesh.indices.length / 3,
    name: DEFAULT_MODEL_NAME
  };
}

export function getCachedDefaultModelBuffer(): ArrayBuffer | null {
  return cachedGlbBuffer;
}
