'use client';

import { useEffect, useRef, useState } from 'react'; import ForceGraph3D from 'react-force-graph-3d'; import * as THREE from 'three';

// 🔥 Firebase import { db } from '../lib/firebaseClient'; import { collection, getDocs } from 'firebase/firestore';

interface Node { id: string; name: string; trust: number; group?: string; locked?: boolean; }

interface Link { source: string; target: string; }

interface GraphData { nodes: Node[]; links: Link[]; }

export default function CipherNetMap() { const fgRef = useRef<any>();

const [fullData, setFullData] = useState<GraphData>({ nodes: [], links: [] }); const [data, setData] = useState<GraphData>({ nodes: [], links: [] }); const [selectedNode, setSelectedNode] = useState<Node | null>(null); const [risk, setRisk] = useState(0);

// 🔥 FETCH FROM FIRESTORE useEffect(() => { async function loadNodes() { try { const snap = await getDocs(collection(db, 'cipher_nodes'));

const nodes: Node[] = [];
    const links: Link[] = [];

    snap.forEach((doc) => {
      const d = doc.data();

      nodes.push({
        id: doc.id,
        name: d.name,
        trust: d.trust || 0.5,
        group: d.group || 'med',
        locked: d.locked || false,
      });

      if (d.links) {
        d.links.forEach((target: string) => {
          links.push({ source: doc.id, target });
        });
      }
    });

    // 🌌 ADD CORE NODE
    nodes.push({ id: 'core', name: 'Cipher Core', trust: 1, group: 'core' });

    const full = { nodes, links };
    setFullData(full);
    setData(full);

    // 🎯 ORBITAL POSITIONING
    setTimeout(() => {
      nodes.forEach((node) => {
        if (node.id === 'core') {
          node['x'] = 0;
          node['y'] = 0;
          node['z'] = 0;
          return;
        }

        let radius = 120;
        if (node.trust > 0.8) radius = 120;
        else if (node.trust > 0.5) radius = 240;
        else radius = 360;

        const angle = Math.random() * Math.PI * 2;

        node['x'] = Math.cos(angle) * radius;
        node['z'] = Math.sin(angle) * radius;
        node['y'] = (Math.random() - 0.5) * 80;
      });

      fgRef.current?.zoomToFit(400);
    }, 500);
  } catch (e) {
    console.error('Firestore load error:', e);
  }
}

loadNodes();

}, []);

// 🎛 RISK FILTER useEffect(() => { const filteredNodes = fullData.nodes.filter((n) => n.trust >= risk); const filteredLinks = fullData.links.filter( (l) => filteredNodes.find((n) => n.id === l.source) && filteredNodes.find((n) => n.id === l.target) );

setData({ nodes: filteredNodes, links: filteredLinks });

}, [risk, fullData]);

const getNodeColor = (node: Node) => { if (node.group === 'core') return '#ffffff'; if (node.trust > 0.8) return '#00ff88'; if (node.trust > 0.5) return '#ffcc00'; return '#ff3366'; };

const handleNodeClick = (node: Node) => { setSelectedNode(node);

if (fgRef.current) {
  fgRef.current.cameraPosition(
    { x: node['x'] * 1.5, y: node['y'] * 1.5, z: node['z'] * 1.5 },
    node,
    800
  );
}

if ('vibrate' in navigator) navigator.vibrate(50);

};

return ( <div className="w-full h-screen bg-black relative"> <ForceGraph3D ref={fgRef} graphData={data} nodeLabel="name" nodeColor={getNodeColor} nodeVal={(node: Node) => node.trust * 8 + 2} backgroundColor="#000011" linkWidth={1.5} linkColor={() => '#4444ff'} enableNodeDrag onNodeClick={handleNodeClick} showNavInfo={false} nodeThreeObject={(node: Node) => { const material = new THREE.SpriteMaterial({ color: getNodeColor(node), opacity: node.locked ? 0.3 : 0.9, transparent: true, });

const sprite = new THREE.Sprite(material);
      sprite.scale.set(node.group === 'core' ? 14 : 8, node.group === 'core' ? 14 : 8, 1);
      return sprite;
    }}
  />

  {/* 🌌 RINGS */}
  <div className="absolute inset-0 pointer-events-none">
    <div className="absolute inset-0 border border-green-500/10 rounded-full scale-[0.3]" />
    <div className="absolute inset-0 border border-yellow-500/10 rounded-full scale-[0.5]" />
    <div className="absolute inset-0 border border-red-500/10 rounded-full scale-[0.7]" />
  </div>

  {/* 🧠 NODE PANEL */}
  {selectedNode && (
    <div className="absolute top-4 right-4 bg-gray-900/80 p-4 rounded-lg text-white border border-blue-500 w-64">
      <h3 className="text-lg font-bold">{selectedNode.name}</h3>
      <p>Trust: {(selectedNode.trust * 100).toFixed(0)}%</p>

      {selectedNode.locked ? (
        <button className="mt-3 w-full px-4 py-2 bg-purple-600 rounded">
          Unlock Node
        </button>
      ) : (
        <button
          onClick={() => alert(`Routing to ${selectedNode.name}`)}
          className="mt-3 w-full px-4 py-2 bg-blue-600 rounded"
        >
          Deploy
        </button>
      )}
    </div>
  )}

  {/* 🎛 RISK SLIDER */}
  <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-gray-900/70 p-3 rounded-full flex items-center gap-4">
    <span className="text-white">Risk</span>
    <input
      type="range"
      min="0"
      max="1"
      step="0.1"
      value={risk}
      onChange={(e) => setRisk(parseFloat(e.target.value))}
      className="w-48"
    />
  </div>
</div>

); }
