// Editorial slide data and 3D artifact pose definitions

export interface ObjectPose {
  rotX: number;
  rotY: number;
  rotZ: number;
  spinRate: number;        // Idle angular velocity (0 if paused / reduced motion)
  gimbalPitch: number;     // Middle gimbal deflection in radians
  coreSplit: number;       // Upper/lower core vertical separation
  explodedDistance: number;// Outer bezel radial offset
  dialAlign: number;       // 0 = organic/exploded, 1 = planar instrument alignment
  scale: number;
}

export interface SlideComponent {
  tag: string;
  name: string;
  description: string;
  coords: { x: number; y: number }; // Relative position on stage (0..1)
}

export interface SequenceStep {
  index: string;
  title: string;
  detail: string;
}

export interface SlideData {
  id: string;
  index: number;
  catalogNumber: string;
  superTitle: string;
  title: string;
  thesis: string;
  body?: string;
  metadata?: Array<{ label: string; value: string }>;
  sequence?: SequenceStep[];
  components?: SlideComponent[];
  takeaway?: string;
  action?: {
    primaryText: string;
    secondaryText: string;
  };
  pose: ObjectPose;
}

export const SLIDES: SlideData[] = [
  {
    id: "opening",
    index: 0,
    catalogNumber: "PLATE 01 / 06",
    superTitle: "EXHIBITION MONOGRAPH · VOL. IV",
    title: "Objects in Motion",
    thesis: "A study of continuous kinetic geometry, mechanical hierarchy, and the evolution of spatial artifacts.",
    metadata: [
      { label: "MEDIUM", value: "PROCEDURAL WEBGL" },
      { label: "DATUM", value: "TRIAXIAL GIMBAL" },
      { label: "MASS RATIO", value: "1 : 1.618" }
    ],
    pose: {
      rotX: 0.22,
      rotY: 0.45,
      rotZ: 0.08,
      spinRate: 0.005,
      gimbalPitch: 0.15,
      coreSplit: 0.0,
      explodedDistance: 0.0,
      dialAlign: 0.0,
      scale: 1.05
    }
  },
  {
    id: "form",
    index: 1,
    catalogNumber: "PLATE 02 / 06",
    superTitle: "STRUCTURAL ANATOMY",
    title: "Internal Geometry",
    thesis: "Concentric rings distribute radial equilibrium across three orthogonal planes.",
    body: "Before kinetic release occurs, stability is preserved through nested concentric envelopes. The outer titanium bezel shelters an articulated gimbal chassis, encasing a precision faceted octahedron.",
    metadata: [
      { label: "SYMMETRY", value: "D4h OCTAHEDRAL" },
      { label: "TOLERANCE", value: "±0.04 MM" },
      { label: "EQUILIBRIUM", value: "INERTIAL DAMPED" }
    ],
    pose: {
      rotX: 0.48,
      rotY: -0.32,
      rotZ: 0.25,
      spinRate: 0.003,
      gimbalPitch: 0.65,
      coreSplit: 0.08,
      explodedDistance: 0.15,
      dialAlign: 0.0,
      scale: 1.15
    }
  },
  {
    id: "motion",
    index: 2,
    catalogNumber: "PLATE 03 / 06",
    superTitle: "KINETIC SEQUENCE",
    title: "Phase Decoupling",
    thesis: "Rotational momentum separates the outer chassis from the core in an orchestrated three-stage cycle.",
    sequence: [
      {
        index: "01",
        title: "Axial Release",
        detail: "The equatorial lock disengages; the outer chassis begins steady precession."
      },
      {
        index: "02",
        title: "Biaxial Precession",
        detail: "Secondary gimbal rings tilt out-of-phase to absorb angular momentum."
      },
      {
        index: "03",
        title: "Gyroscopic Lock",
        detail: "The faceted central prism stabilizes its vertical vector while the periphery orbits."
      }
    ],
    metadata: [
      { label: "PHASE SHIFT", value: "90° COUNTER-AXIS" },
      { label: "ANGULAR MOMENTUM", value: "CONSERVED" }
    ],
    pose: {
      rotX: -0.35,
      rotY: 1.15,
      rotZ: -0.42,
      spinRate: 0.012,
      gimbalPitch: 1.25,
      coreSplit: 0.18,
      explodedDistance: 0.35,
      dialAlign: 0.0,
      scale: 1.1
    }
  },
  {
    id: "system",
    index: 3,
    catalogNumber: "PLATE 04 / 06",
    superTitle: "EXPLODED TOPOLOGY",
    title: "Constituent Assemblies",
    thesis: "Dissected into primary sub-systems, each element performs a singular mechanical duty.",
    components: [
      {
        tag: "A",
        name: "Inertial Bezel",
        description: "Machined outer ring with radial graduations; counters external drag.",
        coords: { x: 0.28, y: 0.26 }
      },
      {
        tag: "B",
        name: "Biaxial Gimbal",
        description: "Dual-pivot suspension yoke enabling frictionless angular deflection.",
        coords: { x: 0.72, y: 0.44 }
      },
      {
        tag: "C",
        name: "Faceted Core",
        description: "Octahedral reference prism acting as the primary spatial datum.",
        coords: { x: 0.32, y: 0.76 }
      }
    ],
    metadata: [
      { label: "ASSEMBLIES", value: "3 PRIMARY / 8 SUBSIDIARY" },
      { label: "DISPLACEMENT", value: "RADIAL EXPANSION" }
    ],
    pose: {
      rotX: 0.38,
      rotY: 0.72,
      rotZ: 0.12,
      spinRate: 0.002,
      gimbalPitch: 0.85,
      coreSplit: 0.42,
      explodedDistance: 0.85,
      dialAlign: 0.0,
      scale: 1.25
    }
  },
  {
    id: "application",
    index: 4,
    catalogNumber: "PLATE 05 / 06",
    superTitle: "FUNCTIONAL SYNTHESIS",
    title: "The Celestial Instrument",
    thesis: "When brought into coplanar alignment, the independent parts function as a precision coordinate transducer.",
    takeaway: "The artifact transitions from sculptural sculpture to optical dial. Cross-hairline reticles and calibrated limb notches allow precise sightlines across changing horizons.",
    metadata: [
      { label: "RESOLVED MODE", value: "ASTROLABIC HORIZON" },
      { label: "ACCURACY", value: "±0.02° VERNIER" },
      { label: "INTERFACE", value: "OPTICAL SIGHTING" }
    ],
    pose: {
      rotX: 0.15,
      rotY: 0.0,
      rotZ: 0.0,
      spinRate: 0.001,
      gimbalPitch: 0.0,
      coreSplit: 0.0,
      explodedDistance: 0.05,
      dialAlign: 1.0,
      scale: 1.2
    }
  },
  {
    id: "closing",
    index: 5,
    catalogNumber: "PLATE 06 / 06",
    superTitle: "RESOLVED EQUILIBRIUM",
    title: "Form at Rest",
    thesis: "Motion concludes where geometry began: the artifact re-converges into its monolithic resting state.",
    takeaway: "Web presentations need not emulate physical cardboard slide decks. By treating the viewport as a cinematic exhibition stage, content and spatial object evolve together through continuous interaction.",
    metadata: [
      { label: "STATE", value: "EQUILIBRIUM COMPLETE" },
      { label: "TOTAL PLATES", value: "6 OF 6" }
    ],
    action: {
      primaryText: "Restart Presentation",
      secondaryText: "Toggle Free Scroll"
    },
    pose: {
      rotX: 0.28,
      rotY: -0.45,
      rotZ: 0.12,
      spinRate: 0.003,
      gimbalPitch: 0.18,
      coreSplit: 0.0,
      explodedDistance: 0.0,
      dialAlign: 0.0,
      scale: 1.08
    }
  }
];
