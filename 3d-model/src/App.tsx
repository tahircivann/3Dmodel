import * as THREE from 'three';
import * as React from 'react';
import { useRef, useState, Suspense, useEffect } from 'react';
import { Canvas, useFrame, useThree, extend } from "@react-three/fiber";
import { Stats, OrbitControls, useGLTF, Loader } from "@react-three/drei";
import { GLTF } from 'three/examples/jsm/loaders/GLTFLoader';
import { useDropzone } from 'react-dropzone';


function Annotation() {
  const { scene, camera, raycaster, mouse } = useThree();
  const points = useRef<THREE.Points>();


  useEffect(() => {
    const geometry = new THREE.BufferGeometry();
    points.current = new THREE.Points(geometry, new THREE.PointsMaterial({ color: 0xff0000 }));
    scene.add(points.current);
  }, [scene]);

  useFrame(() => {
    if (points.current) {
      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObjects(scene.children);
      if (intersects.length > 0) {
        const point = intersects[0].point;
        const positionAttr = new THREE.Float32BufferAttribute([point.x, point.y, point.z], 3);
        points.current.geometry.setAttribute('position', positionAttr);
        positionAttr.needsUpdate = true;
      }
    }
  });

  return null;
}


function Box(props: JSX.IntrinsicElements['mesh']) {
  const ref = useRef<THREE.Mesh>(null!)
  const [hovered, hover] = useState(false)
  const [clicked, click] = useState(false)
  useFrame(() => (ref.current.rotation.x += 0.01))

  return (
    <mesh
      {...props}
      ref={ref}
      scale={clicked ? 1.5 : 1}
      onClick={() => click(!clicked)}
      onPointerOver={() => hover(true)}
      onPointerOut={() => hover(false)}>
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial color={hovered ? 'hotpink' : 'orange'} />
    </mesh>
  )
}

const GLTFDropzone: React.FC = () => {
  const [modelUrl, setModelUrl] = useState<string | null>(null);
  const { getRootProps, getInputProps } = useDropzone({
    accept: { gltf: ['.gltf'], glb: ['.glb'] },
    onDrop: ([file]) => {
      const url = URL.createObjectURL(file);
      setModelUrl(url);
    },
  });

  return (
    <>
      <div {...getRootProps()} style={{
        height: 100,
        width: 100,
        border: '1px solid black',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
      }}>
        <input {...getInputProps()} />
        Drop GLTFhere
      </div>
      {modelUrl && (
        <Canvas style={{ height: '100vh', width: '100vw' }} camera={{ position: [5, 5, 5] }}>
          <Stats />
          <Suspense fallback={null}>
            <Model url={modelUrl} />
            <Annotation />
            <OrbitControls />
            <ambientLight intensity={0.5} />
            <spotLight intensity={0.8} position={[300, 300, 4000]} />
            <axesHelper args={[100]}
              position={[0, 0, 0]}
              scale={[10, 10, 10]}
              up={new THREE.Vector3(0, 0, 1)}
            />
            <gridHelper args={[100, 100]}
              position={[0, 0, 0]}
              scale={[10, 10, 10]}
              up={new THREE.Vector3(0, 0, 1)}
            />
          </Suspense>
        </Canvas>
      )}
    </>
  );
};

const Model: React.FC<{ url: string }> = ({ url }) => {
  // Use URL string directly with useGLTF
  const gltf: GLTF = useGLTF(url, false);
  console.log(gltf);
  return <primitive object={gltf.scene} dispose={null} />;
};

export default function App() {
  return (
    <div>
      <strong>Drop</strong> a glTF file into the box to load it.
      <GLTFDropzone />
    </div>
  );
}
