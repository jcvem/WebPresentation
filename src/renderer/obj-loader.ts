// Zero-dependency Wavefront OBJ Parser & Procedural 3D Mesh Presets
import { MeshData } from './geometry';

export interface OBJParseResult {
  mesh: MeshData;
  vertexCount: number;
  triangleCount: number;
  name: string;
}

/**
 * Parses Wavefront .obj text format into WebGL-ready MeshData.
 * Auto-centers the geometry, normalizes bounding scale, and computes normals if absent.
 */
export function parseOBJ(objText: string, modelName: string = 'Custom Model'): OBJParseResult {
  const rawPositions: [number, number, number][] = [];
  const rawNormals: [number, number, number][] = [];

  interface VertexKey {
    vIdx: number;
    vnIdx: number;
  }

  const faceTriangles: [VertexKey, VertexKey, VertexKey][] = [];

  const lines = objText.split(/\r?\n/);

  for (let line of lines) {
    line = line.trim();
    if (!line || line.startsWith('#')) continue;

    const parts = line.split(/\s+/);
    const type = parts[0];

    if (type === 'v' && parts.length >= 4) {
      const x = parseFloat(parts[1]);
      const y = parseFloat(parts[2]);
      const z = parseFloat(parts[3]);
      if (!isNaN(x) && !isNaN(y) && !isNaN(z)) {
        rawPositions.push([x, y, z]);
      }
    } else if (type === 'vn' && parts.length >= 4) {
      const nx = parseFloat(parts[1]);
      const ny = parseFloat(parts[2]);
      const nz = parseFloat(parts[3]);
      if (!isNaN(nx) && !isNaN(ny) && !isNaN(nz)) {
        rawNormals.push([nx, ny, nz]);
      }
    } else if (type === 'f' && parts.length >= 4) {
      // Parse face vertices (triangles, quads, n-gons)
      const faceVertices: VertexKey[] = [];
      for (let i = 1; i < parts.length; i++) {
        const seg = parts[i];
        if (!seg) continue;
        const sub = seg.split('/');
        let vIdx = parseInt(sub[0], 10);
        let vnIdx = sub.length >= 3 && sub[2] ? parseInt(sub[2], 10) : 0;

        // Support 1-based and relative negative indices
        if (vIdx < 0) vIdx = rawPositions.length + vIdx + 1;
        if (vnIdx < 0) vnIdx = rawNormals.length + vnIdx + 1;

        if (!isNaN(vIdx) && vIdx > 0 && vIdx <= rawPositions.length) {
          faceVertices.push({ vIdx: vIdx - 1, vnIdx: vnIdx > 0 ? vnIdx - 1 : -1 });
        }
      }

      // Fan triangulate polygon
      if (faceVertices.length >= 3) {
        for (let j = 1; j < faceVertices.length - 1; j++) {
          faceTriangles.push([faceVertices[0], faceVertices[j], faceVertices[j + 1]]);
        }
      }
    }
  }

  if (rawPositions.length === 0 || faceTriangles.length === 0) {
    throw new Error('Invalid OBJ file: No vertices or face polygons found.');
  }

  // 1. Calculate Bounding Box and Center
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

  // Maximum distance from center
  let maxDist = 0;
  for (const [x, y, z] of rawPositions) {
    const dist = Math.hypot(x - cx, y - cy, z - cz);
    if (dist > maxDist) maxDist = dist;
  }

  const scaleFactor = maxDist > 0.0001 ? 1.25 / maxDist : 1.0;

  // Center and scale positions
  const normalizedPositions: [number, number, number][] = rawPositions.map(([x, y, z]) => [
    (x - cx) * scaleFactor,
    (y - cy) * scaleFactor,
    (z - cz) * scaleFactor
  ]);

  // 2. Compute Face Normals if vertex normals are missing
  const hasNormals = rawNormals.length > 0;
  const vertexNormalsAccum: [number, number, number][] = normalizedPositions.map(() => [0, 0, 0]);

  if (!hasNormals) {
    for (const [v0, v1, v2] of faceTriangles) {
      const p0 = normalizedPositions[v0.vIdx];
      const p1 = normalizedPositions[v1.vIdx];
      const p2 = normalizedPositions[v2.vIdx];

      // Edge vectors
      const ax = p1[0] - p0[0], ay = p1[1] - p0[1], az = p1[2] - p0[2];
      const bx = p2[0] - p0[0], by = p2[1] - p0[1], bz = p2[2] - p0[2];

      // Cross product
      const nx = ay * bz - az * by;
      const ny = az * bx - ax * bz;
      const nz = ax * by - ay * bx;

      for (const vKey of [v0, v1, v2]) {
        const norm = vertexNormalsAccum[vKey.vIdx];
        norm[0] += nx;
        norm[1] += ny;
        norm[2] += nz;
      }
    }

    // Normalize accumulated normals
    for (const norm of vertexNormalsAccum) {
      const len = Math.hypot(norm[0], norm[1], norm[2]);
      if (len > 0.0001) {
        norm[0] /= len;
        norm[1] /= len;
        norm[2] /= len;
      } else {
        norm[1] = 1.0; // default up vector
      }
    }
  }

  // 3. Assemble indexed mesh data
  const finalPositions: number[] = [];
  const finalNormals: number[] = [];
  const finalColors: number[] = [];
  const finalIndices: number[] = [];

  const vertexMap = new Map<string, number>();

  for (const tri of faceTriangles) {
    for (const vKey of tri) {
      const key = `${vKey.vIdx}_${vKey.vnIdx}`;
      let idx = vertexMap.get(key);

      if (idx === undefined) {
        idx = finalPositions.length / 3;
        vertexMap.set(key, idx);

        const pos = normalizedPositions[vKey.vIdx];
        finalPositions.push(pos[0], pos[1], pos[2]);

        if (hasNormals && vKey.vnIdx >= 0 && vKey.vnIdx < rawNormals.length) {
          const norm = rawNormals[vKey.vnIdx];
          finalNormals.push(norm[0], norm[1], norm[2]);
        } else {
          const norm = vertexNormalsAccum[vKey.vIdx];
          finalNormals.push(norm[0], norm[1], norm[2]);
        }

        // Monograph editorial palette shading:
        // Base graphite titanium with subtle cadmium accents on highlights
        const heightRatio = (pos[1] + 1.25) / 2.5;
        const isAccent = Math.abs(pos[0]) > 0.7 && Math.abs(pos[2]) > 0.5;

        if (isAccent) {
          finalColors.push(0.88, 0.35, 0.21); // Warm cadmium accent
        } else {
          const brightness = 0.20 + 0.35 * Math.max(0, Math.min(1, heightRatio));
          finalColors.push(brightness, brightness * 1.05, brightness * 1.15); // Titanium / chalk
        }
      }

      finalIndices.push(idx);
    }
  }

  // Cap indices to Uint16Array if within 65535, or slice
  return {
    mesh: {
      positions: new Float32Array(finalPositions),
      normals: new Float32Array(finalNormals),
      colors: new Float32Array(finalColors),
      indices: new Uint16Array(finalIndices)
    },
    vertexCount: finalPositions.length / 3,
    triangleCount: finalIndices.length / 3,
    name: modelName
  };
}

/**
 * Creates a faceted Icosahedron Prism Preset.
 */
export function createIcosahedronPreset(): MeshData {
  const phi = (1 + Math.sqrt(5)) / 2;
  const radius = 1.15;
  const scale = radius / Math.hypot(1, phi, 0);

  const rawVerts: [number, number, number][] = [
    [-1, phi, 0], [1, phi, 0], [-1, -phi, 0], [1, -phi, 0],
    [0, -1, phi], [0, 1, phi], [0, -1, -phi], [0, 1, -phi],
    [phi, 0, -1], [phi, 0, 1], [-phi, 0, -1], [-phi, 0, 1]
  ].map(([x, y, z]) => [x * scale, y * scale, z * scale]);

  const rawFaces: [number, number, number][] = [
    [0, 11, 5], [0, 5, 1], [0, 1, 7], [0, 7, 10], [0, 10, 11],
    [1, 5, 9], [5, 11, 4], [11, 10, 2], [10, 7, 6], [7, 1, 8],
    [3, 9, 4], [3, 4, 2], [3, 2, 6], [3, 6, 8], [3, 8, 9],
    [4, 9, 5], [2, 4, 11], [6, 2, 10], [8, 6, 7], [9, 8, 1]
  ];

  const positions: number[] = [];
  const normals: number[] = [];
  const colors: number[] = [];
  const indices: number[] = [];

  for (let i = 0; i < rawFaces.length; i++) {
    const [i0, i1, i2] = rawFaces[i];
    const p0 = rawVerts[i0], p1 = rawVerts[i1], p2 = rawVerts[i2];

    const ax = p1[0] - p0[0], ay = p1[1] - p0[1], az = p1[2] - p0[2];
    const bx = p2[0] - p0[0], by = p2[1] - p0[1], bz = p2[2] - p0[2];
    let nx = ay * bz - az * by;
    let ny = az * bx - ax * bz;
    let nz = ax * by - ay * bx;
    const len = Math.hypot(nx, ny, nz) || 1;
    nx /= len; ny /= len; nz /= len;

    const baseIdx = positions.length / 3;
    const isAccentFace = i % 4 === 0;
    const color = isAccentFace ? [0.88, 0.35, 0.21] : (i % 2 === 0 ? [0.65, 0.68, 0.74] : [0.25, 0.28, 0.34]);

    for (const p of [p0, p1, p2]) {
      positions.push(p[0], p[1], p[2]);
      normals.push(nx, ny, nz);
      colors.push(color[0], color[1], color[2]);
    }

    indices.push(baseIdx, baseIdx + 1, baseIdx + 2);
  }

  return {
    positions: new Float32Array(positions),
    normals: new Float32Array(normals),
    colors: new Float32Array(colors),
    indices: new Uint16Array(indices)
  };
}

/**
 * Creates a mathematical Torus Knot (p=2, q=3) Preset.
 */
export function createTorusKnotPreset(): MeshData {
  const tubularSegments = 72;
  const radialSegments = 16;
  const p = 2;
  const q = 3;
  const radius = 0.85;
  const tube = 0.16;

  const positions: number[] = [];
  const normals: number[] = [];
  const colors: number[] = [];
  const indices: number[] = [];

  const getPos = (u: number): [number, number, number] => {
    const theta = u * Math.PI * 2 * p;
    const r = radius * (0.5 * (2 + Math.sin(q * theta / p)));
    return [
      r * Math.cos(theta),
      radius * 0.45 * Math.cos(q * theta / p),
      r * Math.sin(theta)
    ];
  };

  const grid: number[][] = [];

  for (let i = 0; i <= tubularSegments; i++) {
    const u = i / tubularSegments;
    const pCenter = getPos(u);
    const pNext = getPos(u + 0.001);

    // Tangent
    let tx = pNext[0] - pCenter[0];
    let ty = pNext[1] - pCenter[1];
    let tz = pNext[2] - pCenter[2];
    const tLen = Math.hypot(tx, ty, tz) || 1;
    tx /= tLen; ty /= tLen; tz /= tLen;

    // Normal & Binormal
    let nx = -pCenter[2], ny = 0, nz = pCenter[0];
    const nLen = Math.hypot(nx, ny, nz) || 1;
    nx /= nLen; ny /= nLen; nz /= nLen;

    const bx = ty * nz - tz * ny;
    const by = tz * nx - tx * nz;
    const bz = tx * ny - ty * nx;

    const ringIndices: number[] = [];

    for (let j = 0; j <= radialSegments; j++) {
      const v = (j / radialSegments) * Math.PI * 2;
      const cx = -Math.cos(v);
      const cy = Math.sin(v);

      const normX = cx * nx + cy * bx;
      const normY = cx * ny + cy * by;
      const normZ = cx * nz + cy * bz;

      const posX = pCenter[0] + tube * normX;
      const posY = pCenter[1] + tube * normY;
      const posZ = pCenter[2] + tube * normZ;

      const vIdx = positions.length / 3;
      positions.push(posX, posY, posZ);
      normals.push(normX, normY, normZ);

      const isCadmium = i % 18 < 4;
      if (isCadmium) {
        colors.push(0.88, 0.35, 0.21);
      } else {
        const shade = 0.25 + 0.35 * Math.abs(normY);
        colors.push(shade, shade * 1.05, shade * 1.15);
      }

      ringIndices.push(vIdx);
    }
    grid.push(ringIndices);
  }

  for (let i = 0; i < tubularSegments; i++) {
    for (let j = 0; j < radialSegments; j++) {
      const a = grid[i][j];
      const b = grid[i + 1][j];
      const c = grid[i + 1][j + 1];
      const d = grid[i][j + 1];
      indices.push(a, b, d);
      indices.push(b, c, d);
    }
  }

  return {
    positions: new Float32Array(positions),
    normals: new Float32Array(normals),
    colors: new Float32Array(colors),
    indices: new Uint16Array(indices)
  };
}

/**
 * Creates an extruded Möbius Strip (topological half-twist non-orientable ribbon).
 */
export function createMobiusStripPreset(): MeshData {
  const uSegments = 120;
  const vSegments = 8;
  const radius = 1.02;
  const halfWidth = 0.30;
  const halfThick = 0.035;

  const positions: number[] = [];
  const normals: number[] = [];
  const colors: number[] = [];
  const indices: number[] = [];

  // Grid of vertices for top and bottom faces
  const topGrid: number[][] = [];
  const botGrid: number[][] = [];

  for (let i = 0; i <= uSegments; i++) {
    const u = (i / uSegments) * Math.PI * 2;
    const cosU = Math.cos(u);
    const sinU = Math.sin(u);
    const halfU = u / 2;
    const cosHalfU = Math.cos(halfU);
    const sinHalfU = Math.sin(halfU);

    // Orthonormal frame
    // Center of curve
    const cx = radius * cosU;
    const cy = radius * sinU;
    const cz = 0;

    // Width vector W(u)
    const wx = cosHalfU * cosU;
    const wy = cosHalfU * sinU;
    const wz = sinHalfU;

    // Normal vector N(u)
    const nx = -sinHalfU * cosU;
    const ny = -sinHalfU * sinU;
    const nz = cosHalfU;

    const topRow: number[] = [];
    const botRow: number[] = [];

    for (let j = 0; j <= vSegments; j++) {
      const v = -halfWidth + (2 * halfWidth * j) / vSegments;
      const isEdge = j === 0 || j === vSegments;

      // Top vertex
      const topIdx = positions.length / 3;
      positions.push(
        cx + v * wx + halfThick * nx,
        cy + v * wy + halfThick * ny,
        cz + v * wz + halfThick * nz
      );
      normals.push(nx, ny, nz);

      // Cadmium accent along the continuous edge, titanium inside
      if (isEdge) {
        colors.push(0.88, 0.35, 0.21);
      } else {
        const shade = 0.24 + 0.36 * Math.abs(cosHalfU);
        colors.push(shade, shade * 1.05, shade * 1.15);
      }
      topRow.push(topIdx);

      // Bottom vertex
      const botIdx = positions.length / 3;
      positions.push(
        cx + v * wx - halfThick * nx,
        cy + v * wy - halfThick * ny,
        cz + v * wz - halfThick * nz
      );
      normals.push(-nx, -ny, -nz);

      if (isEdge) {
        colors.push(0.88, 0.35, 0.21);
      } else {
        const shade = 0.20 + 0.30 * Math.abs(cosHalfU);
        colors.push(shade, shade * 1.05, shade * 1.15);
      }
      botRow.push(botIdx);
    }

    topGrid.push(topRow);
    botGrid.push(botRow);
  }

  // Connect ribbon faces along u
  for (let i = 0; i < uSegments; i++) {
    const nextI = i + 1;
    const isWrap = nextI === uSegments;

    for (let j = 0; j < vSegments; j++) {
      const jNext = j + 1;

      // Top face
      let t00 = topGrid[i][j];
      let t10 = topGrid[nextI][j];
      let t11 = topGrid[nextI][jNext];
      let t01 = topGrid[i][jNext];

      // If wrapping back to 0, Möbius twist flips top to bottom and flips v indices (vSegments - j)
      if (isWrap) {
        t10 = botGrid[0][vSegments - j];
        t11 = botGrid[0][vSegments - jNext];
      }

      indices.push(t00, t10, t11);
      indices.push(t00, t11, t01);

      // Bottom face
      let b00 = botGrid[i][j];
      let b10 = botGrid[nextI][j];
      let b11 = botGrid[nextI][jNext];
      let b01 = botGrid[i][jNext];

      if (isWrap) {
        b10 = topGrid[0][vSegments - j];
        b11 = topGrid[0][vSegments - jNext];
      }

      indices.push(b00, b11, b10);
      indices.push(b00, b01, b11);
    }

    // Connect side edges (j=0 and j=vSegments)
    // Edge at j=0
    let e0_curr_top = topGrid[i][0];
    let e0_next_top = topGrid[nextI][0];
    let e0_curr_bot = botGrid[i][0];
    let e0_next_bot = botGrid[nextI][0];

    if (isWrap) {
      e0_next_top = botGrid[0][vSegments];
      e0_next_bot = topGrid[0][vSegments];
    }

    indices.push(e0_curr_top, e0_curr_bot, e0_next_top);
    indices.push(e0_curr_bot, e0_next_bot, e0_next_top);

    // Edge at j=vSegments
    let e1_curr_top = topGrid[i][vSegments];
    let e1_next_top = topGrid[nextI][vSegments];
    let e1_curr_bot = botGrid[i][vSegments];
    let e1_next_bot = botGrid[nextI][vSegments];

    if (isWrap) {
      e1_next_top = botGrid[0][0];
      e1_next_bot = topGrid[0][0];
    }

    indices.push(e1_curr_top, e1_next_top, e1_curr_bot);
    indices.push(e1_curr_bot, e1_next_top, e1_next_bot);
  }

  return {
    positions: new Float32Array(positions),
    normals: new Float32Array(normals),
    colors: new Float32Array(colors),
    indices: new Uint16Array(indices)
  };
}
