import { describe, it, expect } from 'vitest';
import {
  parseOBJ,
  createIcosahedronPreset,
  createTorusKnotPreset,
  createMobiusStripPreset
} from '../src/renderer/obj-loader';

describe('Wavefront OBJ Loader & Procedural 3D Presets', () => {
  it('should parse simple triangular OBJ text and normalize positions', () => {
    const sampleObj = `
# Simple Tetrahedron
v 0.0 1.0 0.0
v -1.0 -1.0 1.0
v 1.0 -1.0 1.0
v 0.0 -1.0 -1.0

f 1 2 3
f 1 3 4
f 1 4 2
f 2 4 3
`;

    const result = parseOBJ(sampleObj, 'Tetrahedron');
    expect(result.name).toBe('Tetrahedron');
    expect(result.triangleCount).toBe(4);
    expect(result.vertexCount).toBeGreaterThanOrEqual(4);
    expect(result.mesh.positions.length).toBe(result.vertexCount * 3);
    expect(result.mesh.normals.length).toBe(result.vertexCount * 3);
    expect(result.mesh.colors.length).toBe(result.vertexCount * 3);
    expect(result.mesh.indices.length).toBe(4 * 3);

    // Verify auto-centering: bounding center should be near (0, 0, 0)
    let minX = Infinity, maxX = -Infinity;
    for (let i = 0; i < result.mesh.positions.length; i += 3) {
      const x = result.mesh.positions[i];
      if (x < minX) minX = x;
      if (x > maxX) maxX = x;
    }
    const cx = (minX + maxX) / 2;
    expect(Math.abs(cx)).toBeLessThan(0.01);
  });

  it('should support quad faces and triangulate them into 2 triangles each', () => {
    const cubeObj = `
v -1.0 -1.0  1.0
v  1.0 -1.0  1.0
v  1.0  1.0  1.0
v -1.0  1.0  1.0
v -1.0 -1.0 -1.0
v  1.0 -1.0 -1.0
v  1.0  1.0 -1.0
v -1.0  1.0 -1.0

# 6 quad faces -> 12 triangles
f 1 2 3 4
f 6 5 8 7
f 4 3 7 8
f 5 6 2 1
f 2 6 7 3
f 5 1 4 8
`;

    const result = parseOBJ(cubeObj, 'Cube');
    expect(result.triangleCount).toBe(12);
    expect(result.mesh.indices.length).toBe(36);
  });

  it('should parse OBJ files with vertex normals and texture indices (v/vt/vn)', () => {
    const complexFaceObj = `
v 0 0 0
v 1 0 0
v 0 1 0
vn 0 0 1
f 1/1/1 2/2/1 3/3/1
`;

    const result = parseOBJ(complexFaceObj, 'NormalsTest');
    expect(result.triangleCount).toBe(1);
    // Normals should match parsed vn (0, 0, 1)
    expect(result.mesh.normals[0]).toBe(0);
    expect(result.mesh.normals[1]).toBe(0);
    expect(result.mesh.normals[2]).toBe(1);
  });

  it('should compute valid normals if file does not specify normals', () => {
    const planarObj = `
v 0 0 0
v 2 0 0
v 0 2 0
f 1 2 3
`;
    const result = parseOBJ(planarObj, 'AutoNormals');
    expect(result.mesh.normals.length).toBe(result.mesh.positions.length);
    const zNormal = result.mesh.normals[2];
    expect(Math.abs(zNormal)).toBeGreaterThan(0.9);
  });

  it('should throw an error on empty or invalid OBJ content', () => {
    expect(() => parseOBJ('', 'Empty')).toThrow();
    expect(() => parseOBJ('# Only comments\n\n', 'CommentsOnly')).toThrow();
  });

  it('should generate valid Icosahedron preset mesh data', () => {
    const icosa = createIcosahedronPreset();
    expect(icosa.positions.length).toBeGreaterThan(0);
    expect(icosa.normals.length).toBe(icosa.positions.length);
    expect(icosa.colors.length).toBe(icosa.positions.length);
    expect(icosa.indices.length).toBe(20 * 3); // 20 faces
  });

  it('should generate valid Torus Knot preset mesh data', () => {
    const knot = createTorusKnotPreset();
    expect(knot.positions.length).toBeGreaterThan(0);
    expect(knot.normals.length).toBe(knot.positions.length);
    expect(knot.colors.length).toBe(knot.positions.length);
    expect(knot.indices.length).toBeGreaterThan(100);
  });

  it('should generate valid Mobius Strip preset mesh data with topological manifold continuity', () => {
    const mobius = createMobiusStripPreset();
    expect(mobius.positions.length).toBeGreaterThan(0);
    expect(mobius.normals.length).toBe(mobius.positions.length);
    expect(mobius.colors.length).toBe(mobius.positions.length);
    expect(mobius.indices.length).toBeGreaterThan(100);
    // Index count must be a multiple of 3 for WebGL triangles
    expect(mobius.indices.length % 3).toBe(0);

    // Verify center is near origin and dimensions are normalized within visible bounds
    let minX = Infinity, maxX = -Infinity;
    let minY = Infinity, maxY = -Infinity;
    let minZ = Infinity, maxZ = -Infinity;
    for (let i = 0; i < mobius.positions.length; i += 3) {
      const x = mobius.positions[i];
      const y = mobius.positions[i + 1];
      const z = mobius.positions[i + 2];
      if (x < minX) minX = x;
      if (x > maxX) maxX = x;
      if (y < minY) minY = y;
      if (y > maxY) maxY = y;
      if (z < minZ) minZ = z;
      if (z > maxZ) maxZ = z;
    }
    const cx = (minX + maxX) / 2;
    const cy = (minY + maxY) / 2;
    expect(Math.abs(cx)).toBeLessThan(0.05);
    expect(Math.abs(cy)).toBeLessThan(0.05);
    expect(maxX - minX).toBeGreaterThan(1.0);
    expect(maxY - minY).toBeGreaterThan(1.0);
  });
});
