import {
  Mat4,
  createMat4,
  mat4Perspective,
  mat4Translate,
  mat4Scale,
  mat4RotateX,
  mat4RotateY,
  mat4RotateZ,
  lerp,
  clamp
} from './math';
import {
  createExtrudedRing,
  createFacetedCore,
  createReticlePins,
  MeshData,
  GeometryPalette
} from './geometry';
import { ObjectPose } from '../slides/slide-data';

interface PartBuffer {
  posBuffer: WebGLBuffer;
  normBuffer: WebGLBuffer;
  colBuffer: WebGLBuffer;
  idxBuffer: WebGLBuffer;
  indexCount: number;
  indexType?: number;
}

export class ObjectRenderer {
  private canvas: HTMLCanvasElement;
  private gl: WebGLRenderingContext | null = null;
  private isWebGLSupported: boolean = true;
  private program: WebGLProgram | null = null;

  // Uniform locations
  private uModelLoc: WebGLUniformLocation | null = null;
  private uViewLoc: WebGLUniformLocation | null = null;
  private uProjLoc: WebGLUniformLocation | null = null;
  private uLightDir1Loc: WebGLUniformLocation | null = null;
  private uLightDir2Loc: WebGLUniformLocation | null = null;

  // Attribute locations
  private aPosLoc: number = -1;
  private aNormLoc: number = -1;
  private aColLoc: number = -1;

  // Geometry buffers
  private outerRingBuf: PartBuffer | null = null;
  private gimbalRingBuf: PartBuffer | null = null;
  private coreUpperBuf: PartBuffer | null = null;
  private coreLowerBuf: PartBuffer | null = null;
  private reticleBuf: PartBuffer | null = null;
  private customMeshBuf: PartBuffer | null = null;
  private customModelName: string = 'Triple-Twist Möbius Strip';
  private currentPalette: GeometryPalette = {
    baseColor: [0.18, 0.20, 0.23],
    highlightColor: [0.55, 0.58, 0.64],
    accentColor: [0.88, 0.35, 0.21]
  };

  // Current interpolated state
  private currentPose: ObjectPose;
  private targetPose: ObjectPose;

  // Interactive mouse drag state
  private isDragging = false;
  private dragStartX = 0;
  private dragStartY = 0;
  private dragRotX = 0;
  private dragRotY = 0;

  // Animation & timing
  private rafId: number | null = null;
  private isRunning = false;
  private isReducedMotion = false;
  private idleAngle = 0;
  private lastTime = 0;

  constructor(canvas: HTMLCanvasElement, initialPose: ObjectPose) {
    this.canvas = canvas;
    this.currentPose = { ...initialPose };
    this.targetPose = { ...initialPose };

    this.initWebGL();
    this.setupInteractivity();
    this.handleResize();

    window.addEventListener('resize', this.onResize);
    document.addEventListener('visibilitychange', this.onVisibilityChange);
  }

  private initWebGL(): void {
    const gl = this.canvas.getContext('webgl', {
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance',
      preserveDrawingBuffer: true
    });

    if (!gl) {
      console.warn('WebGL not supported or disabled. Falling back to 2D Canvas rendering.');
      this.isWebGLSupported = false;
      this.canvas.setAttribute('aria-label', 'Static schematic vector diagram of the kinetic armillary artifact');
      return;
    }

    this.gl = gl;
    this.canvas.setAttribute('aria-label', 'Interactive 3D procedural kinetic armillary artifact responding to slide progression');

    // Setup shaders
    const vsSource = `
      attribute vec3 aPosition;
      attribute vec3 aNormal;
      attribute vec3 aColor;

      uniform mat4 uModel;
      uniform mat4 uView;
      uniform mat4 uProj;

      varying vec3 vNormal;
      varying vec3 vPosition;
      varying vec3 vColor;

      void main(void) {
        vec4 worldPos = uModel * vec4(aPosition, 1.0);
        vPosition = worldPos.xyz;
        // Approximation of normal transformation for uniform scales/rotations
        vNormal = normalize((uModel * vec4(aNormal, 0.0)).xyz);
        vColor = aColor;
        gl_Position = uProj * uView * worldPos;
      }
    `;

    const fsSource = `
      precision mediump float;

      varying vec3 vNormal;
      varying vec3 vPosition;
      varying vec3 vColor;

      uniform vec3 uLightDir1;
      uniform vec3 uLightDir2;

      void main(void) {
        vec3 norm = normalize(vNormal);

        // Key light
        float diff1 = max(dot(norm, uLightDir1), 0.0) * 0.75;

        // Subtle fill / rim light
        float diff2 = max(dot(norm, uLightDir2), 0.0) * 0.35;

        // Ambient base
        float ambient = 0.22;

        // Specular highlight
        vec3 viewDir = normalize(vec3(0.0, 0.0, 5.0) - vPosition);
        vec3 halfDir = normalize(uLightDir1 + viewDir);
        float spec = pow(max(dot(norm, halfDir), 0.0), 28.0) * 0.45;

        vec3 lit = (ambient + diff1 + diff2) * vColor + vec3(spec);
        gl_FragColor = vec4(lit, 1.0);
      }
    `;

    const program = this.createProgram(gl, vsSource, fsSource);
    if (!program) {
      this.isWebGLSupported = false;
      return;
    }
    this.program = program;

    // Uniform & attribute locations
    this.uModelLoc = gl.getUniformLocation(program, 'uModel');
    this.uViewLoc = gl.getUniformLocation(program, 'uView');
    this.uProjLoc = gl.getUniformLocation(program, 'uProj');
    this.uLightDir1Loc = gl.getUniformLocation(program, 'uLightDir1');
    this.uLightDir2Loc = gl.getUniformLocation(program, 'uLightDir2');

    this.aPosLoc = gl.getAttribLocation(program, 'aPosition');
    this.aNormLoc = gl.getAttribLocation(program, 'aNormal');
    this.aColLoc = gl.getAttribLocation(program, 'aColor');

    // Create geometries
    this.rebuildDefaultGeometries();

    gl.enable(gl.DEPTH_TEST);
    gl.depthFunc(gl.LEQUAL);
    gl.enable(gl.CULL_FACE);
    gl.cullFace(gl.BACK);
  }

  private createProgram(gl: WebGLRenderingContext, vsSource: string, fsSource: string): WebGLProgram | null {
    const vs = gl.createShader(gl.VERTEX_SHADER)!;
    gl.shaderSource(vs, vsSource);
    gl.compileShader(vs);
    if (!gl.getShaderParameter(vs, gl.COMPILE_STATUS)) {
      console.error('Vertex shader compilation failed:', gl.getShaderInfoLog(vs));
      return null;
    }

    const fs = gl.createShader(gl.FRAGMENT_SHADER)!;
    gl.shaderSource(fs, fsSource);
    gl.compileShader(fs);
    if (!gl.getShaderParameter(fs, gl.COMPILE_STATUS)) {
      console.error('Fragment shader compilation failed:', gl.getShaderInfoLog(fs));
      return null;
    }

    const prog = gl.createProgram()!;
    gl.attachShader(prog, vs);
    gl.attachShader(prog, fs);
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
      console.error('Shader linking failed:', gl.getProgramInfoLog(prog));
      return null;
    }

    return prog;
  }

  private createBuffer(gl: WebGLRenderingContext, mesh: MeshData): PartBuffer {
    const posBuffer = gl.createBuffer()!;
    gl.bindBuffer(gl.ARRAY_BUFFER, posBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, mesh.positions, gl.STATIC_DRAW);

    const normBuffer = gl.createBuffer()!;
    gl.bindBuffer(gl.ARRAY_BUFFER, normBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, mesh.normals, gl.STATIC_DRAW);

    const colBuffer = gl.createBuffer()!;
    gl.bindBuffer(gl.ARRAY_BUFFER, colBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, mesh.colors, gl.STATIC_DRAW);

    const idxBuffer = gl.createBuffer()!;
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, idxBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, mesh.indices, gl.STATIC_DRAW);

    const is32Bit = mesh.indices instanceof Uint32Array;
    const indexType = is32Bit ? (gl.UNSIGNED_INT || 0x1405) : (gl.UNSIGNED_SHORT || 0x1403);
    if (is32Bit && gl.getExtension) {
      gl.getExtension('OES_element_index_uint');
    }

    return {
      posBuffer,
      normBuffer,
      colBuffer,
      idxBuffer,
      indexCount: mesh.indices.length,
      indexType
    };
  }

  private setupInteractivity(): void {
    const onPointerDown = (e: PointerEvent) => {
      this.isDragging = true;
      this.dragStartX = e.clientX;
      this.dragStartY = e.clientY;
      this.canvas.setPointerCapture(e.pointerId);
    };

    const onPointerMove = (e: PointerEvent) => {
      if (!this.isDragging) return;
      const dx = e.clientX - this.dragStartX;
      const dy = e.clientY - this.dragStartY;
      this.dragStartX = e.clientX;
      this.dragStartY = e.clientY;

      this.dragRotY += dx * 0.007;
      this.dragRotX += dy * 0.007;
      this.dragRotX = clamp(this.dragRotX, -1.2, 1.2);
    };

    const onPointerUp = (e: PointerEvent) => {
      this.isDragging = false;
      try {
        this.canvas.releasePointerCapture(e.pointerId);
      } catch {
        // Ignored if capture already released
      }
    };

    this.canvas.addEventListener('pointerdown', onPointerDown);
    this.canvas.addEventListener('pointermove', onPointerMove);
    this.canvas.addEventListener('pointerup', onPointerUp);
    this.canvas.addEventListener('pointercancel', onPointerUp);
  }

  private onResize = (): void => {
    this.handleResize();
  };

  private handleResize(): void {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const rect = this.canvas.getBoundingClientRect();
    const w = Math.max(1, Math.floor(rect.width * dpr));
    const h = Math.max(1, Math.floor(rect.height * dpr));

    if (this.canvas.width !== w || this.canvas.height !== h) {
      this.canvas.width = w;
      this.canvas.height = h;
      if (this.gl) {
        this.gl.viewport(0, 0, w, h);
      }
    }
  }

  private onVisibilityChange = (): void => {
    if (document.hidden) {
      this.stop();
    } else {
      this.start();
    }
  };

  public setPose(target: ObjectPose, immediate: boolean = false): void {
    this.targetPose = { ...target };
    if (immediate || this.isReducedMotion) {
      this.currentPose = { ...target };
    }
  }

  public setReducedMotion(reduced: boolean): void {
    this.isReducedMotion = reduced;
    if (reduced) {
      this.currentPose = { ...this.targetPose };
      this.dragRotX = 0;
      this.dragRotY = 0;
    }
  }

  public start(): void {
    if (this.isRunning) return;
    this.isRunning = true;
    this.lastTime = performance.now();
    this.tick(this.lastTime);
  }

  public stop(): void {
    this.isRunning = false;
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
  }

  private tick = (time: number): void => {
    if (!this.isRunning) return;

    const delta = Math.min((time - this.lastTime) / 1000, 0.1);
    this.lastTime = time;

    // Update smooth transitions
    const lerpFactor = this.isReducedMotion ? 1.0 : clamp(delta * 4.5, 0.05, 0.35);

    this.currentPose.rotX = lerp(this.currentPose.rotX, this.targetPose.rotX, lerpFactor);
    this.currentPose.rotY = lerp(this.currentPose.rotY, this.targetPose.rotY, lerpFactor);
    this.currentPose.rotZ = lerp(this.currentPose.rotZ, this.targetPose.rotZ, lerpFactor);
    this.currentPose.gimbalPitch = lerp(this.currentPose.gimbalPitch, this.targetPose.gimbalPitch, lerpFactor);
    this.currentPose.coreSplit = lerp(this.currentPose.coreSplit, this.targetPose.coreSplit, lerpFactor);
    this.currentPose.explodedDistance = lerp(this.currentPose.explodedDistance, this.targetPose.explodedDistance, lerpFactor);
    this.currentPose.dialAlign = lerp(this.currentPose.dialAlign, this.targetPose.dialAlign, lerpFactor);
    this.currentPose.scale = lerp(this.currentPose.scale, this.targetPose.scale, lerpFactor);

    // Idle rotation progression
    if (!this.isReducedMotion) {
      this.idleAngle += this.targetPose.spinRate;
    }

    // Drag damping back to neutral
    if (!this.isDragging) {
      this.dragRotX *= 0.94;
      this.dragRotY *= 0.94;
    }

    this.render();

    this.rafId = requestAnimationFrame(this.tick);
  };

  private render(): void {
    if (!this.isWebGLSupported || !this.gl || !this.program) {
      this.renderFallback2D();
      return;
    }

    const gl = this.gl;
    gl.clearColor(0.04, 0.04, 0.05, 0.0); // Transparent canvas background
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    gl.useProgram(this.program);

    // Light directions (normalized in JS)
    gl.uniform3f(this.uLightDir1Loc, 0.577, 0.65, 0.49);
    gl.uniform3f(this.uLightDir2Loc, -0.68, -0.34, -0.64);

    const aspect = this.canvas.width / Math.max(1, this.canvas.height);
    const projMatrix = createMat4();
    mat4Perspective(projMatrix, 42 * (Math.PI / 180), aspect, 0.1, 100.0);
    gl.uniformMatrix4fv(this.uProjLoc, false, projMatrix);

    // View matrix: camera placed at [0, 0, 5.2]
    const viewMatrix = createMat4();
    mat4Translate(viewMatrix, viewMatrix, [0, 0, -5.2]);
    gl.uniformMatrix4fv(this.uViewLoc, false, viewMatrix);

    // Base root transform
    const rootMatrix = createMat4();
    mat4Scale(rootMatrix, rootMatrix, [this.currentPose.scale, this.currentPose.scale, this.currentPose.scale]);
    mat4RotateX(rootMatrix, rootMatrix, this.currentPose.rotX + this.dragRotX);
    mat4RotateY(rootMatrix, rootMatrix, this.currentPose.rotY + this.idleAngle + this.dragRotY);
    mat4RotateZ(rootMatrix, rootMatrix, this.currentPose.rotZ);

    // If custom 3D model is active, render it directly
    if (this.customMeshBuf) {
      const customMatrix = createMat4();
      customMatrix.set(rootMatrix);
      this.drawMesh(gl, this.customMeshBuf, customMatrix);
      return;
    }

    // 1. Render Outer Bezel
    // Explodes outwards along radius or tilts when in dial alignment
    const outerMatrix = createMat4();
    outerMatrix.set(rootMatrix);
    const explodeDist = this.currentPose.explodedDistance;
    mat4Scale(outerMatrix, outerMatrix, [1.0 + explodeDist * 0.45, 1.0 + explodeDist * 0.45, 1.0 + explodeDist * 0.1]);
    this.drawMesh(gl, this.outerRingBuf, outerMatrix);

    // 2. Render Gimbal Ring (nested inside, pivots on X axis according to gimbalPitch)
    const gimbalMatrix = createMat4();
    gimbalMatrix.set(rootMatrix);
    mat4Translate(gimbalMatrix, gimbalMatrix, [0, explodeDist * 0.35, 0]);
    mat4RotateX(gimbalMatrix, gimbalMatrix, this.currentPose.gimbalPitch);
    this.drawMesh(gl, this.gimbalRingBuf, gimbalMatrix);

    // 3. Render Faceted Core (Upper hemisphere)
    const upperCoreMatrix = createMat4();
    upperCoreMatrix.set(rootMatrix);
    mat4Translate(upperCoreMatrix, upperCoreMatrix, [0, this.currentPose.coreSplit * 0.6, 0]);
    mat4RotateY(upperCoreMatrix, upperCoreMatrix, -this.idleAngle * 0.5);
    this.drawMesh(gl, this.coreUpperBuf, upperCoreMatrix);

    // 4. Render Faceted Core (Lower hemisphere)
    const lowerCoreMatrix = createMat4();
    lowerCoreMatrix.set(rootMatrix);
    mat4Translate(lowerCoreMatrix, lowerCoreMatrix, [0, -this.currentPose.coreSplit * 0.6, 0]);
    mat4RotateY(lowerCoreMatrix, lowerCoreMatrix, -this.idleAngle * 0.5);
    this.drawMesh(gl, this.coreLowerBuf, lowerCoreMatrix);

    // 5. Render Reticle Needle & Pins (visible especially in dial/application mode)
    const reticleMatrix = createMat4();
    reticleMatrix.set(rootMatrix);
    // Align with dial when dialAlign > 0
    mat4RotateZ(reticleMatrix, reticleMatrix, this.currentPose.dialAlign * (Math.PI / 4));
    this.drawMesh(gl, this.reticleBuf, reticleMatrix);
  }

  private drawMesh(gl: WebGLRenderingContext, part: PartBuffer | null, modelMatrix: Mat4): void {
    if (!part) return;

    gl.uniformMatrix4fv(this.uModelLoc, false, modelMatrix);

    gl.bindBuffer(gl.ARRAY_BUFFER, part.posBuffer);
    gl.enableVertexAttribArray(this.aPosLoc);
    gl.vertexAttribPointer(this.aPosLoc, 3, gl.FLOAT, false, 0, 0);

    gl.bindBuffer(gl.ARRAY_BUFFER, part.normBuffer);
    gl.enableVertexAttribArray(this.aNormLoc);
    gl.vertexAttribPointer(this.aNormLoc, 3, gl.FLOAT, false, 0, 0);

    gl.bindBuffer(gl.ARRAY_BUFFER, part.colBuffer);
    gl.enableVertexAttribArray(this.aColLoc);
    gl.vertexAttribPointer(this.aColLoc, 3, gl.FLOAT, false, 0, 0);

    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, part.idxBuffer);
    gl.drawElements(gl.TRIANGLES, part.indexCount, part.indexType ?? gl.UNSIGNED_SHORT, 0);
  }

  private renderFallback2D(): void {
    const ctx = this.canvas.getContext('2d');
    if (!ctx) return;

    const w = this.canvas.width;
    const h = this.canvas.height;
    ctx.clearRect(0, 0, w, h);

    const cx = w / 2;
    const cy = h / 2;
    const radius = Math.min(w, h) * 0.28 * this.currentPose.scale;

    ctx.save();
    ctx.translate(cx, cy);

    // Draw concentric schematic rings with precision styling
    ctx.strokeStyle = 'rgba(230, 234, 240, 0.45)';
    ctx.lineWidth = 2;

    // Outer ring
    ctx.beginPath();
    ctx.ellipse(0, 0, radius, radius * 0.6, this.currentPose.rotZ, 0, Math.PI * 2);
    ctx.stroke();

    // Middle gimbal
    ctx.strokeStyle = 'rgba(138, 143, 152, 0.5)';
    ctx.beginPath();
    ctx.ellipse(0, 0, radius * 0.72, radius * 0.45, this.currentPose.rotZ + this.currentPose.gimbalPitch, 0, Math.PI * 2);
    ctx.stroke();

    // Core polygon
    ctx.fillStyle = 'rgba(224, 90, 54, 0.15)';
    ctx.strokeStyle = '#e05a36';
    ctx.beginPath();
    const split = this.currentPose.coreSplit * 40;
    ctx.moveTo(0, -radius * 0.45 - split);
    ctx.lineTo(radius * 0.35, -split);
    ctx.lineTo(0, radius * 0.45 + split);
    ctx.lineTo(-radius * 0.35, -split);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Cross reticles
    ctx.strokeStyle = 'rgba(230, 234, 240, 0.25)';
    ctx.beginPath();
    ctx.moveTo(-radius * 1.1, 0);
    ctx.lineTo(radius * 1.1, 0);
    ctx.moveTo(0, -radius * 0.9);
    ctx.lineTo(0, radius * 0.9);
    ctx.stroke();

    ctx.restore();
  }

  public getCanvas(): HTMLCanvasElement {
    return this.canvas;
  }

  public renderFrame(): void {
    this.render();
  }

  public setCustomModel(mesh: MeshData | null, name: string = 'Triple-Twist Möbius Strip'): void {
    this.customModelName = name;
    if (this.gl && mesh) {
      this.customMeshBuf = this.createBuffer(this.gl, mesh);
    } else {
      this.customMeshBuf = null;
    }
  }

  public getCustomModelName(): string {
    return this.customModelName;
  }

  public setThemePalette(palette: GeometryPalette): void {
    this.currentPalette = {
      baseColor: palette.baseColor ?? this.currentPalette.baseColor,
      highlightColor: palette.highlightColor ?? this.currentPalette.highlightColor,
      accentColor: palette.accentColor ?? this.currentPalette.accentColor
    };
    if (this.gl) {
      this.rebuildDefaultGeometries();
    }
  }

  public getThemePalette(): GeometryPalette {
    return { ...this.currentPalette };
  }

  private rebuildDefaultGeometries(): void {
    if (!this.gl) return;
    const gl = this.gl;
    const outerRingMesh = createExtrudedRing(1.30, 1.52, 0.12, 40, 5, this.currentPalette);
    const gimbalRingMesh = createExtrudedRing(0.98, 1.16, 0.09, 32, 4, this.currentPalette);
    const coreMesh = createFacetedCore(0.62, 0.92, 8, this.currentPalette);
    const reticleMesh = createReticlePins(1.68, 0.016, this.currentPalette);

    this.outerRingBuf = this.createBuffer(gl, outerRingMesh);
    this.gimbalRingBuf = this.createBuffer(gl, gimbalRingMesh);
    this.coreUpperBuf = this.createBuffer(gl, coreMesh.upper);
    this.coreLowerBuf = this.createBuffer(gl, coreMesh.lower);
    this.reticleBuf = this.createBuffer(gl, reticleMesh);
  }

  public destroy(): void {
    this.stop();
    window.removeEventListener('resize', this.onResize);
    document.removeEventListener('visibilitychange', this.onVisibilityChange);
  }
}
