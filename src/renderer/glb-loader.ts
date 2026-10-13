// Zero-dependency glTF 2.0 Binary (.glb) Parser
import { MeshData } from './geometry';

export interface GLBParseResult {
  mesh: MeshData;
  vertexCount: number;
  triangleCount: number;
  name: string;
}

/**
 * Parses binary glTF 2.0 (.glb) format into WebGL-ready MeshData.
 * Auto-centers geometry, normalizes bounding dimensions, generates normals if absent,
 * and styles with monograph titanium / cadmium accents if vertex colors are not provided.
 */
export function parseGLB(data: ArrayBuffer, modelName: string = 'Custom Model'): GLBParseResult {
  if (data.byteLength < 12) {
    throw new Error('Invalid GLB file: buffer too short for header (minimum 12 bytes).');
  }

  const dataView = new DataView(data);
  const magic = dataView.getUint32(0, true);
  if (magic !== 0x46546c67) { // 'glTF' in little-endian
    throw new Error(`Invalid GLB file: magic header mismatch (0x${magic.toString(16)}).`);
  }

  const version = dataView.getUint32(4, true);
  if (version !== 2) {
    throw new Error(`Unsupported glTF version: ${version}. Only glTF 2.0 is supported.`);
  }

  const totalLength = dataView.getUint32(8, true);
  let byteOffset = 12;

  let jsonText = '';
  let binByteOffset = 0;

  while (byteOffset < totalLength && byteOffset < data.byteLength) {
    if (byteOffset + 8 > data.byteLength) break;
    const chunkLength = dataView.getUint32(byteOffset, true);
    const chunkType = dataView.getUint32(byteOffset + 4, true);
    byteOffset += 8;

    if (chunkType === 0x4e4f534a) { // 'JSON'
      const jsonBytes = new Uint8Array(data, byteOffset, chunkLength);
      jsonText = new TextDecoder('utf-8').decode(jsonBytes);
    } else if (chunkType === 0x004e4942) { // 'BIN\0'
      binByteOffset = byteOffset;
    }
    byteOffset += chunkLength;
  }

  if (!jsonText) {
    throw new Error('Invalid GLB file: missing JSON chunk.');
  }

  let gltf: any;
  try {
    gltf = JSON.parse(jsonText);
  } catch (err: any) {
    throw new Error(`Failed to parse glTF JSON chunk: ${err.message}`);
  }

  function getComponentByteSize(type: number): number {
    switch (type) {
      case 5120: // BYTE
      case 5121: // UNSIGNED_BYTE
        return 1;
      case 5122: // SHORT
      case 5123: // UNSIGNED_SHORT
        return 2;
      case 5125: // UNSIGNED_INT
      case 5126: // FLOAT
        return 4;
      default:
        return 4;
    }
  }

  function getAccessorData(accessorIdx: number): { values: number[]; componentCount: number } | null {
    if (!gltf.accessors || !gltf.accessors[accessorIdx]) return null;
    const accessor = gltf.accessors[accessorIdx];
    const bufferViewIdx = accessor.bufferView ?? -1;
    const bufferView = gltf.bufferViews ? gltf.bufferViews[bufferViewIdx] : null;

    if (!bufferView) {
      return null;
    }

    const typeComponentCounts: Record<string, number> = {
      SCALAR: 1,
      VEC2: 2,
      VEC3: 3,
      VEC4: 4,
      MAT4: 16
    };
    const compCount = typeComponentCounts[accessor.type] || 1;
    const count = accessor.count;
    const componentType = accessor.componentType;

    const viewByteOffset = bufferView.byteOffset || 0;
    const accByteOffset = accessor.byteOffset || 0;
    const startOffset = binByteOffset + viewByteOffset + accByteOffset;
    const byteStride = bufferView.byteStride || 0;

    const values: number[] = [];
    const dv = dataView;

    for (let i = 0; i < count; i++) {
      let elemOffset: number;
      if (byteStride > 0) {
        elemOffset = startOffset + i * byteStride;
      } else {
        const compSize = getComponentByteSize(componentType);
        elemOffset = startOffset + i * compCount * compSize;
      }

      for (let c = 0; c < compCount; c++) {
        const offset = elemOffset + c * getComponentByteSize(componentType);
        if (offset < 0 || offset >= data.byteLength) {
          values.push(0);
          continue;
        }

        switch (componentType) {
          case 5120: // BYTE
            values.push(dv.getInt8(offset));
            break;
          case 5121: // UNSIGNED_BYTE
            values.push(dv.getUint8(offset));
            break;
          case 5122: // SHORT
            values.push(dv.getInt16(offset, true));
            break;
          case 5123: // UNSIGNED_SHORT
            values.push(dv.getUint16(offset, true));
            break;
          case 5125: // UNSIGNED_INT
            values.push(dv.getUint32(offset, true));
            break;
          case 5126: // FLOAT
            values.push(dv.getFloat32(offset, true));
            break;
          default:
            values.push(0);
        }
      }
    }

    return { values, componentCount: compCount };
  }

  const rawPositions: [number, number, number][] = [];
  const rawNormals: [number, number, number][] = [];
  const rawColors: [number, number, number][] = [];
  const rawIndices: number[] = [];

  if (!gltf.meshes || gltf.meshes.length === 0) {
    throw new Error('GLB file contains no 3D mesh definitions.');
  }

  for (const mesh of gltf.meshes) {
    if (!mesh.primitives) continue;
    for (const prim of mesh.primitives) {
      // Default primitive mode is 4 (TRIANGLES)
      const mode = prim.mode !== undefined ? prim.mode : 4;
      if (mode !== 4) {
        continue;
      }

      const posAccessorIdx = prim.attributes?.POSITION;
      if (posAccessorIdx === undefined) continue;

      const posData = getAccessorData(posAccessorIdx);
      if (!posData || posData.values.length === 0) continue;

      const normAccessorIdx = prim.attributes?.NORMAL;
      const normData = normAccessorIdx !== undefined ? getAccessorData(normAccessorIdx) : null;

      const colAccessorIdx = prim.attributes?.COLOR_0;
      const colData = colAccessorIdx !== undefined ? getAccessorData(colAccessorIdx) : null;

      const primVertexStart = rawPositions.length;
      const primVertexCount = Math.floor(posData.values.length / 3);

      for (let i = 0; i < primVertexCount; i++) {
        const px = posData.values[i * 3];
        const py = posData.values[i * 3 + 1];
        const pz = posData.values[i * 3 + 2];
        rawPositions.push([px, py, pz]);

        if (normData && normData.values.length >= (i + 1) * 3) {
          rawNormals.push([
            normData.values[i * 3],
            normData.values[i * 3 + 1],
            normData.values[i * 3 + 2]
          ]);
        }

        if (colData) {
          const cCount = colData.componentCount;
          let r = colData.values[i * cCount];
          let g = colData.values[i * cCount + 1];
          let b = colData.values[i * cCount + 2];
          if (r > 1.0 || g > 1.0 || b > 1.0) {
            r = Math.min(1.0, r / 255.0);
            g = Math.min(1.0, g / 255.0);
            b = Math.min(1.0, b / 255.0);
          }
          rawColors.push([r, g, b]);
        }
      }

      // Read or generate indices
      if (prim.indices !== undefined) {
        const idxData = getAccessorData(prim.indices);
        if (idxData) {
          for (const idx of idxData.values) {
            rawIndices.push(primVertexStart + idx);
          }
        }
      } else {
        // Non-indexed triangles
        for (let i = 0; i < primVertexCount; i++) {
          rawIndices.push(primVertexStart + i);
        }
      }
    }
  }

  if (rawPositions.length === 0 || rawIndices.length === 0) {
    throw new Error('GLB file contains no triangle geometry.');
  }

  // 1. Auto-center and normalize scale
  let minX = Infinity, maxX = -Infinity;
  let minY = Infinity, maxY = -Infinity;
  let minZ = Infinity, maxZ = -Infinity;

  for (const [x, y, z] of rawPositions) {
    if (x < minX) minX = x;
    if (x > maxX) maxX = x;
    if (y < minY) minY = y;
    if (y > maxY) maxY = y;
    if (z < minZ) minZ = z;
    if (z > maxZ) maxZ = z;
  }

  const cx = (minX + maxX) / 2;
  const cy = (minY + maxY) / 2;
  const cz = (minZ + maxZ) / 2;

  let maxDist = 0;
  for (const [x, y, z] of rawPositions) {
    const dist = Math.hypot(x - cx, y - cy, z - cz);
    if (dist > maxDist) maxDist = dist;
  }

  const scaleFactor = maxDist > 0.0001 ? 1.25 / maxDist : 1.0;

  const normalizedPositions: [number, number, number][] = rawPositions.map(([x, y, z]) => [
    (x - cx) * scaleFactor,
    (y - cy) * scaleFactor,
    (z - cz) * scaleFactor
  ]);

  // 2. Normals: use provided vertex normals or compute face normals
  const hasValidNormals = rawNormals.length === rawPositions.length;
  const computedNormals: [number, number, number][] = hasValidNormals
    ? rawNormals
    : normalizedPositions.map(() => [0, 0, 0]);

  if (!hasValidNormals) {
    for (let i = 0; i < rawIndices.length; i += 3) {
      const i0 = rawIndices[i];
      const i1 = rawIndices[i + 1];
      const i2 = rawIndices[i + 2];

      const p0 = normalizedPositions[i0];
      const p1 = normalizedPositions[i1];
      const p2 = normalizedPositions[i2];
      if (!p0 || !p1 || !p2) continue;

      const ax = p1[0] - p0[0], ay = p1[1] - p0[1], az = p1[2] - p0[2];
      const bx = p2[0] - p0[0], by = p2[1] - p0[1], bz = p2[2] - p0[2];

      const nx = ay * bz - az * by;
      const ny = az * bx - ax * bz;
      const nz = ax * by - ay * bx;

      for (const idx of [i0, i1, i2]) {
        computedNormals[idx][0] += nx;
        computedNormals[idx][1] += ny;
        computedNormals[idx][2] += nz;
      }
    }

    for (const norm of computedNormals) {
      const len = Math.hypot(norm[0], norm[1], norm[2]);
      if (len > 0.0001) {
        norm[0] /= len;
        norm[1] /= len;
        norm[2] /= len;
      } else {
        norm[1] = 1.0;
      }
    }
  }

  // 3. Assemble final typed arrays
  const finalPositions: number[] = [];
  const finalNormals: number[] = [];
  const finalColors: number[] = [];

  const hasColors = rawColors.length === rawPositions.length;

  for (let i = 0; i < normalizedPositions.length; i++) {
    const pos = normalizedPositions[i];
    finalPositions.push(pos[0], pos[1], pos[2]);

    const norm = computedNormals[i];
    finalNormals.push(norm[0], norm[1], norm[2]);

    if (hasColors) {
      const col = rawColors[i];
      finalColors.push(col[0], col[1], col[2]);
    } else {
      // Consistent monograph styling: titanium graphite with cadmium accents
      const heightRatio = (pos[1] + 1.25) / 2.5;
      const isAccent = Math.abs(pos[0]) > 0.7 && Math.abs(pos[2]) > 0.5;

      if (isAccent) {
        finalColors.push(0.88, 0.35, 0.21); // Warm cadmium accent
      } else {
        const brightness = 0.20 + 0.35 * Math.max(0, Math.min(1, heightRatio));
        finalColors.push(brightness, brightness * 1.05, brightness * 1.15); // Titanium / chalk
      }
    }
  }

  const useUint32 = normalizedPositions.length > 65535;
  const indicesTyped = useUint32 ? new Uint32Array(rawIndices) : new Uint16Array(rawIndices);

  const cleanName = modelName.replace(/\.[^/.]+$/, '').trim() || 'Custom GLB Model';

  return {
    mesh: {
      positions: new Float32Array(finalPositions),
      normals: new Float32Array(finalNormals),
      colors: new Float32Array(finalColors),
      indices: indicesTyped
    },
    vertexCount: normalizedPositions.length,
    triangleCount: Math.floor(rawIndices.length / 3),
    name: cleanName
  };
}
