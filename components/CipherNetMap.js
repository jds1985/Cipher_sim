'use client';

import { useEffect, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import * as THREE from 'three';

// ============================================================================
// SAFE DYNAMIC IMPORT
// Prevents SSR crash with react-force-graph-3d
// ============================================================================
const ForceGraph3D = dynamic(
  () => import('react-force-graph-3d'),
  { ssr: false }
);

// ============================================================================
// FIREBASE
// ============================================================================
import { db } from '../lib/firebaseClient';
import { collection, getDocs } from 'firebase/firestore';

// ============================================================================
// COMPONENT
// ============================================================================
export default function CipherNetMap() {
  const fgRef = useRef(null);

  // ==========================================================================
  // STATE
  // ==========================================================================
  const [fullData, setFullData] = useState({ nodes: [], links: [] });
  const [data, setData] = useState({ nodes: [], links: [] });
  const [selectedNode, setSelectedNode] = useState(null);
  const [risk, setRisk] = useState(0);

  // ==========================================================================
  // DEBUG / STATUS STATE
  // ==========================================================================
  const [loading, setLoading] = useState(true);
  const [errorText, setErrorText] = useState('');

  // ==========================================================================
  // SIZE FIX FOR MOBILE / PORTRAIT
  // ==========================================================================
  const [size, setSize] = useState({
    width: 300,
    height: 300
  });

  // ==========================================================================
  // DEBUG COUNT FOR RENDER
  // ==========================================================================
  const debugCount = fullData.nodes.length;

  // ==========================================================================
  // LIVE FIRESTORE DATA MODE
  // IMPORTANT:
  // If your real user id is longer than this, replace ONLY the string below.
  // Use the exact full document id from Firebase:
  // memory_nodes / YOUR_USER_ID / nodes / {doc}
  // ==========================================================================
  useEffect(() => {
    async function loadNodes() {
      try {
        setLoading(true);
        setErrorText('');

        const USER_ID = 'VkIdfn4SwyMzEIPLY';

        const colRef = collection(
          db,
          'memory_nodes',
          USER_ID,
          'nodes'
        );

        const snap = await getDocs(colRef);

        const nodes = [];
        const links = [];

        snap.forEach((doc) => {
          const d = doc.data() || {};

          nodes.push({
            id: doc.id,
            name: d.title || d.content || 'Node',
            trust: typeof d.importance === 'number' ? d.importance : 0.5,
            group: d.type === 'knowledge' ? 'memory' : (d.type || 'memory'),
            locked: false,
            x: Math.random() * 200 - 100,
            y: Math.random() * 200 - 100,
            z: Math.random() * 200 - 100
          });

          links.push({
            source: 'core',
            target: doc.id
          });
        });

        // --------------------------------------------------------------------
        // FALLBACK NODE IF FIRESTORE COMES BACK EMPTY
        // --------------------------------------------------------------------
        if (nodes.length === 0) {
          nodes.push({
            id: 'fallback',
            name: 'Fallback Node',
            trust: 0.5,
            group: 'memory',
            locked: false,
            x: 80,
            y: 0,
            z: 0
          });

          links.push({
            source: 'core',
            target: 'fallback'
          });
        }

        // --------------------------------------------------------------------
        // CORE NODE
        // --------------------------------------------------------------------
        nodes.push({
          id: 'core',
          name: 'Cipher Core',
          trust: 1,
          group: 'core',
          locked: false,
          fx: 0,
          fy: 0,
          fz: 0
        });

        const full = { nodes, links };
        setFullData(full);
        setData(full);

        setTimeout(() => {
          fgRef.current?.zoomToFit?.(400);
        }, 500);
      } catch (e) {
        console.error('Firestore load error:', e);
        setErrorText(e?.message || 'Firestore load failed');
      } finally {
        setLoading(false);
      }
    }

    loadNodes();
  }, []);

  // ==========================================================================
  // TEST MODE (DISABLED, KEPT IN FILE ON PURPOSE)
  // ==========================================================================
  // useEffect(() => {
  //   const nodes = [];
  //   const links = [];
  //   const types = ['memory', 'tool', 'agent'];
  //
  //   nodes.push({
  //     id: 'core',
  //     name: 'Core',
  //     trust: 1,
  //     group: 'core',
  //     locked: false
  //   });
  //
  //   for (let i = 0; i < 20; i++) {
  //     const id = `node-${i}`;
  //     const type = types[Math.floor(Math.random() * types.length)];
  //
  //     nodes.push({
  //       id,
  //       name:
  //         type === 'memory'
  //           ? `Memory ${i}`
  //           : type === 'tool'
  //           ? `Tool ${i}`
  //           : `Agent ${i}`,
  //       trust: Math.random(),
  //       group: type,
  //       locked: false
  //     });
  //
  //     links.push({
  //       source: 'core',
  //       target: id
  //     });
  //
  //     if (i > 2) {
  //       links.push({
  //         source: id,
  //         target: `node-${Math.floor(Math.random() * i)}`
  //       });
  //     }
  //   }
  //
  //   nodes.forEach((n) => {
  //     if (n.id === 'core') {
  //       n.fx = 0;
  //       n.fy = 0;
  //       n.fz = 0;
  //     }
  //   });
  //
  //   setFullData({ nodes, links });
  //   setData({ nodes, links });
  //
  //   setTimeout(() => {
  //     fgRef.current?.zoomToFit?.(400);
  //   }, 500);
  // }, []);

  // ==========================================================================
  // LEGACY FIRESTORE LOADER (DISABLED, KEPT FOR REFERENCE)
  // ==========================================================================
  // useEffect(() => {
  //   async function loadNodes() {
  //     try {
  //       const colRef = collection(
  //         db,
  //         'memory_nodes',
  //         'demo',
  //         'nodes'
  //       );
  //
  //       const snap = await getDocs(colRef);
  //
  //       const nodes = [];
  //       const links = [];
  //
  //       snap.forEach((doc) => {
  //         const d = doc.data();
  //
  //         nodes.push({
  //           id: doc.id,
  //           name: d.title || 'Node',
  //           trust: d.importance || 0.5,
  //           group: d.type || 'memory',
  //           locked: false
  //         });
  //       });
  //
  //       nodes.push({
  //         id: 'core',
  //         name: 'Cipher Core',
  //         trust: 1,
  //         group: 'core'
  //       });
  //
  //       const full = { nodes, links };
  //       setFullData(full);
  //       setData(full);
  //
  //       setTimeout(() => {
  //         nodes.forEach((node) => {
  //           if (node.id === 'core') {
  //             node.x = 0;
  //             node.y = 0;
  //             node.z = 0;
  //             return;
  //           }
  //
  //           let radius = 120;
  //           if (node.trust > 0.8) radius = 120;
  //           else if (node.trust > 0.5) radius = 240;
  //           else radius = 360;
  //
  //           const angle = Math.random() * Math.PI * 2;
  //
  //           node.x = Math.cos(angle) * radius;
  //           node.z = Math.sin(angle) * radius;
  //           node.y = (Math.random() - 0.5) * 80;
  //         });
  //
  //         fgRef.current?.zoomToFit?.(400);
  //       }, 500);
  //     } catch (e) {
  //       console.error('Firestore load error:', e);
  //     }
  //   }
  //
  //   loadNodes();
  // }, []);

  // ==========================================================================
  // SIZE HANDLER
  // ==========================================================================
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

  // ==========================================================================
  // RISK FILTER
  // ==========================================================================
  useEffect(() => {
    const filteredNodes = fullData.nodes.filter((n) => n.trust >= risk);

    const filteredLinks = fullData.links.filter((l) => {
      const sourceId = typeof l.source === 'object' ? l.source.id : l.source;
      const targetId = typeof l.target === 'object' ? l.target.id : l.target;

      return (
        filteredNodes.find((n) => n.id === sourceId) &&
        filteredNodes.find((n) => n.id === targetId)
      );
    });

    setData({
      nodes: filteredNodes,
      links: filteredLinks
    });
  }, [risk, fullData]);

  // ==========================================================================
  // NODE COLOR SYSTEM
  // ==========================================================================
  const getNodeColor = (node) => {
    if (node.group === 'core') return '#ffffff';
    if (node.group === 'memory') return '#00ff88';
    if (node.group === 'tool') return '#ffcc00';
    if (node.group === 'agent') return '#ff3366';
    return '#888888';
  };

  // ==========================================================================
  // NODE CLICK HANDLER
  // ==========================================================================
  const handleNodeClick = (node) => {
    setSelectedNode(node);

    if (fgRef.current) {
      fgRef.current.cameraPosition?.(
        {
          x: (node.x || 0) * 1.5,
          y: (node.y || 0) * 1.5,
          z: (node.z || 0) * 1.5
        },
        node,
        800
      );
    }

    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      navigator.vibrate(50);
    }
  };

  // ==========================================================================
  // RENDER
  // ==========================================================================
  return (
    <div className="w-full h-screen bg-black relative">
      {/* ===================================================================== */}
      {/* DEBUG / STATUS */}
      {/* ===================================================================== */}
      <div
        style={{
          position: 'absolute',
          color: 'white',
          zIndex: 20,
          left: 8,
          top: 8,
          fontSize: 14
        }}
      >
        Nodes: {data.nodes.length} | Full: {debugCount}
      </div>

      {loading && (
        <div
          style={{
            position: 'absolute',
            color: '#9ca3af',
            zIndex: 20,
            left: 8,
            top: 30,
            fontSize: 13
          }}
        >
          Loading CipherNet...
        </div>
      )}

      {errorText && (
        <div
          style={{
            position: 'absolute',
            color: '#ff7777',
            zIndex: 20,
            left: 8,
            top: 52,
            fontSize: 13,
            maxWidth: 320
          }}
        >
          Error: {errorText}
        </div>
      )}

      {/* ===================================================================== */}
      {/* GRAPH */}
      {/* ===================================================================== */}
      {data.nodes.length > 0 && (
        <ForceGraph3D
          ref={fgRef}
          width={size.width}
          height={size.height}
          graphData={data}
          nodeLabel="name"
          nodeColor={getNodeColor}
          nodeVal={(node) => node.trust * 8 + 2}
          nodeRelSize={6}
          nodeOpacity={0.95}
          backgroundColor="#000011"
          linkWidth={1.5}
          linkColor={() => '#4444ff'}
          linkOpacity={0.3}
          enableNodeDrag
          onNodeClick={handleNodeClick}
          showNavInfo={false}

          // ==================================================================
          // PHYSICS
          // ==================================================================
          cooldownTicks={300}
          d3AlphaDecay={0.02}
          d3VelocityDecay={0.3}

          d3Force="charge"
          d3ForceConfig={{ strength: -120 }}

          onEngineStop={() => {
            fgRef.current?.zoomToFit?.(400);
          }}

          // ==================================================================
          // NODE RENDERER
          // ==================================================================
          nodeThreeObject={(node) => {
            const geometry = new THREE.SphereGeometry(
              node.group === 'core' ? 10 : 6,
              16,
              16
            );

            const material = new THREE.MeshBasicMaterial({
              color: getNodeColor(node)
            });

            return new THREE.Mesh(geometry, material);
          }}
        />
      )}

      {/* ===================================================================== */}
      {/* ORBIT RINGS */}
      {/* ===================================================================== */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute inset-0 border border-green-500/10 rounded-full scale-[0.3]" />
        <div className="absolute inset-0 border border-yellow-500/10 rounded-full scale-[0.5]" />
        <div className="absolute inset-0 border border-red-500/10 rounded-full scale-[0.7]" />
      </div>

      {/* ===================================================================== */}
      {/* NODE PANEL */}
      {/* ===================================================================== */}
      {selectedNode && (
        <div className="absolute top-4 right-4 bg-gray-900/80 p-4 rounded-lg text-white border border-blue-500 w-64 z-30">
          <h3 className="text-lg font-bold">{selectedNode.name}</h3>

          <p>Trust: {(selectedNode.trust * 100).toFixed(0)}%</p>

          <p className="mt-1 capitalize">Type: {selectedNode.group}</p>

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

      {/* ===================================================================== */}
      {/* RISK SLIDER */}
      {/* ===================================================================== */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-gray-900/70 p-3 rounded-full flex items-center gap-4 z-30">
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

      {/* ===================================================================== */}
      {/* FUTURE NOTES (KEPT IN FILE ON PURPOSE) */}
      {/* ===================================================================== */}
      {/* 
        Planned next upgrades:

        1. Live Firestore subscription instead of one-time getDocs
        2. Search box that highlights matching nodes
        3. Type filters: memory / tool / agent
        4. Activity pulse on hot links
        5. Node badges for trust / uptime / pricing
        6. Auto-create nodes from chat usage
        7. Agent click launches real routes
        8. Tool click invokes real tools
        9. Memory click injects context into chat
        10. Cluster expansion / collapse behavior
      */}

      {/* 
        UI direction:
        - Core remains center
        - Nodes represent active capabilities
        - Colors reflect type
        - Trust can later become outer glow / halo
        - Card pop-up remains first interaction layer
      */}

      {/* 
        Data assumptions:
        - title or content: string
        - importance: number
        - type: memory | tool | agent | knowledge
      */}

      {/* 
        Current Firestore path:
        memory_nodes / VkIdfn4SwyMzEIPLY / nodes / {doc}
      */}
    </div>
  );
}
