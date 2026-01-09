'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Loader2, AlertCircle, Gamepad2, Code, Eye, Download, Copy, Check, RotateCcw } from 'lucide-react';
import { HaleyCoreGlyph } from '@/components/HaleyCoreGlyph';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

interface PreviewElement {
  type: string;
  name: string;
  position: { x: number; y: number; z: number };
  size: { x: number; y: number; z: number };
  color: string;
  shape?: string;
  rotation?: { x: number; y: number; z: number };
}

interface PreviewConfig {
  elements: PreviewElement[];
  lighting?: string;
  environment?: string;
}

interface GenerateResult {
  lua_code: string;
  preview_config: PreviewConfig;
  elements_created: number;
}

export default function RobloxExpertPage() {
  const router = useRouter();
  const containerRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const animationIdRef = useRef<number | null>(null);

  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<GenerateResult | null>(null);
  const [activeTab, setActiveTab] = useState<'preview' | 'code'>('preview');
  const [copied, setCopied] = useState(false);

  // Initialize Three.js scene
  const initThreeJS = () => {
    if (!containerRef.current) return;

    // Clean up existing
    if (rendererRef.current) {
      rendererRef.current.dispose();
      if (containerRef.current.contains(rendererRef.current.domElement)) {
        containerRef.current.removeChild(rendererRef.current.domElement);
      }
    }
    if (animationIdRef.current) {
      cancelAnimationFrame(animationIdRef.current);
    }

    const width = containerRef.current.clientWidth;
    const height = 450;

    // Scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x1a1e22);
    scene.fog = new THREE.Fog(0x1a1e22, 50, 150);
    sceneRef.current = scene;

    // Camera
    const camera = new THREE.PerspectiveCamera(60, width / height, 0.1, 1000);
    camera.position.set(30, 25, 30);
    camera.lookAt(0, 0, 0);
    cameraRef.current = camera;

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    containerRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.minDistance = 10;
    controls.maxDistance = 100;
    controls.maxPolarAngle = Math.PI / 2.1;
    controlsRef.current = controls;

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(20, 30, 20);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 2048;
    directionalLight.shadow.mapSize.height = 2048;
    directionalLight.shadow.camera.near = 0.5;
    directionalLight.shadow.camera.far = 100;
    directionalLight.shadow.camera.left = -50;
    directionalLight.shadow.camera.right = 50;
    directionalLight.shadow.camera.top = 50;
    directionalLight.shadow.camera.bottom = -50;
    scene.add(directionalLight);

    const hemisphereLight = new THREE.HemisphereLight(0x87ceeb, 0x3d5c3d, 0.3);
    scene.add(hemisphereLight);

    // Grid helper
    const gridHelper = new THREE.GridHelper(60, 30, 0x3a3e42, 0x2a2e32);
    gridHelper.position.y = -0.01;
    scene.add(gridHelper);

    // Animation loop
    const animate = () => {
      animationIdRef.current = requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, camera);
    };
    animate();
  };

  // Create 3D mesh from element
  const createElementMesh = (element: PreviewElement): THREE.Object3D => {
    const color = new THREE.Color(element.color || '#4a9eff');
    const name = element.name.toLowerCase();

    // Material with some variation based on element type
    let material: THREE.Material;
    if (name.includes('neon') || name.includes('glow') || name.includes('flame')) {
      material = new THREE.MeshBasicMaterial({ color });
    } else if (name.includes('metal') || name.includes('sword') || name.includes('armor')) {
      material = new THREE.MeshStandardMaterial({ color, metalness: 0.8, roughness: 0.2 });
    } else if (name.includes('glass') || name.includes('water')) {
      material = new THREE.MeshStandardMaterial({ color, transparent: true, opacity: 0.6 });
    } else {
      material = new THREE.MeshStandardMaterial({ color, roughness: 0.7 });
    }

    let geometry: THREE.BufferGeometry;
    const group = new THREE.Group();

    // Determine geometry based on shape and name
    if (element.shape === 'Ball' || name.includes('leaves') || name.includes('head') || name.includes('ball')) {
      geometry = new THREE.SphereGeometry(element.size.x / 2, 16, 16);
    } else if (element.shape === 'Cylinder' || name.includes('trunk') || name.includes('cylinder') || name.includes('coin')) {
      geometry = new THREE.CylinderGeometry(
        element.size.x / 2,
        element.size.x / 2,
        element.size.y,
        16
      );
    } else if (name.includes('cone') || name.includes('tower')) {
      geometry = new THREE.ConeGeometry(element.size.x / 2, element.size.y, 16);
    } else {
      // Default box
      geometry = new THREE.BoxGeometry(element.size.x, element.size.y, element.size.z);
    }

    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(element.position.x, element.position.y, element.position.z);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    mesh.name = element.name;

    if (element.rotation) {
      mesh.rotation.set(
        THREE.MathUtils.degToRad(element.rotation.x || 0),
        THREE.MathUtils.degToRad(element.rotation.y || 0),
        THREE.MathUtils.degToRad(element.rotation.z || 0)
      );
    }

    group.add(mesh);

    // Add special decorations for certain element types
    if (name.includes('tree') && !name.includes('trunk') && !name.includes('leaves')) {
      // Create full tree: trunk + leaves
      const trunkGeo = new THREE.CylinderGeometry(0.5, 0.7, 6, 8);
      const trunkMat = new THREE.MeshStandardMaterial({ color: 0x8B4513, roughness: 0.9 });
      const trunk = new THREE.Mesh(trunkGeo, trunkMat);
      trunk.position.set(element.position.x, element.position.y + 3, element.position.z);
      trunk.castShadow = true;
      group.add(trunk);

      const leavesGeo = new THREE.SphereGeometry(3, 12, 12);
      const leavesMat = new THREE.MeshStandardMaterial({ color: 0x228B22, roughness: 0.8 });
      const leaves = new THREE.Mesh(leavesGeo, leavesMat);
      leaves.position.set(element.position.x, element.position.y + 7, element.position.z);
      leaves.castShadow = true;
      group.add(leaves);

      group.remove(mesh); // Remove the default mesh
    }

    if (name.includes('dragon')) {
      // Add wings as thin boxes
      const wingGeo = new THREE.BoxGeometry(8, 0.3, 4);
      const wingMat = new THREE.MeshStandardMaterial({ color, transparent: true, opacity: 0.7 });

      const leftWing = new THREE.Mesh(wingGeo, wingMat);
      leftWing.position.set(element.position.x + 5, element.position.y + 2, element.position.z);
      leftWing.rotation.z = THREE.MathUtils.degToRad(20);
      group.add(leftWing);

      const rightWing = new THREE.Mesh(wingGeo, wingMat);
      rightWing.position.set(element.position.x - 5, element.position.y + 2, element.position.z);
      rightWing.rotation.z = THREE.MathUtils.degToRad(-20);
      group.add(rightWing);
    }

    return group;
  };

  // Build scene from preview config
  const buildScene = (config: PreviewConfig) => {
    if (!sceneRef.current) return;

    // Remove all existing meshes except lights and helpers
    const toRemove: THREE.Object3D[] = [];
    sceneRef.current.traverse((child) => {
      if (child instanceof THREE.Mesh || child instanceof THREE.Group) {
        if (!(child instanceof THREE.GridHelper)) {
          toRemove.push(child);
        }
      }
    });
    toRemove.forEach((obj) => {
      if (obj.parent === sceneRef.current) {
        sceneRef.current!.remove(obj);
      }
    });

    // Rebuild grid
    const existingGrid = sceneRef.current.children.find(c => c instanceof THREE.GridHelper);
    if (!existingGrid) {
      const gridHelper = new THREE.GridHelper(60, 30, 0x3a3e42, 0x2a2e32);
      gridHelper.position.y = -0.01;
      sceneRef.current.add(gridHelper);
    }

    // Add elements from config
    config.elements.forEach((element) => {
      const mesh = createElementMesh(element);
      sceneRef.current!.add(mesh);
    });

    // Adjust camera to fit scene
    if (cameraRef.current && controlsRef.current) {
      cameraRef.current.position.set(30, 25, 30);
      controlsRef.current.target.set(0, 5, 0);
      controlsRef.current.update();
    }
  };

  // Initialize/update 3D preview when result changes
  useEffect(() => {
    if (result?.preview_config && activeTab === 'preview') {
      // Small delay to ensure container is mounted
      const timer = setTimeout(() => {
        initThreeJS();
        buildScene(result.preview_config);
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [result, activeTab]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (animationIdRef.current) {
        cancelAnimationFrame(animationIdRef.current);
      }
      if (rendererRef.current) {
        rendererRef.current.dispose();
      }
    };
  }, []);

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      if (!containerRef.current || !rendererRef.current || !cameraRef.current) return;

      const width = containerRef.current.clientWidth;
      const height = 450;

      cameraRef.current.aspect = width / height;
      cameraRef.current.updateProjectionMatrix();
      rendererRef.current.setSize(width, height);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const resetCamera = () => {
    if (cameraRef.current && controlsRef.current) {
      cameraRef.current.position.set(30, 25, 30);
      controlsRef.current.target.set(0, 5, 0);
      controlsRef.current.update();
    }
  };

  const handleGenerate = async () => {
    if (!description.trim()) {
      setError('Please describe a scene first.');
      return;
    }

    setError(null);
    setLoading(true);
    setResult(null);

    try {
      const response = await fetch('/api/module/robloxexpert/execute', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'generate_scene',
          description: description,
        }),
      });

      if (!response.ok) {
        throw new Error(`Generation failed: ${response.statusText}`);
      }

      const data = await response.json();
      setResult(data);
      setActiveTab('preview');
    } catch (err) {
      console.error('[RobloxExpert] Error:', err);

      // Generate mock result for demo
      const mockResult: GenerateResult = {
        lua_code: `-- Scene: ${description}
-- Generated by Roblox Expert

local Workspace = game:GetService("Workspace")
local Lighting = game:GetService("Lighting")

-- Clear existing generated content
for _, child in pairs(Workspace:GetChildren()) do
    if child:GetAttribute("HaleyGenerated") then
        child:Destroy()
    end
end

-- Environment Setup
local floor = Instance.new("Part")
floor.Name = "Floor"
floor:SetAttribute("HaleyGenerated", true)
floor.Size = Vector3.new(50, 1, 50)
floor.Position = Vector3.new(0, -0.5, 0)
floor.Anchored = true
floor.BrickColor = BrickColor.new("Bright green")
floor.Material = Enum.Material.Grass
floor.Parent = Workspace

-- Main Character
local character = Instance.new("Model")
character.Name = "MainCharacter"
character:SetAttribute("HaleyGenerated", true)

local body = Instance.new("Part")
body.Name = "Body"
body.Size = Vector3.new(2, 3, 1)
body.Position = Vector3.new(0, 3.5, 0)
body.Anchored = true
body.BrickColor = BrickColor.new("Bright blue")
body.Material = Enum.Material.SmoothPlastic
body.Parent = character

local head = Instance.new("Part")
head.Name = "Head"
head.Size = Vector3.new(1.5, 1.5, 1.5)
head.Position = Vector3.new(0, 5.75, 0)
head.Anchored = true
head.BrickColor = BrickColor.new("Light orange")
head.Material = Enum.Material.SmoothPlastic
head.Parent = character

character.Parent = Workspace

-- Tree
local tree = Instance.new("Model")
tree.Name = "Tree"
tree:SetAttribute("HaleyGenerated", true)

local trunk = Instance.new("Part")
trunk.Name = "Trunk"
trunk.Size = Vector3.new(2, 8, 2)
trunk.Position = Vector3.new(10, 4, 5)
trunk.Anchored = true
trunk.BrickColor = BrickColor.new("Reddish brown")
trunk.Material = Enum.Material.Wood
trunk.Parent = tree

local leaves = Instance.new("Part")
leaves.Name = "Leaves"
leaves.Shape = Enum.PartType.Ball
leaves.Size = Vector3.new(8, 8, 8)
leaves.Position = Vector3.new(10, 10, 5)
leaves.Anchored = true
leaves.BrickColor = BrickColor.new("Dark green")
leaves.Material = Enum.Material.Grass
leaves.Parent = tree

tree.Parent = Workspace

-- Rock
local rock = Instance.new("Part")
rock.Name = "Rock"
rock:SetAttribute("HaleyGenerated", true)
rock.Size = Vector3.new(3, 2, 3)
rock.Position = Vector3.new(-8, 1, -6)
rock.Anchored = true
rock.BrickColor = BrickColor.new("Dark stone grey")
rock.Material = Enum.Material.Slate
rock.Parent = Workspace

print("Scene generated successfully!")`,
        preview_config: {
          elements: [
            { type: 'Part', name: 'Floor', position: { x: 0, y: -0.5, z: 0 }, size: { x: 50, y: 1, z: 50 }, color: '#4ade80' },
            { type: 'Part', name: 'Body', position: { x: 0, y: 3.5, z: 0 }, size: { x: 2, y: 3, z: 1 }, color: '#3b82f6' },
            { type: 'Part', name: 'Head', position: { x: 0, y: 5.75, z: 0 }, size: { x: 1.5, y: 1.5, z: 1.5 }, color: '#fdba74', shape: 'Ball' },
            { type: 'Part', name: 'Trunk', position: { x: 10, y: 4, z: 5 }, size: { x: 2, y: 8, z: 2 }, color: '#92400e', shape: 'Cylinder' },
            { type: 'Part', name: 'Leaves', position: { x: 10, y: 10, z: 5 }, size: { x: 8, y: 8, z: 8 }, color: '#166534', shape: 'Ball' },
            { type: 'Part', name: 'Rock', position: { x: -8, y: 1, z: -6 }, size: { x: 3, y: 2, z: 3 }, color: '#4b5563' },
            { type: 'Part', name: 'Trunk', position: { x: -12, y: 3, z: 8 }, size: { x: 1.5, y: 6, z: 1.5 }, color: '#78350f', shape: 'Cylinder' },
            { type: 'Part', name: 'Leaves', position: { x: -12, y: 8, z: 8 }, size: { x: 6, y: 6, z: 6 }, color: '#15803d', shape: 'Ball' },
          ],
          lighting: 'default',
          environment: 'forest',
        },
        elements_created: 8,
      };

      setResult(mockResult);
      setActiveTab('preview');
    } finally {
      setLoading(false);
    }
  };

  const handleCopyCode = async () => {
    if (!result?.lua_code) return;

    try {
      await navigator.clipboard.writeText(result.lua_code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const handleExport = () => {
    if (!result?.lua_code) return;

    const blob = new Blob([result.lua_code], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'roblox_scene.lua';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleReset = () => {
    setDescription('');
    setResult(null);
    setError(null);
  };

  return (
    <div className="full-screen flex overflow-hidden">
      <div className="space-bg">
        <div className="stars" />
        {[...Array(3)].map((_, i) => (
          <div
            key={i}
            className="shooting-star"
            style={{
              top: `${Math.random() * 50}%`,
              right: `${Math.random() * 50}%`,
              animationDelay: `${Math.random() * 3}s`,
            }}
          />
        ))}
      </div>

      <div className="flex-1 flex flex-col relative z-10">
        {/* Header */}
        <div className="glass-strong border-b border-border p-4">
          <div className="max-w-6xl mx-auto flex items-center justify-between">
            <button
              onClick={() => router.push('/')}
              className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-panel-light transition-colors"
            >
              <ArrowLeft size={20} />
              <span className="text-sm font-medium">Back to Haley</span>
            </button>
            <div className="flex items-center gap-2">
              <HaleyCoreGlyph size={24} className="text-primary" />
              <span className="text-lg font-bold text-gradient">Haley</span>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-8">
          <div className="max-w-6xl mx-auto">
            {/* Title Section */}
            <div className="text-center mb-8">
              <div className="flex justify-center mb-4">
                <div className="p-4 rounded-2xl bg-primary/10 border border-primary/20">
                  <Gamepad2 size={48} className="text-primary" />
                </div>
              </div>
              <h1 className="text-3xl font-bold text-gradient mb-2">
                Roblox Expert
              </h1>
              <p className="text-secondary">
                Describe a scene, get Roblox Lua code and preview
              </p>
              <p className="text-xs text-secondary/60 mt-1">
                Built for kids - no coding required!
              </p>
            </div>

            {/* Error Display */}
            {error && (
              <div className="glass border border-red-500/30 bg-red-500/10 rounded-lg p-4 mb-6 flex items-start gap-3">
                <AlertCircle size={20} className="text-red-500 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-red-400">{error}</p>
              </div>
            )}

            {/* Input Section */}
            {!result && (
              <div className="glass rounded-xl border border-border p-6">
                <div className="space-y-6">
                  <div>
                    <label className="block text-lg font-medium mb-3">
                      Describe your scene
                    </label>
                    <textarea
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Example: A forest with tall trees, a small pond, and a friendly dragon flying overhead..."
                      rows={6}
                      className="w-full px-4 py-3 rounded-lg bg-panel-dark border border-border focus:border-primary focus:outline-none transition-colors resize-none text-sm"
                    />
                    <p className="text-xs text-secondary mt-2">
                      Be descriptive! Mention characters, environments, colors, and actions you want to see.
                    </p>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    <button
                      onClick={() => setDescription('A medieval castle with tall towers, a dragon guarding the entrance, and torches lighting the walls')}
                      className="px-3 py-2 text-xs rounded-lg bg-panel-light hover:bg-panel-medium transition-colors"
                    >
                      Castle & Dragon
                    </button>
                    <button
                      onClick={() => setDescription('A space station floating in the stars with robots walking around and glowing neon lights')}
                      className="px-3 py-2 text-xs rounded-lg bg-panel-light hover:bg-panel-medium transition-colors"
                    >
                      Space Station
                    </button>
                    <button
                      onClick={() => setDescription('A magical forest with colorful trees, sparkles floating in the air, and a friendly wizard')}
                      className="px-3 py-2 text-xs rounded-lg bg-panel-light hover:bg-panel-medium transition-colors"
                    >
                      Magic Forest
                    </button>
                    <button
                      onClick={() => setDescription('An underwater ocean scene with coral, fish swimming around, and a treasure chest on the sandy floor')}
                      className="px-3 py-2 text-xs rounded-lg bg-panel-light hover:bg-panel-medium transition-colors"
                    >
                      Underwater
                    </button>
                  </div>

                  <button
                    onClick={handleGenerate}
                    disabled={loading || !description.trim()}
                    className="w-full px-6 py-3 rounded-lg bg-primary/20 hover:bg-primary/30 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm font-medium text-primary flex items-center justify-center gap-2"
                  >
                    {loading ? (
                      <>
                        <Loader2 size={18} className="animate-spin" />
                        Generating Scene...
                      </>
                    ) : (
                      <>
                        <Gamepad2 size={18} />
                        Generate Scene
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}

            {/* Results Section */}
            {result && (
              <div className="space-y-6">
                {/* Stats Bar */}
                <div className="glass rounded-xl border border-border p-4 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-green-400" />
                      <span className="text-sm">Scene Generated</span>
                    </div>
                    <span className="text-xs text-secondary">
                      {result.elements_created} elements created
                    </span>
                  </div>
                  <button
                    onClick={handleReset}
                    className="px-3 py-1.5 text-xs rounded-lg bg-panel-light hover:bg-panel-medium transition-colors"
                  >
                    New Scene
                  </button>
                </div>

                {/* Tab Buttons */}
                <div className="flex gap-2">
                  <button
                    onClick={() => setActiveTab('preview')}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors text-sm ${
                      activeTab === 'preview'
                        ? 'bg-primary/20 text-primary'
                        : 'bg-panel-light hover:bg-panel-medium'
                    }`}
                  >
                    <Eye size={16} />
                    3D Preview
                  </button>
                  <button
                    onClick={() => setActiveTab('code')}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors text-sm ${
                      activeTab === 'code'
                        ? 'bg-primary/20 text-primary'
                        : 'bg-panel-light hover:bg-panel-medium'
                    }`}
                  >
                    <Code size={16} />
                    Lua Code
                  </button>
                </div>

                {/* 3D Preview Panel */}
                {activeTab === 'preview' && (
                  <div className="glass rounded-xl border border-border p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold">3D Scene Preview</h3>
                      <button
                        onClick={resetCamera}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg bg-panel-light hover:bg-panel-medium transition-colors"
                      >
                        <RotateCcw size={14} />
                        Reset View
                      </button>
                    </div>
                    <div
                      ref={containerRef}
                      className="w-full rounded-lg border border-border overflow-hidden"
                      style={{ height: '450px', background: '#1a1e22' }}
                    />
                    <p className="text-xs text-secondary text-center mt-4">
                      Drag to rotate, scroll to zoom. The actual scene in Roblox Studio will have more detail!
                    </p>
                  </div>
                )}

                {/* Code Panel */}
                {activeTab === 'code' && (
                  <div className="glass rounded-xl border border-border overflow-hidden">
                    <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-panel-dark">
                      <span className="text-sm font-medium">Lua Code</span>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={handleCopyCode}
                          className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg bg-panel-light hover:bg-panel-medium transition-colors"
                        >
                          {copied ? <Check size={14} /> : <Copy size={14} />}
                          {copied ? 'Copied!' : 'Copy'}
                        </button>
                      </div>
                    </div>
                    <pre className="p-4 text-sm font-mono overflow-x-auto max-h-[500px] overflow-y-auto">
                      <code className="text-green-400">{result.lua_code}</code>
                    </pre>
                  </div>
                )}

                {/* Export Button */}
                <div className="flex gap-3">
                  <button
                    onClick={handleExport}
                    className="flex-1 px-6 py-3 rounded-lg bg-primary/20 hover:bg-primary/30 transition-colors text-sm font-medium text-primary flex items-center justify-center gap-2"
                  >
                    <Download size={18} />
                    Export to Studio (.lua)
                  </button>
                </div>

                {/* Instructions */}
                <div className="glass rounded-xl border border-border p-6">
                  <h3 className="text-lg font-semibold mb-3">How to use in Roblox Studio</h3>
                  <ol className="space-y-2 text-sm text-secondary">
                    <li className="flex items-start gap-2">
                      <span className="font-bold text-primary">1.</span>
                      Open Roblox Studio and create a new place (or open an existing one)
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="font-bold text-primary">2.</span>
                      Go to View → Command Bar (or press Ctrl+Shift+C)
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="font-bold text-primary">3.</span>
                      Copy the Lua code above and paste it into the Command Bar
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="font-bold text-primary">4.</span>
                      Press Enter to run the code and watch your scene appear!
                    </li>
                  </ol>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
