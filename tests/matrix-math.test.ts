import { describe, it, expect } from 'vitest';
import {
  createMat4,
  mat4Identity,
  mat4Perspective,
  mat4Translate,
  mat4Scale,
  mat4RotateX,
  mat4RotateY,
  mat4RotateZ,
  lerp,
  clamp
} from '../src/renderer/math';

describe('3D Matrix and Math Operations', () => {
  it('should initialize an identity matrix', () => {
    const m = createMat4();
    expect(m[0]).toBe(1);
    expect(m[5]).toBe(1);
    expect(m[10]).toBe(1);
    expect(m[15]).toBe(1);
    expect(m[1]).toBe(0);
    expect(m[4]).toBe(0);
  });

  it('should reset an existing matrix to identity', () => {
    const m = createMat4();
    m[0] = 5;
    m[3] = 9;
    mat4Identity(m);
    expect(m[0]).toBe(1);
    expect(m[3]).toBe(0);
  });

  it('should compute perspective projection matrix', () => {
    const p = createMat4();
    mat4Perspective(p, Math.PI / 4, 16 / 9, 0.1, 100);
    // Elements should be finite numbers and non-zero on diagonals
    expect(p[0]).toBeGreaterThan(0);
    expect(p[5]).toBeGreaterThan(0);
    expect(p[11]).toBe(-1);
    expect(p[15]).toBe(0);
  });

  it('should apply 3D translation to matrix', () => {
    const m = createMat4();
    mat4Translate(m, m, [2, -3, 5]);
    expect(m[12]).toBe(2);
    expect(m[13]).toBe(-3);
    expect(m[14]).toBe(5);
  });

  it('should apply 3D scaling to matrix', () => {
    const m = createMat4();
    mat4Scale(m, m, [2, 3, 4]);
    expect(m[0]).toBe(2);
    expect(m[5]).toBe(3);
    expect(m[10]).toBe(4);
  });

  it('should apply rotations on X, Y, and Z axes', () => {
    const rx = createMat4();
    mat4RotateX(rx, rx, Math.PI / 2);
    expect(Math.abs(rx[5])).toBeLessThan(0.0001); // cos(pi/2) ~ 0

    const ry = createMat4();
    mat4RotateY(ry, ry, Math.PI);
    expect(Math.round(ry[0])).toBe(-1); // cos(pi) = -1

    const rz = createMat4();
    mat4RotateZ(rz, rz, Math.PI / 2);
    expect(Math.abs(rz[0])).toBeLessThan(0.0001);
  });

  it('should perform linear interpolation (lerp) properly', () => {
    expect(lerp(0, 10, 0.5)).toBe(5);
    expect(lerp(10, 20, 0.25)).toBe(12.5);
    expect(lerp(5, 5, 0.8)).toBe(5);
  });

  it('should clamp values between min and max bounds', () => {
    expect(clamp(5, 0, 10)).toBe(5);
    expect(clamp(-5, 0, 10)).toBe(0);
    expect(clamp(15, 0, 10)).toBe(10);
  });
});
