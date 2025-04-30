import React, { useRef, useEffect } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';

interface ThreeSceneProps {
  equipmentId: number;
  className?: string;
}

export const ThreeScene: React.FC<ThreeSceneProps> = ({ equipmentId, className }) => {
  const mountRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    if (!mountRef.current) return;
    
    // Scene setup
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0F0F0F);
    
    // Camera setup
    const camera = new THREE.PerspectiveCamera(
      75,
      mountRef.current.clientWidth / mountRef.current.clientHeight,
      0.1,
      1000
    );
    camera.position.z = 5;
    
    // Renderer setup
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(mountRef.current.clientWidth, mountRef.current.clientHeight);
    mountRef.current.appendChild(renderer.domElement);
    
    // Orbit controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    
    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);
    
    const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    directionalLight.position.set(2, 2, 5);
    scene.add(directionalLight);
    
    // Create object based on equipment ID
    let object: THREE.Mesh;
    
    switch(equipmentId) {
      case 1: // Development Laptop
        // Create a laptop-like object
        const laptopGeometry = new THREE.BoxGeometry(3, 0.2, 2);
        const screenGeometry = new THREE.BoxGeometry(2.8, 1.8, 0.1);
        
        const laptopMaterial = new THREE.MeshPhongMaterial({ color: 0x333333 });
        const screenMaterial = new THREE.MeshPhongMaterial({ color: 0x065FD4 });
        
        const laptop = new THREE.Mesh(laptopGeometry, laptopMaterial);
        const screen = new THREE.Mesh(screenGeometry, screenMaterial);
        
        screen.position.set(0, 1, 0);
        screen.rotation.x = -Math.PI / 4;
        
        scene.add(laptop);
        scene.add(screen);
        object = laptop;
        break;
        
      case 2: // VR Headset
        // Create a VR headset-like object
        const headsetGeometry = new THREE.BoxGeometry(2, 1, 1);
        const headsetMaterial = new THREE.MeshPhongMaterial({ color: 0x222222 });
        
        object = new THREE.Mesh(headsetGeometry, headsetMaterial);
        
        const lensGeometry = new THREE.CircleGeometry(0.3, 32);
        const lensMaterial = new THREE.MeshPhongMaterial({ color: 0x000000 });
        
        const leftLens = new THREE.Mesh(lensGeometry, lensMaterial);
        leftLens.position.set(-0.5, 0, 0.51);
        
        const rightLens = new THREE.Mesh(lensGeometry, lensMaterial);
        rightLens.position.set(0.5, 0, 0.51);
        
        object.add(leftLens, rightLens);
        scene.add(object);
        break;
        
      case 3: // IoT Development Kit
        // Create a circuit board-like object
        const boardGeometry = new THREE.BoxGeometry(3, 0.2, 2);
        const boardMaterial = new THREE.MeshPhongMaterial({ color: 0x006600 });
        
        object = new THREE.Mesh(boardGeometry, boardMaterial);
        
        // Add components
        const chipGeometry = new THREE.BoxGeometry(0.5, 0.1, 0.5);
        const chipMaterial = new THREE.MeshPhongMaterial({ color: 0x111111 });
        
        for (let i = 0; i < 6; i++) {
          const chip = new THREE.Mesh(chipGeometry, chipMaterial);
          chip.position.set(
            Math.random() * 2 - 1,
            0.1,
            Math.random() * 1.5 - 0.75
          );
          object.add(chip);
        }
        
        scene.add(object);
        break;
        
      default: // Default cube
        const geometry = new THREE.BoxGeometry(2, 2, 2);
        const material = new THREE.MeshPhongMaterial({ color: 0x065FD4 });
        object = new THREE.Mesh(geometry, material);
        scene.add(object);
    }
    
    // Animation
    const animate = () => {
      requestAnimationFrame(animate);
      
      // Rotate the object
      if (object) {
        object.rotation.y += 0.005;
      }
      
      controls.update();
      renderer.render(scene, camera);
    };
    
    animate();
    
    // Handle window resize
    const handleResize = () => {
      if (!mountRef.current) return;
      
      camera.aspect = mountRef.current.clientWidth / mountRef.current.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(mountRef.current.clientWidth, mountRef.current.clientHeight);
    };
    
    window.addEventListener('resize', handleResize);
    
    // Cleanup
    return () => {
      window.removeEventListener('resize', handleResize);
      mountRef.current?.removeChild(renderer.domElement);
      scene.clear();
    };
  }, [equipmentId]);
  
  return <div ref={mountRef} className={className} />;
};
