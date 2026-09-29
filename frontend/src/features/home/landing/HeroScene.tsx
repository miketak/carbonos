import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { useMemo, useRef, useState } from 'react'
import type { CSSProperties, MutableRefObject } from 'react'
import * as THREE from 'three'

/*
 * The hero: the inventory as a physical object. Three glass slabs are the three
 * scopes; greenhouse gas molecules drift around them and a verification ring
 * scans the stack top to bottom. Molecular geometry is real (bond lengths in
 * ångström, tetrahedral methane, linear CO2 and N2O), because the people this
 * page is for will notice if it is not.
 *
 * Labels are ordinary DOM elements in an overlay next to the canvas. Each
 * frame, `Projector` projects an anchor object's world position to pixels and
 * moves the matching element, so labels are never clipped by the canvas and
 * stay crisp at any zoom.
 */

const A = 0.3 // scene units per ångström

type Atom = { el: 'C' | 'O' | 'H' | 'N'; p: [number, number, number] }
type Molecule = {
  name: string
  formula: string
  gwp: number
  atoms: Atom[]
  bonds: [number, number][]
}

const T = 1 / Math.sqrt(3)
const MOLECULES: Record<'co2' | 'ch4' | 'n2o', Molecule> = {
  co2: {
    name: 'Carbon dioxide',
    formula: 'CO₂',
    gwp: 1,
    atoms: [
      { el: 'C', p: [0, 0, 0] },
      { el: 'O', p: [1.16 * A, 0, 0] },
      { el: 'O', p: [-1.16 * A, 0, 0] },
    ],
    bonds: [
      [0, 1],
      [0, 2],
    ],
  },
  ch4: {
    name: 'Methane',
    formula: 'CH₄',
    gwp: 28,
    atoms: [
      { el: 'C', p: [0, 0, 0] },
      { el: 'H', p: [1.09 * A * T, 1.09 * A * T, 1.09 * A * T] },
      { el: 'H', p: [1.09 * A * T, -1.09 * A * T, -1.09 * A * T] },
      { el: 'H', p: [-1.09 * A * T, 1.09 * A * T, -1.09 * A * T] },
      { el: 'H', p: [-1.09 * A * T, -1.09 * A * T, 1.09 * A * T] },
    ],
    bonds: [
      [0, 1],
      [0, 2],
      [0, 3],
      [0, 4],
    ],
  },
  n2o: {
    name: 'Nitrous oxide',
    formula: 'N₂O',
    gwp: 265,
    atoms: [
      { el: 'N', p: [-1.13 * A, 0, 0] },
      { el: 'N', p: [0, 0, 0] },
      { el: 'O', p: [1.19 * A, 0, 0] },
    ],
    bonds: [
      [0, 1],
      [1, 2],
    ],
  },
}

const ATOM_STYLE: Record<Atom['el'], { color: string; r: number }> = {
  C: { color: '#2b3a3d', r: 0.5 * A },
  O: { color: '#e0554a', r: 0.48 * A },
  N: { color: '#3b6fd6', r: 0.5 * A },
  H: { color: '#f4f7f6', r: 0.3 * A },
}

/** Anchors registered by scene objects; the overlay labels are keyed the same way. */
type Anchors = MutableRefObject<Map<string, THREE.Object3D>>
type LabelNodes = MutableRefObject<Map<string, HTMLElement>>

function Bond({ a, b }: { a: [number, number, number]; b: [number, number, number] }) {
  const { position, quaternion, length } = useMemo(() => {
    const va = new THREE.Vector3(...a)
    const vb = new THREE.Vector3(...b)
    const dir = vb.clone().sub(va)
    const length = dir.length()
    const position = va.clone().add(vb).multiplyScalar(0.5)
    const quaternion = new THREE.Quaternion().setFromUnitVectors(
      new THREE.Vector3(0, 1, 0),
      dir.normalize(),
    )
    return { position, quaternion, length }
  }, [a, b])
  return (
    <mesh position={position} quaternion={quaternion}>
      <cylinderGeometry args={[0.035, 0.035, length, 10]} />
      <meshStandardMaterial color="#c9d6d4" roughness={0.6} />
    </mesh>
  )
}

function MoleculeMesh({ molecule }: { molecule: Molecule }) {
  return (
    <group>
      {molecule.bonds.map(([i, j]) => (
        <Bond key={`${i}-${j}`} a={molecule.atoms[i].p} b={molecule.atoms[j].p} />
      ))}
      {molecule.atoms.map((atom, index) => (
        <mesh key={index} position={atom.p}>
          <sphereGeometry args={[ATOM_STYLE[atom.el].r, 20, 20]} />
          <meshStandardMaterial
            color={ATOM_STYLE[atom.el].color}
            roughness={0.35}
            metalness={0.05}
          />
        </mesh>
      ))}
    </group>
  )
}

type Drifter = {
  kind: keyof typeof MOLECULES
  radius: number
  height: number
  speed: number
  phase: number
  spin: number
  label?: string
}

function makeDrifters(): Drifter[] {
  const kinds: (keyof typeof MOLECULES)[] = [
    'co2',
    'ch4',
    'n2o',
    'co2',
    'co2',
    'ch4',
    'co2',
    'co2',
    'ch4',
    'co2',
    'n2o',
    'co2',
  ]
  return kinds.map((kind, i) => ({
    kind,
    radius: i < 3 ? 2.25 : 2.3 + ((i * 7) % 4) * 0.05,
    height: -1.3 + ((i * 5) % 7) * 0.42,
    speed: (0.05 + ((i * 3) % 4) * 0.012) * (i % 2 === 0 ? 1 : -1),
    phase: (i / kinds.length) * Math.PI * 2,
    spin: 0.2 + ((i * 11) % 5) * 0.08,
    label: i < 3 ? `mol-${kind}` : undefined,
  }))
}

function Drifters({ animate, anchors }: { animate: boolean; anchors: Anchors }) {
  const drifters = useMemo(() => makeDrifters(), [])
  const refs = useRef<(THREE.Group | null)[]>([])
  useFrame((state) => {
    const t = animate ? state.clock.elapsedTime : 0
    drifters.forEach((d, i) => {
      const g = refs.current[i]
      if (!g) return
      const angle = d.phase + t * d.speed
      g.position.set(
        Math.cos(angle) * d.radius,
        d.height + Math.sin(t * 0.6 + d.phase) * 0.12,
        Math.sin(angle) * d.radius,
      )
      g.rotation.set(t * d.spin, t * d.spin * 0.7, 0)
    })
  })
  return (
    <>
      {drifters.map((d, i) => (
        <group
          key={i}
          ref={(node) => {
            refs.current[i] = node
            if (node && d.label) anchors.current.set(d.label, node)
          }}
        >
          <MoleculeMesh molecule={MOLECULES[d.kind]} />
        </group>
      ))}
    </>
  )
}

const SLABS = [
  {
    id: 'scope1',
    scope: 'Scope 1',
    kind: 'Direct: haul fleet diesel, gensets, LPG',
    value: '34,194 tCO₂e',
    color: '#0a7d70',
    y: 0.85,
  },
  {
    id: 'scope2',
    scope: 'Scope 2',
    kind: 'Purchased electricity, location and market',
    value: '32,817 tCO₂e',
    color: '#09a895',
    y: 0,
  },
  {
    id: 'scope3',
    scope: 'Scope 3',
    kind: 'Contract haulage, well-to-tank, grid losses',
    value: '19,401 tCO₂e',
    color: '#05cebb',
    y: -0.85,
  },
]

function Slab({
  id,
  color,
  y,
  hovered,
  onHover,
  anchors,
}: (typeof SLABS)[number] & {
  hovered: boolean
  onHover: (on: boolean) => void
  anchors: Anchors
}) {
  const geometry = useMemo(() => new THREE.BoxGeometry(3.4, 0.22, 2.3), [])
  const edges = useMemo(() => new THREE.EdgesGeometry(geometry, 15), [geometry])
  return (
    <group position={[0, y, 0]}>
      <mesh
        geometry={geometry}
        onPointerOver={(event) => {
          event.stopPropagation()
          onHover(true)
        }}
        onPointerOut={() => onHover(false)}
      >
        <meshPhysicalMaterial
          color={color}
          transparent
          opacity={hovered ? 0.82 : 0.58}
          roughness={0.18}
          metalness={0.05}
          clearcoat={1}
          clearcoatRoughness={0.2}
          emissive={color}
          emissiveIntensity={hovered ? 0.35 : 0.08}
        />
      </mesh>
      <lineSegments geometry={edges}>
        <lineBasicMaterial color={hovered ? '#82ef6d' : '#ffffff'} transparent opacity={0.9} />
      </lineSegments>
      <object3D
        position={[1.7, 0.11, 1.15]}
        ref={(node) => {
          if (node) anchors.current.set(id, node)
        }}
      />
    </group>
  )
}

function ScanRing({ animate }: { animate: boolean }) {
  const ref = useRef<THREE.Group>(null)
  useFrame((state) => {
    if (!ref.current) return
    const t = animate ? state.clock.elapsedTime : 0
    ref.current.position.y = animate ? Math.sin(t * 0.45) * 1.25 : 0.4
  })
  return (
    <group ref={ref}>
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[2.35, 0.018, 8, 96]} />
        <meshStandardMaterial
          color="#82ef6d"
          emissive="#82ef6d"
          emissiveIntensity={1.6}
          toneMapped={false}
        />
      </mesh>
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[2.35, 0.09, 8, 96]} />
        <meshBasicMaterial color="#82ef6d" transparent opacity={0.12} />
      </mesh>
    </group>
  )
}

function Stars() {
  const positions = useMemo(() => {
    const out = new Float32Array(360 * 3)
    let seed = 7
    const rand = () => {
      seed = (seed * 16807) % 2147483647
      return seed / 2147483647
    }
    for (let i = 0; i < 360; i++) {
      const r = 4.5 + rand() * 4
      const theta = rand() * Math.PI * 2
      const phi = Math.acos(2 * rand() - 1)
      out[i * 3] = r * Math.sin(phi) * Math.cos(theta)
      out[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta) * 0.6
      out[i * 3 + 2] = r * Math.cos(phi)
    }
    return out
  }, [])
  return (
    <points>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial color="#05cebb" size={0.035} transparent opacity={0.55} sizeAttenuation />
    </points>
  )
}

/**
 * Moves each overlay label to its anchor's projected position. Registered after
 * the scene's own frame callbacks, at the default priority: a positive priority
 * would tell React Three Fiber to stop rendering the scene itself.
 */
function Projector({ anchors, labels }: { anchors: Anchors; labels: LabelNodes }) {
  const { camera, size } = useThree()
  const v = useMemo(() => new THREE.Vector3(), [])
  // label sizes change only on resize, so they are measured once per size, never per frame
  const sizes = useRef<{ key: string; map: Map<string, { w: number; h: number }> }>({
    key: '',
    map: new Map(),
  })
  useFrame(() => {
    const key = `${size.width}x${size.height}`
    if (sizes.current.key !== key) {
      sizes.current = { key, map: new Map() }
      labels.current.forEach((node, id) => {
        const child = node.firstElementChild as HTMLElement | null
        if (child) sizes.current.map.set(id, { w: child.offsetWidth, h: child.offsetHeight })
      })
    }
    // the scope cards hang up and left of their anchor (translate -100%, -100%); a molecule tag hangs 14px below its anchor, centred
    const cards: { l: number; t: number; r: number; b: number }[] = []
    const tags: { node: HTMLElement; l: number; t: number; r: number; b: number }[] = []
    anchors.current.forEach((object, id) => {
      const node = labels.current.get(id)
      if (!node) return
      object.getWorldPosition(v).project(camera)
      const x = (v.x * 0.5 + 0.5) * size.width
      const y = (-v.y * 0.5 + 0.5) * size.height
      node.style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0)`
      if (v.z >= 1) {
        node.style.opacity = '0'
        return
      }
      const box = sizes.current.map.get(id) ?? { w: 0, h: 0 }
      if (id.startsWith('mol-')) {
        tags.push({ node, l: x - box.w / 2, t: y + 14, r: x + box.w / 2, b: y + 14 + box.h })
      } else {
        node.style.opacity = '1'
        cards.push({ l: x - box.w, t: y - box.h, r: x, b: y })
      }
    })
    // a molecule tag never paints over a scope value: it fades while its box crosses a card's box
    tags.forEach((tag) => {
      const covered = cards.some(
        (c) => tag.r > c.l - 6 && tag.l < c.r + 6 && tag.b > c.t - 6 && tag.t < c.b + 6,
      )
      tag.node.style.opacity = covered ? '0' : '1'
    })
  })
  return null
}

function Stack({
  animate,
  hot,
  setHot,
  anchors,
}: {
  animate: boolean
  hot: string | null
  setHot: (id: string | null) => void
  anchors: Anchors
}) {
  const group = useRef<THREE.Group>(null)
  useFrame((state, delta) => {
    if (!group.current) return
    const targetY = -0.55 + (animate ? state.pointer.x * 0.22 : 0)
    const targetX = 0.42 + (animate ? -state.pointer.y * 0.12 : 0)
    group.current.rotation.y = THREE.MathUtils.damp(group.current.rotation.y, targetY, 3, delta)
    group.current.rotation.x = THREE.MathUtils.damp(group.current.rotation.x, targetX, 3, delta)
    group.current.position.y = animate ? Math.sin(state.clock.elapsedTime * 0.5) * 0.06 : 0
  })
  return (
    <group ref={group} position={[-0.2, 0.1, 0]} rotation={[0.42, -0.55, 0]}>
      {SLABS.map((slab) => (
        <Slab
          key={slab.id}
          {...slab}
          hovered={hot === slab.id}
          onHover={(on) => setHot(on ? slab.id : null)}
          anchors={anchors}
        />
      ))}
      <ScanRing animate={animate} />
      <Drifters animate={animate} anchors={anchors} />
    </group>
  )
}

const MOLECULE_LABELS = [
  { id: 'mol-co2', text: 'CO₂ · GWP₁₀₀ 1' },
  { id: 'mol-ch4', text: 'CH₄ · GWP₁₀₀ 28' },
  { id: 'mol-n2o', text: 'N₂O · GWP₁₀₀ 265' },
]

const hidden: CSSProperties = { opacity: 0 }

/** Mounted only when WebGL 2 exists; `animate` is false under reduced motion or off screen. */
export default function HeroScene({ animate }: { animate: boolean }) {
  const [hot, setHot] = useState<string | null>(null)
  const anchors = useRef(new Map<string, THREE.Object3D>())
  const labels = useRef(new Map<string, HTMLElement>())
  const register = (id: string) => (node: HTMLElement | null) => {
    if (node) labels.current.set(id, node)
    else labels.current.delete(id)
  }

  return (
    <>
      <Canvas
        dpr={[1, 1.6]}
        camera={{ position: [0, 1.1, 8.6], fov: 38 }}
        gl={{ antialias: true, alpha: true, powerPreference: 'low-power' }}
        frameloop={animate ? 'always' : 'demand'}
        style={{ position: 'absolute', inset: 0 }}
      >
        <ambientLight intensity={0.9} />
        <directionalLight position={[4, 6, 5]} intensity={1.4} />
        <pointLight position={[-4, -2, 3]} intensity={12} color="#82ef6d" />
        <pointLight position={[3, 3, -4]} intensity={8} color="#05cebb" />
        <Stars />
        <Stack animate={animate} hot={hot} setHot={setHot} anchors={anchors} />
        <Projector anchors={anchors} labels={labels} />
      </Canvas>
      {/* molecule tags first, so the scope labels paint above them */}
      <div className="hero-overlay" aria-hidden="true">
        {MOLECULE_LABELS.map((label) => (
          <div key={label.id} ref={register(label.id)} className="hero-anchor" style={hidden}>
            <span className="hero-molecule-label">{label.text}</span>
          </div>
        ))}
        {SLABS.map((slab) => (
          <div
            key={slab.id}
            ref={register(slab.id)}
            className="hero-anchor hero-anchor--slab"
            style={hidden}
          >
            <div className={`hero-slab-label ${hot === slab.id ? 'is-hot' : ''}`}>
              <span className="hero-slab-scope">{slab.scope}</span>
              <span className="hero-slab-kind">{slab.kind}</span>
              <span className="hero-slab-value">{slab.value}</span>
            </div>
          </div>
        ))}
      </div>
    </>
  )
}
