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
        const positionAttr = new THREE.Float32BufferAttribute([point.x + 0.1, point.y + 0.1, point.z + 0.1], 3);
        points.current.geometry.setAttribute('position', positionAttr);
        positionAttr.needsUpdate = true;
      }
    }
  });

  return null;
}
function Drawing() {
  const { scene, camera, raycaster, mouse, gl } = useThree();
  const [points, setPoints] = useState<THREE.Vector3[]>([]);
  const lineMaterial = new THREE.LineBasicMaterial({ color: 0xff0000 });
  const pointMaterial = new THREE.PointsMaterial({ color: 0x00ff00, size: 0.2 });
  const line = useRef<THREE.Line>();
  const pointGroup = useRef<THREE.Group>(new THREE.Group());

  useEffect(() => {
    scene.add(pointGroup.current);
  }, [scene]);

  useEffect(() => {
    const geometry = new THREE.BufferGeometry().setFromPoints(points);
    line.current = new THREE.Line(geometry, lineMaterial);
    scene.add(line.current);
  }, [scene]);

  useEffect(() => {
    const onClick = () => {
      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObjects(scene.children);
      if (intersects.length > 0) {
        const point = intersects[0].point;
        setPoints(oldPoints => [...oldPoints, point]);

        const pointGeometry = new THREE.BufferGeometry().setFromPoints([point]);
        pointGeometry.setAttribute('position', new THREE.Float32BufferAttribute([point.x + 0.1, point.y + 0.1, point.z + 0.1], 3));
        const pointObject = new THREE.Points(pointGeometry, pointMaterial);
        pointGroup.current.add(pointObject);
      }
    };

    gl.domElement.addEventListener('click', onClick);
    return () => {
      gl.domElement.removeEventListener('click', onClick);
    };
  }, [camera, raycaster, mouse, gl.domElement, scene.children]);

  useEffect(() => {
    if (line.current) {
      line.current.geometry.dispose();
      line.current.geometry = new THREE.BufferGeometry().setFromPoints(points);
    }
  }, [points]);

  return null;
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
            <Drawing />
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
