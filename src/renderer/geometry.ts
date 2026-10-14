// 3D Geometry generation for the Kinetic Armillary Artifact

export interface MeshData {
  positions: Float32Array;
  normals: Float32Array;
  colors: Float32Array; // RGB 0..1 per vertex
  indices: Uint16Array | Uint32Array;
}

export interface GeometryPalette {
  baseColor?: [number, number, number];
  highlightColor?: [number, number, number];
  accentColor?: [number, number, number];
}

/**
 * Creates an extruded polygonal ring / bezel with chamfered faces.
 */
export function createExtrudedRing(
  innerRadius: number,
  outerRadius: number,
  height: number,
  segments: number = 36,
  accentInterval: number = 6,
  palette?: GeometryPalette
): MeshData {
  const positions: number[] = [];
  const normals: number[] = [];
  const colors: number[] = [];
  const indices: number[] = [];

  const halfH = height / 2;
  const dTheta = (Math.PI * 2) / segments;

  // Base titanium / graphite and accent colors
  const baseColor = palette?.baseColor ?? [0.18, 0.20, 0.23];
  const highlightColor = palette?.highlightColor ?? [0.55, 0.58, 0.64];
  const accentColor = palette?.accentColor ?? [0.88, 0.35, 0.21];

  // Generate vertices:
  // For each segment:
  // Outer face (top & bottom), Inner face (top & bottom), Top face (outer & inner), Bottom face (outer & inner)
  for (let i = 0; i < segments; i++) {
    const theta1 = i * dTheta;
    const theta2 = (i + 1) * dTheta;

    const cos1 = Math.cos(theta1);
    const sin1 = Math.sin(theta1);
    const cos2 = Math.cos(theta2);
    const sin2 = Math.sin(theta2);

    const isAccent = i % accentInterval === 0;
    const segColor = isAccent ? accentColor : (i % 2 === 0 ? highlightColor : baseColor);

    // 1. Top face quad
    // (outer1, halfH), (inner1, halfH), (inner2, halfH), (outer2, halfH)
    const baseIdx = positions.length / 3;

    // Top face
    positions.push(
      outerRadius * cos1, halfH, outerRadius * sin1,
      innerRadius * cos1, halfH, innerRadius * sin1,
      innerRadius * cos2, halfH, innerRadius * sin2,
      outerRadius * cos2, halfH, outerRadius * sin2
    );
    for (let k = 0; k < 4; k++) {
      normals.push(0, 1, 0);
      colors.push(...segColor);
    }
    indices.push(
      baseIdx, baseIdx + 1, baseIdx + 2,
      baseIdx, baseIdx + 2, baseIdx + 3
    );

    // 2. Bottom face quad
    const bIdx = positions.length / 3;
    positions.push(
      outerRadius * cos1, -halfH, outerRadius * sin1,
      outerRadius * cos2, -halfH, outerRadius * sin2,
      innerRadius * cos2, -halfH, innerRadius * sin2,
      innerRadius * cos1, -halfH, innerRadius * sin1
    );
    for (let k = 0; k < 4; k++) {
      normals.push(0, -1, 0);
      colors.push(...baseColor);
    }
    indices.push(
      bIdx, bIdx + 1, bIdx + 2,
      bIdx, bIdx + 2, bIdx + 3
    );

    // 3. Outer cylindrical face
    const oIdx = positions.length / 3;
    const midCos = Math.cos((theta1 + theta2) / 2);
    const midSin = Math.sin((theta1 + theta2) / 2);

    positions.push(
      outerRadius * cos1, -halfH, outerRadius * sin1,
      outerRadius * cos2, -halfH, outerRadius * sin2,
      outerRadius * cos2, halfH, outerRadius * sin2,
      outerRadius * cos1, halfH, outerRadius * sin1
    );
    for (let k = 0; k < 4; k++) {
      normals.push(midCos, 0, midSin);
      colors.push(...(isAccent ? accentColor : baseColor));
    }
    indices.push(
      oIdx, oIdx + 1, oIdx + 2,
      oIdx, oIdx + 2, oIdx + 3
    );

    // 4. Inner cylindrical face
    const inIdx = positions.length / 3;
    positions.push(
      innerRadius * cos1, -halfH, innerRadius * sin1,
      innerRadius * cos1, halfH, innerRadius * sin1,
      innerRadius * cos2, halfH, innerRadius * sin2,
      innerRadius * cos2, -halfH, innerRadius * sin2
    );
    for (let k = 0; k < 4; k++) {
      normals.push(-midCos, 0, -midSin);
      colors.push(...baseColor);
    }
    indices.push(
      inIdx, inIdx + 1, inIdx + 2,
      inIdx, inIdx + 2, inIdx + 3
    );
  }

  return {
    positions: new Float32Array(positions),
    normals: new Float32Array(normals),
    colors: new Float32Array(colors),
    indices: new Uint16Array(indices)
  };
}

/**
 * Creates a faceted crystalline core (split into upper & lower hemispheres with faceted facets).
 */
export function createFacetedCore(
  radius: number = 0.6,
  height: number = 0.9,
  facets: number = 8,
  palette?: GeometryPalette
): {
  upper: MeshData;
  lower: MeshData;
} {
  function buildHemisphere(isUpper: boolean): MeshData {
    const positions: number[] = [];
    const normals: number[] = [];
    const colors: number[] = [];
    const indices: number[] = [];

    const sign = isUpper ? 1 : -1;
    const apexY = sign * height;
    const dTheta = (Math.PI * 2) / facets;

    const baseColor = palette?.baseColor ?? [0.22, 0.24, 0.29];
    const facetColorA = palette?.highlightColor ?? [0.42, 0.45, 0.52];
    const facetColorB = palette?.baseColor ?? [0.28, 0.31, 0.37];
    const accentCap = palette?.accentColor ?? [0.88, 0.35, 0.21];

    // Apex vertex
    // Side triangles to equator
    for (let i = 0; i < facets; i++) {
      const theta1 = i * dTheta;
      const theta2 = (i + 1) * dTheta;

      const x1 = radius * Math.cos(theta1);
      const z1 = radius * Math.sin(theta1);
      const x2 = radius * Math.cos(theta2);
      const z2 = radius * Math.sin(theta2);

      // Compute triangle normal
      const v1x = x1, v1y = -apexY, v1z = z1;
      const v2x = x2, v2y = -apexY, v2z = z2;
      let nx = v1y * v2z - v1z * v2y;
      let ny = v1z * v2x - v1x * v2z;
      let nz = v1x * v2y - v1y * v2x;
      const len = Math.hypot(nx, ny, nz) || 1;
      nx /= len;
      ny /= len;
      nz /= len;
      if (!isUpper) {
        nx = -nx;
        ny = -ny;
        nz = -nz;
      }

      const col = (i % 2 === 0) ? facetColorA : facetColorB;
      const startIdx = positions.length / 3;

      // Triangle: Apex, Base1, Base2
      positions.push(
        0, apexY, 0,
        x1, 0, z1,
        x2, 0, z2
      );

      normals.push(
        nx, ny, nz,
        nx, ny, nz,
        nx, ny, nz
      );

      colors.push(
        ...(i === 0 ? accentCap : col),
        ...col,
        ...col
      );

      if (isUpper) {
        indices.push(startIdx, startIdx + 1, startIdx + 2);
      } else {
        indices.push(startIdx, startIdx + 2, startIdx + 1);
      }

      // Flat equator cap face
      const capIdx = positions.length / 3;
      positions.push(
        0, 0, 0,
        x2, 0, z2,
        x1, 0, z1
      );
      const capNormY = isUpper ? -1 : 1;
      normals.push(
        0, capNormY, 0,
        0, capNormY, 0,
        0, capNormY, 0
      );
      colors.push(
        ...baseColor,
        ...baseColor,
        ...baseColor
      );
      indices.push(capIdx, capIdx + 1, capIdx + 2);
    }

    return {
      positions: new Float32Array(positions),
      normals: new Float32Array(normals),
      colors: new Float32Array(colors),
      indices: new Uint16Array(indices)
    };
  }

  return {
    upper: buildHemisphere(true),
    lower: buildHemisphere(false)
  };
}

/**
 * Creates precision reticle needles and axis markers.
 */
export function createReticlePins(
  length: number = 1.6,
  barRadius: number = 0.02,
  palette?: GeometryPalette
): MeshData {
  const positions: number[] = [];
  const normals: number[] = [];
  const colors: number[] = [];
  const indices: number[] = [];

  const accent = palette?.accentColor ?? [0.88, 0.35, 0.21];
  const pale = palette?.highlightColor ?? [0.70, 0.72, 0.76];

  // Helper to add a rectangular prism bar
  function addBar(from: [number, number, number], to: [number, number, number], col: number[]) {
    const dx = to[0] - from[0];
    const dy = to[1] - from[1];
    const dz = to[2] - from[2];
    const r = barRadius;

    // 8 box vertices around the line segment
    const bIdx = positions.length / 3;

    if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > Math.abs(dz)) {
      // X-aligned bar
      positions.push(
        from[0], -r, -r,  to[0], -r, -r,
        to[0],  r, -r,  from[0],  r, -r,
        from[0], -r,  r,  to[0], -r,  r,
        to[0],  r,  r,  from[0],  r,  r
      );
    } else if (Math.abs(dy) > Math.abs(dx) && Math.abs(dy) > Math.abs(dz)) {
      // Y-aligned bar
      positions.push(
        -r, from[1], -r,   r, from[1], -r,
         r,   to[1], -r,  -r,   to[1], -r,
        -r, from[1],  r,   r, from[1],  r,
         r,   to[1],  r,  -r,   to[1],  r
      );
    } else {
      // Z-aligned bar
      positions.push(
        -r, -r, from[2],   r, -r, from[2],
         r,  r, from[2],  -r,  r, from[2],
        -r, -r,   to[2],   r, -r,   to[2],
         r,  r,   to[2],  -r,  r,   to[2]
      );
    }

    // 8 vertices default normal pointing outward
    for (let i = 0; i < 8; i++) {
      normals.push(0, 1, 0);
      colors.push(...col);
    }

    // 6 faces of box
    const boxFaces = [
      0, 1, 2, 0, 2, 3, // front
      4, 6, 5, 4, 7, 6, // back
      0, 4, 5, 0, 5, 1, // bottom
      3, 2, 6, 3, 6, 7, // top
      0, 3, 7, 0, 7, 4, // left
      1, 5, 6, 1, 6, 2  // right
    ];

    for (const f of boxFaces) {
      indices.push(bIdx + f);
    }
  }

  // Cross axes along X and Z
  addBar([-length, 0, 0], [length, 0, 0], pale);
  addBar([0, 0, -length], [0, 0, length], pale);
  // Vertical spindle axis
  addBar([0, -length * 0.8, 0], [0, length * 0.8, 0], accent);

  // Satellite nodal blocks at the 4 extremities
  const nodeSize = 0.05;
  const tips: [number, number, number][] = [
    [length, 0, 0],
    [-length, 0, 0],
    [0, 0, length],
    [0, 0, -length],
    [0, length * 0.8, 0],
    [0, -length * 0.8, 0]
  ];

  for (const tip of tips) {
    addBar(
      [tip[0] - nodeSize, tip[1] - nodeSize, tip[2] - nodeSize],
      [tip[0] + nodeSize, tip[1] + nodeSize, tip[2] + nodeSize],
      accent
    );
  }

  return {
    positions: new Float32Array(positions),
    normals: new Float32Array(normals),
    colors: new Float32Array(colors),
    indices: new Uint16Array(indices)
  };
}
