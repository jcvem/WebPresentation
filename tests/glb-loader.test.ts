import { describe, it, expect } from 'vitest';
import { parseGLB } from '../src/renderer/glb-loader';

/**
 * Utility to construct a well-formed binary glTF 2.0 (.glb) ArrayBuffer in memory.
 */
function createSyntheticGLB(jsonObj: any, binBytes: Uint8Array): ArrayBuffer {
  const jsonStr = JSON.stringify(jsonObj);
  const jsonBytes = new TextEncoder().encode(jsonStr);
  const jsonPadding = (4 - (jsonBytes.length % 4)) % 4;
  const jsonChunkLen = jsonBytes.length + jsonPadding;

  const binPadding = (4 - (binBytes.length % 4)) % 4;
  const binChunkLen = binBytes.length + binPadding;

  const totalLen = 12 + 8 + jsonChunkLen + (binChunkLen > 0 ? 8 + binChunkLen : 0);
  const buffer = new ArrayBuffer(totalLen);
  const view = new DataView(buffer);
  const u8 = new Uint8Array(buffer);

  // 12-byte Header
  view.setUint32(0, 0x46546c67, true); // 'glTF'
  view.setUint32(4, 2, true);          // Version 2
  view.setUint32(8, totalLen, true);   // Total file size

  // Chunk 0: JSON
  view.setUint32(12, jsonChunkLen, true);
  view.setUint32(16, 0x4e4f534a, true); // 'JSON'
  u8.set(jsonBytes, 20);
  for (let i = 0; i < jsonPadding; i++) {
    u8[20 + jsonBytes.length + i] = 0x20; // 0x20 spaces per glTF spec
  }

  // Chunk 1: BIN (if present)
  if (binChunkLen > 0) {
    const binOffset = 20 + jsonChunkLen;
    view.setUint32(binOffset, binChunkLen, true);
    view.setUint32(binOffset + 4, 0x004e4942, true); // 'BIN\0'
    u8.set(binBytes, binOffset + 8);
    for (let i = 0; i < binPadding; i++) {
      u8[binOffset + 8 + binBytes.length + i] = 0;
    }
  }

  return buffer;
}

describe('glTF 2.0 Binary (.glb) Loader', () => {
  it('should parse a minimal indexed GLB triangle mesh', () => {
    // 3 vertices: (0, 1, 0), (-1, -1, 0), (1, -1, 0)
    const positions = new Float32Array([
      0.0, 1.0, 0.0,
      -1.0, -1.0, 0.0,
      1.0, -1.0, 0.0
    ]);
    const indices = new Uint16Array([0, 1, 2]);

    const binBuffer = new Uint8Array(positions.byteLength + indices.byteLength);
    binBuffer.set(new Uint8Array(positions.buffer), 0);
    binBuffer.set(new Uint8Array(indices.buffer), positions.byteLength);

    const gltfJson = {
      asset: { version: '2.0' },
      buffers: [{ byteLength: binBuffer.byteLength }],
      bufferViews: [
        { buffer: 0, byteOffset: 0, byteLength: positions.byteLength },
        { buffer: 0, byteOffset: positions.byteLength, byteLength: indices.byteLength }
      ],
      accessors: [
        {
          bufferView: 0,
          byteOffset: 0,
          componentType: 5126, // FLOAT
          count: 3,
          type: 'VEC3'
        },
        {
          bufferView: 1,
          byteOffset: 0,
          componentType: 5123, // UNSIGNED_SHORT
          count: 3,
          type: 'SCALAR'
        }
      ],
      meshes: [
        {
          name: 'SingleTriangle',
          primitives: [
            {
              attributes: { POSITION: 0 },
              indices: 1,
              mode: 4 // TRIANGLES
            }
          ]
        }
      ]
    };

    const glbBuffer = createSyntheticGLB(gltfJson, binBuffer);
    const result = parseGLB(glbBuffer, 'triangle.glb');

    expect(result.name).toBe('triangle');
    expect(result.vertexCount).toBe(3);
    expect(result.triangleCount).toBe(1);
    expect(result.mesh.positions.length).toBe(9);
    expect(result.mesh.normals.length).toBe(9);
    expect(result.mesh.colors.length).toBe(9);
    expect(result.mesh.indices.length).toBe(3);

    // Auto-centering verification: center of triangle should be centered at (0, 0, 0)
    let minX = Infinity, maxX = -Infinity;
    for (let i = 0; i < result.mesh.positions.length; i += 3) {
      const x = result.mesh.positions[i];
      if (x < minX) minX = x;
      if (x > maxX) maxX = x;
    }
    const cx = (minX + maxX) / 2;
    expect(Math.abs(cx)).toBeLessThan(0.01);
  });

  it('should parse non-indexed GLB meshes and generate sequential indices', () => {
    // 3 vertices forming 1 triangle without indices accessor
    const positions = new Float32Array([
      0.0, 2.0, 0.0,
      -2.0, -1.0, 0.0,
      2.0, -1.0, 0.0
    ]);
    const binBuffer = new Uint8Array(positions.buffer);

    const gltfJson = {
      asset: { version: '2.0' },
      buffers: [{ byteLength: binBuffer.byteLength }],
      bufferViews: [
        { buffer: 0, byteOffset: 0, byteLength: positions.byteLength }
      ],
      accessors: [
        {
          bufferView: 0,
          byteOffset: 0,
          componentType: 5126,
          count: 3,
          type: 'VEC3'
        }
      ],
      meshes: [
        {
          name: 'NonIndexedMesh',
          primitives: [
            {
              attributes: { POSITION: 0 }
            }
          ]
        }
      ]
    };

    const glbBuffer = createSyntheticGLB(gltfJson, binBuffer);
    const result = parseGLB(glbBuffer, 'non_indexed.glb');

    expect(result.vertexCount).toBe(3);
    expect(result.triangleCount).toBe(1);
    expect(result.mesh.indices[0]).toBe(0);
    expect(result.mesh.indices[1]).toBe(1);
    expect(result.mesh.indices[2]).toBe(2);
  });

  it('should parse provided NORMAL and COLOR_0 vertex attributes when present', () => {
    const positions = new Float32Array([
      0.0, 1.0, 0.0,
      -1.0, -1.0, 0.0,
      1.0, -1.0, 0.0
    ]);
    const normals = new Float32Array([
      0.0, 0.0, 1.0,
      0.0, 0.0, 1.0,
      0.0, 0.0, 1.0
    ]);
    const colors = new Float32Array([
      1.0, 0.5, 0.2,
      1.0, 0.5, 0.2,
      1.0, 0.5, 0.2
    ]);

    const totalBinBytes = positions.byteLength + normals.byteLength + colors.byteLength;
    const binBuffer = new Uint8Array(totalBinBytes);
    binBuffer.set(new Uint8Array(positions.buffer), 0);
    binBuffer.set(new Uint8Array(normals.buffer), positions.byteLength);
    binBuffer.set(new Uint8Array(colors.buffer), positions.byteLength + normals.byteLength);

    const gltfJson = {
      asset: { version: '2.0' },
      buffers: [{ byteLength: totalBinBytes }],
      bufferViews: [
        { buffer: 0, byteOffset: 0, byteLength: positions.byteLength },
        { buffer: 0, byteOffset: positions.byteLength, byteLength: normals.byteLength },
        { buffer: 0, byteOffset: positions.byteLength + normals.byteLength, byteLength: colors.byteLength }
      ],
      accessors: [
        { bufferView: 0, byteOffset: 0, componentType: 5126, count: 3, type: 'VEC3' },
        { bufferView: 1, byteOffset: 0, componentType: 5126, count: 3, type: 'VEC3' },
        { bufferView: 2, byteOffset: 0, componentType: 5126, count: 3, type: 'VEC3' }
      ],
      meshes: [
        {
          name: 'ColoredMesh',
          primitives: [
            {
              attributes: { POSITION: 0, NORMAL: 1, COLOR_0: 2 }
            }
          ]
        }
      ]
    };

    const glbBuffer = createSyntheticGLB(gltfJson, binBuffer);
    const result = parseGLB(glbBuffer, 'colored.glb');

    expect(result.mesh.normals[2]).toBe(1.0); // Z-axis normal preserved
    expect(result.mesh.colors[0]).toBeCloseTo(1.0);
    expect(result.mesh.colors[1]).toBeCloseTo(0.5);
    expect(result.mesh.colors[2]).toBeCloseTo(0.2);
  });

  it('should throw an error on invalid or truncated headers', () => {
    // Too short buffer
    expect(() => parseGLB(new ArrayBuffer(8), 'short.glb')).toThrow(/too short/);

    // Corrupted magic
    const invalidMagic = new ArrayBuffer(16);
    new DataView(invalidMagic).setUint32(0, 0x12345678, true);
    expect(() => parseGLB(invalidMagic, 'bad_magic.glb')).toThrow(/magic header mismatch/);

    // Unsupported version
    const badVersion = new ArrayBuffer(16);
    const view = new DataView(badVersion);
    view.setUint32(0, 0x46546c67, true);
    view.setUint32(4, 1, true); // Version 1
    expect(() => parseGLB(badVersion, 'bad_ver.glb')).toThrow(/Unsupported glTF version/);
  });
});
