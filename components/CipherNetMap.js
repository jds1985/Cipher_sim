'use client';

import { useEffect, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import * as THREE from 'three';

//  SAFE dynamic import (prevents SSR crash)
const ForceGraph3D = dynamic(
  () => import('react-force-graph-3d'),
  { ssr: false }
);

// Firebase
import { db } from '../lib/firebaseClient';
import { collection, getDocs } from 'firebase/firestore';

export default function CipherNetMap() {
  const fgRef = useRef(null);

  const [fullData, setFullData] = useState({ nodes: [], links: [] });
  const [data, setData] = useState({ nodes: [], links: [] });
  const [selectedNode, setSelectedNode] = useState(null);
  const [risk, setRisk] = useState(0);

  // 🔥 ADDED: SIZE FIX
  const [size, setSize] = useState({ width: 300, height: 300 });

  //  ADD FROM FIRESTORE
 //  useEffect(() => {
 // async function loadNodes() {
 //   try {
 //     const colRef = collection(
 //       db,
 //   'memory_nodes',
 //    'demo', // 🔥 IMPORTANT: match what you created
 //   'nodes'
 //   );

 //  const snap = await getDocs(colRef); // ✅ THIS WAS MISSING

 //   const nodes = [];
 //   const links = [];

 //   snap.forEach((doc) => {
 //    const d = doc.data();

 //    nodes.push({
 //      id: doc.id,
 //      name: d.title || 'Node',
 //      trust: d.importance || 0.5,
 //      group: d.type || 'med',
 //      locked: false,
 //    });
 //   });

 //   // ✅ ADD CORE NODE
 //   nodes.push({
 //     id: 'core',
 //    name: 'Cipher Core',
 //    trust: 1,
 //     group: 'core'
 //   });

 //    const full = { nodes, links };
 //   setFullData(full);
 //    setData(full);

 //   setTimeout(() => {
 //     nodes.forEach((node) => {
 //       if (node.id === 'core') {
 //         node.x = 0;
 //         node.y = 0;
 //         node.z = 0;
 //         return;
 //       }

 //       let radius = 120;
 //       if (node.trust > 0.8) radius = 120;
 //       else if (node.trust > 0.5) radius = 240;
 //       else radius = 360;

 //       const angle = Math.random() * Math.PI * 2;

 //       node.x = Math.cos(angle) * radius;
 //       node.z = Math.sin(angle) * radius;
 //       node.y = (Math.random() - 0.5) * 80;
 //     });

 //     fgRef.current?.zoomToFit?.(400);
 //   }, 500);

 //   } catch (e) {
 //     console.error('Firestore load error:', e);
 //   }
 // }

 //   loadNodes();
 // }, []);

  // 🔥 TEST MODE (TEMP)
  useEffect(() => {
    const nodes = [
      {
        id: 'core',
        name: 'Core',
        trust: 1,
        group: 'core',
        x: 0,
        y: 0,
        z: 0
      },
      {
        id: 'test',
        name: 'TEST NODE',
        trust: 0.8,
        group: 'med',
        x: 100,
        y: 0,
        z: 0
      }
    ];

    setFullData({ nodes, links: [] });
    setData({ nodes, links: [] });

    setTimeout(() => {
      fgRef.current?.zoomToFit?.(400);
    }, 500);
  }, []);

  // 🔥 ADDED: SIZE HANDLER
  useEffect(() => {
    function updateSize() {
      setSize({
        width: window.innerWidth,
        height: window.innerHeight
      });
    }

    updateSize();
    window.addEventListener('resize', updateSize);

    return () => window.removeEventListener('resize', updateSize);
  }, []);

  // 🎛 RISK FILTER
  useEffect(() => {
    const filteredNodes = fullData.nodes.filter((n) => n.trust >= risk);

    const filteredLinks = fullData.links.filter(
      (l) =>
        filteredNodes.find((n) => n.id === l.source) &&
        filteredNodes.find((n) => n.id === l.target)
    );

    setData({ nodes: filteredNodes, links: filteredLinks });
  }, [risk, fullData]);

  const getNodeColor = (node) => {
    if (node.group === 'core') return '#ffffff';
    if (node.trust > 0.8) return '#00ff88';
    if (node.trust > 0.5) return '#ffcc00';
    return '#ff3366';
  };

  const handleNodeClick = (node) => {
    setSelectedNode(node);

    if (fgRef.current) {
      fgRef.current.cameraPosition?.(
        { x: node.x * 1.5, y: node.y * 1.5, z: node.z * 1.5 },
        node,
        800
      );
    }

    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      navigator.vibrate(50);
    }
  };

  return (
    <div className="w-full h-screen bg-black relative">
      {/* 🌌 YOUR GALAXY IS BACK */}
      <div style={{ position: 'absolute', color: 'white', zIndex: 10 }}>
        Nodes: {data.nodes.length}
      </div>

      <ForceGraph3D
        ref={fgRef}

        // 🔥 FIXED WIDTH/HEIGHT
        width={size.width}
        height={size.height}

        graphData={data}
        nodeLabel="name"
        nodeColor={getNodeColor}
        nodeVal={(node) => node.trust * 8 + 2}
        backgroundColor="#000011"
        linkWidth={1.5}
        linkColor={() => '#4444ff'}
        enableNodeDrag
        onNodeClick={handleNodeClick}
        showNavInfo={false}
        cooldownTicks={100}

        // 🔥 FIXED RENDERING (NO SPRITES)
        nodeThreeObject={(node) => {
          const geometry = new THREE.SphereGeometry(
            node.group === 'core' ? 10 : 6,
            16,
            16
          );

          const material = new THREE.MeshBasicMaterial({
            color: getNodeColor(node),
          });

          return new THREE.Mesh(geometry, material);
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
  );
}
