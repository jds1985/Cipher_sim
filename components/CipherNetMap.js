'use client';

import { useEffect, useMemo, useState } from 'react';
import { Search, Bot, Wrench, Brain, Star, Shield, Zap, X } from 'lucide-react';
import { db } from '../lib/firebaseClient';
import { collectionGroup, getDocs } from 'firebase/firestore';
import NodeRunner from '../components/NodeRunner';
import { loadMemoryNodes } from '../cipher_os/memory/memoryGraph';

const TABS = [
  { key: 'agent', label: 'Agents', icon: Bot },
  { key: 'tool', label: 'Tools', icon: Wrench },
  { key: 'knowledge', label: 'Knowledge', icon: Brain },
  { key: 'memory', label: 'Memories', icon: Brain }
];

function normalizeNode(doc) {
  const d = doc.data() || {};

  const rawType = String(d.type || d.group || 'knowledge').toLowerCase();

  let type = 'knowledge';


  if (rawType.includes('agent')) type = 'agent';
else if (rawType.includes('tool')) type = 'tool';
else if (rawType.includes('memory')) type = 'memory';
else if (rawType.includes('knowledge')) type = 'knowledge';

  const trust =
    typeof d.importance === 'number'
      ? d.importance
      : typeof d.trust === 'number'
      ? d.trust
      : Math.random();

  const title =
    d.name ||
    d.title ||
    (typeof d.content === 'string' ? d.content.slice(0, 40) : '') ||
    'Untitled Node';

  const description =
    d.description ||
    d.summary ||
    d.content ||
    'No description yet.';

  const price =
    typeof d.price === 'number'
      ? d.price
      : d.paid === true
      ? 2
      : 0;

  return {
    id: doc.id,
    title,
    description,
    type,
    trust,
    price,
    locked: Boolean(d.locked),
    tags: Array.isArray(d.tags) ? d.tags : [],
    raw: d
  };
}

function getTypeStyles(type) {
  if (type === 'agent') {
    return {
      accent: '#a855f7',
      glow: '0 0 24px rgba(168, 85, 247, 0.35)',
      border: 'rgba(168, 85, 247, 0.45)',
      bg: 'linear-gradient(180deg, rgba(168,85,247,0.14), rgba(18,18,30,0.92))'
    };
  }

  if (type === 'tool') {
    return {
      accent: '#38bdf8',
      glow: '0 0 24px rgba(56, 189, 248, 0.35)',
      border: 'rgba(56, 189, 248, 0.45)',
      bg: 'linear-gradient(180deg, rgba(56,189,248,0.14), rgba(18,18,30,0.92))'
    };
  }

  return {
    accent: '#facc15',
    glow: '0 0 24px rgba(250, 204, 21, 0.30)',
    border: 'rgba(250, 204, 21, 0.45)',
    bg: 'linear-gradient(180deg, rgba(250,204,21,0.12), rgba(18,18,30,0.92))'
  };
}

function ShapeBadge({ type }) {
  const styles = getTypeStyles(type);

  if (type === 'agent') {
    return (
      <div
        style={{
          width: 22,
          height: 22,
          borderRadius: '999px',
          background: styles.accent,
          boxShadow: styles.glow,
          flexShrink: 0
        }}
      />
    );
  }

  if (type === 'tool') {
    return (
      <div
        style={{
          width: 20,
          height: 20,
          borderRadius: 6,
          background: styles.accent,
          boxShadow: styles.glow,
          flexShrink: 0
        }}
      />
    );
  }

  return (
    <div
      style={{
        width: 0,
        height: 0,
        borderLeft: '11px solid transparent',
        borderRight: '11px solid transparent',
        borderBottom: `20px solid ${styles.accent}`,
        filter: 'drop-shadow(0 0 10px rgba(250, 204, 21, 0.35))',
        flexShrink: 0
      }}
    />
  );
}

function TrustBar({ trust, accent }) {
  const pct = Math.max(0, Math.min(100, Math.round(trust * 100)));

  return (
    <div style={{ width: '100%' }}>
      <div
        style={{
          height: 7,
          width: '100%',
          borderRadius: 999,
          background: 'rgba(255,255,255,0.08)',
          overflow: 'hidden'
        }}
      >
        <div
          style={{
            height: '100%',
            width: `${pct}%`,
            borderRadius: 999,
            background: accent,
            boxShadow: `0 0 14px ${accent}`
          }}
        />
      </div>
    </div>
  );
}

function NodeCard({ node, onClick }) {
  const styles = getTypeStyles(node.type);

  return (
    <button
      onClick={() => onClick(node)}
      onMouseDown={(e) => {
        e.currentTarget.style.transform = 'scale(0.97)';
      }}
      onMouseUp={(e) => {
        e.currentTarget.style.transform = 'scale(1)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'scale(1)';
      }}
      style={{
        textAlign: 'left',
        width: '100%',
        borderRadius: 22,
        border: `1px solid ${styles.border}`,
        background: styles.bg,
        padding: 14,
        color: 'white',
        boxShadow: styles.glow,
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        transition: 'transform 0.15s ease, box-shadow 0.15s ease',
        cursor: 'pointer'
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
        <ShapeBadge type={node.type} />

        <div style={{ minWidth: 0, flex: 1 }}>
          <div
            style={{
              fontSize: 15,
              fontWeight: 700,
              lineHeight: 1.2,
              marginBottom: 6,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap'
            }}
          >
            {node.title}
          </div>

          <div
            style={{
              fontSize: 12,
              color: 'rgba(255,255,255,0.68)',
              lineHeight: 1.35,
              minHeight: 32,
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden'
            }}
          >
            {node.description}
          </div>
        </div>
      </div>

      <div
        style={{
          display: 'flex',
          gap: 10,
          alignItems: 'center',
          marginTop: 12,
          marginBottom: 10,
          fontSize: 12,
          color: 'rgba(255,255,255,0.88)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <Star size={13} />
          <span>{Math.round(node.trust * 100)}%</span>
        </div>

        <div style={{ opacity: 0.7 }}>•</div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <Zap size={13} />
          <span
            style={{
              color: node.price > 0 ? '#22c55e' : '#38bdf8',
              fontWeight: 700
            }}
          >
            {node.price > 0 ? `$${node.price}` : 'Free'}
          </span>
        </div>
      </div>

      <TrustBar trust={node.trust} accent={styles.accent} />
    </button>
  );
}

export default function CipherNetMap() {
  const [nodes, setNodes] = useState([]);
  const [activeTab, setActiveTab] = useState('agent');
  const [query, setQuery] = useState('');
  const [selectedNode, setSelectedNode] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errorText, setErrorText] = useState('');

  useEffect(() => {
    async function loadNodes() {
      try {
        setLoading(true);
        setErrorText('');

        let normalized = [];

if (activeTab === 'memory') {
  const userId = "demo"; // 🔥 replace with real user later
  const memNodes = await loadMemoryNodes(userId, 200);

  normalized = memNodes.map((n) => ({
    id: n.id,
    title: n.content?.slice(0, 40) || 'Memory',
    description: n.content,
    type: 'memory',
    trust: typeof n.importance === 'number' ? n.importance : 0.5,
    price: 0,
    locked: Boolean(n.locked),
    tags: n.tags || [],
    raw: n
  }));
} else {
  const snap = await getDocs(collectionGroup(db, 'nodes'));
  normalized = snap.docs.map(normalizeNode);
}

        normalized.sort((a, b) => {
          if (b.trust !== a.trust) return b.trust - a.trust;
          return a.title.localeCompare(b.title);
        });

        setNodes(normalized);
      } catch (e) {
        console.error('CipherNet load error:', e);
        setErrorText(e?.message || 'Failed to load CipherNet');
      } finally {
        setLoading(false);
      }
    }

    loadNodes();
  }, [activeTab]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();

    return nodes.filter((node) => {
      if (node.type !== activeTab) return false;
      if (!q) return true;

      return (
        node.title.toLowerCase().includes(q) ||
        node.description.toLowerCase().includes(q) ||
        node.tags.some((tag) => String(tag).toLowerCase().includes(q))
      );
    });
  }, [nodes, activeTab, query]);

  const counts = useMemo(() => {
  return {
    agent: nodes.filter((n) => n.type === 'agent').length,
    tool: nodes.filter((n) => n.type === 'tool').length,
    knowledge: nodes.filter((n) => n.type === 'knowledge').length,
    memory: nodes.filter((n) => n.type === 'memory').length
  };
}, [nodes]);

  const activeStyles = getTypeStyles(activeTab);

  return (
    <div
      style={{
        minHeight: '100vh',
        background:
          'radial-gradient(circle at top, rgba(40,80,180,0.22), rgba(1,4,18,1) 45%), linear-gradient(180deg, #020617 0%, #02030f 100%)',
        color: 'white',
        position: 'relative',
        overflow: 'hidden'
      }}
    >
      <div
        style={{
          position: 'absolute',
          inset: 0,
          pointerEvents: 'none',
          background:
            'radial-gradient(circle at 20% 20%, rgba(0,255,255,0.08), transparent 20%), radial-gradient(circle at 80% 30%, rgba(168,85,247,0.08), transparent 18%), radial-gradient(circle at 50% 80%, rgba(250,204,21,0.06), transparent 22%)'
        }}
      />

      <div
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 30,
          padding: '16px 14px 10px',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          background: 'linear-gradient(180deg, rgba(2,6,23,0.88), rgba(2,6,23,0.45))'
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            marginBottom: 12
          }}
        >
          <div
            style={{
              width: 42,
              height: 42,
              borderRadius: 14,
              border: '1px solid rgba(0,255,255,0.35)',
              display: 'grid',
              placeItems: 'center',
              background: 'rgba(6, 10, 25, 0.82)',
              boxShadow: '0 0 24px rgba(0,255,255,0.18)'
            }}
          >
            <img
              src="/icons/cipher-192.png"
              alt="CipherNet"
              style={{ width: 28, height: 28, objectFit: 'contain' }}
            />
          </div>

          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 18, fontWeight: 800, letterSpacing: 0.3 }}>
              CipherNet
            </div>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.62)' }}>
              Agents, tools, and living knowledge
            </div>
          </div>
        </div>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            padding: '12px 14px',
            borderRadius: 999,
            border: `1px solid ${activeStyles.border}`,
            background: 'rgba(7, 10, 24, 0.88)',
            boxShadow: activeStyles.glow
          }}
        >
          <Search size={18} color={activeStyles.accent} />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={`Search ${TABS.find((t) => t.key === activeTab)?.label.toLowerCase()}...`}
            style={{
              flex: 1,
              background: 'transparent',
              border: 'none',
              outline: 'none',
              color: 'white',
              fontSize: 15
            }}
          />
          {query ? (
            <button
              onClick={() => setQuery('')}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'rgba(255,255,255,0.72)',
                display: 'grid',
                placeItems: 'center'
              }}
            >
              <X size={18} />
            </button>
          ) : null}
        </div>
      </div>

      <div
        style={{
          display: 'flex',
          gap: 10,
          overflowX: 'auto',
          padding: '6px 14px 10px',
          position: 'sticky',
          top: 94,
          zIndex: 25,
          background: 'linear-gradient(180deg, rgba(2,6,23,0.72), rgba(2,6,23,0.18))',
          backdropFilter: 'blur(10px)',
          WebkitBackdropFilter: 'blur(10px)'
        }}
      >
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.key;
          const styles = getTypeStyles(tab.key);

          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              style={{
                minWidth: 128,
                borderRadius: 999,
                padding: '12px 16px',
                border: `1px solid ${isActive ? styles.border : 'rgba(255,255,255,0.08)'}`,
                background: isActive ? styles.bg : 'rgba(8,10,20,0.72)',
                color: 'white',
                boxShadow: isActive ? styles.glow : 'none',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 10
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Icon size={16} color={styles.accent} />
                <span style={{ fontWeight: 700, fontSize: 14 }}>{tab.label}</span>
              </div>
              <span style={{ fontSize: 12, opacity: 0.72 }}>{counts[tab.key]}</span>
            </button>
          );
        })}
      </div>

      <div style={{ padding: '10px 14px 120px' }}>
        {loading ? (
          <div
            style={{
              padding: 24,
              borderRadius: 24,
              background: 'rgba(10,14,28,0.78)',
              border: '1px solid rgba(255,255,255,0.08)',
              color: 'rgba(255,255,255,0.7)'
            }}
          >
            Loading CipherNet...
          </div>
        ) : errorText ? (
          <div
            style={{
              padding: 24,
              borderRadius: 24,
              background: 'rgba(40, 8, 12, 0.72)',
              border: '1px solid rgba(255, 90, 90, 0.35)',
              color: '#ff8c8c'
            }}
          >
            {errorText}
          </div>
        ) : filtered.length === 0 ? (
          <div
            style={{
              padding: 24,
              borderRadius: 24,
              background: 'rgba(10,14,28,0.78)',
              border: `1px solid ${activeStyles.border}`,
              color: 'rgba(255,255,255,0.74)'
            }}
          >
            Nothing matched that search in {TABS.find((t) => t.key === activeTab)?.label.toLowerCase()}.
          </div>
        ) : (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
              gap: 12
            }}
          >
            {filtered.map((node) => (
              <NodeCard key={node.id} node={node} onClick={setSelectedNode} />
            ))}
          </div>
        )}
      </div>

      {selectedNode ? (
        <div
          onClick={() => setSelectedNode(null)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.58)',
            zIndex: 60,
            display: 'flex',
            alignItems: 'flex-end'
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: '100%',
              borderTopLeftRadius: 26,
              borderTopRightRadius: 26,
              background: 'linear-gradient(180deg, rgba(12,16,34,0.98), rgba(6,8,18,0.98))',
              borderTop: `1px solid ${getTypeStyles(selectedNode.type).border}`,
              boxShadow: getTypeStyles(selectedNode.type).glow,
              padding: 18
            }}
          >
            <div
              style={{
                width: 44,
                height: 5,
                borderRadius: 999,
                background: 'rgba(255,255,255,0.18)',
                margin: '0 auto 16px'
              }}
            />

            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
              <ShapeBadge type={selectedNode.type} />
              <div style={{ minWidth: 0, flex: 1 }}>
                <div style={{ fontSize: 20, fontWeight: 800, lineHeight: 1.15 }}>
                  {selectedNode.title}
                </div>
                <div
                  style={{
                    marginTop: 4,
                    fontSize: 13,
                    color: 'rgba(255,255,255,0.62)',
                    textTransform: 'capitalize'
                  }}
                >
                  {selectedNode.type}
                </div>
              </div>
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
                gap: 10,
                marginBottom: 16
              }}
            >
              <div
                style={{
                  padding: 12,
                  borderRadius: 18,
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(255,255,255,0.08)'
                }}
              >
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.58)', marginBottom: 4 }}>
                  Price
                </div>
                <div
                  style={{
                    fontWeight: 800,
                    color: selectedNode.price > 0 ? '#22c55e' : '#38bdf8'
                  }}
                >
                  {selectedNode.price > 0 ? `$${selectedNode.price}` : 'Free'}
                </div>
              </div>

              <div
                style={{
                  padding: 12,
                  borderRadius: 18,
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(255,255,255,0.08)'
                }}
              >
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.58)', marginBottom: 4 }}>
                  Trust
                </div>
                <div style={{ fontWeight: 800 }}>{Math.round(selectedNode.trust * 100)}%</div>
              </div>

              <div
                style={{
                  padding: 12,
                  borderRadius: 18,
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(255,255,255,0.08)'
                }}
              >
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.58)', marginBottom: 4 }}>
                  Status
                </div>
                <div style={{ fontWeight: 800, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Shield size={14} />
                  {selectedNode.locked ? 'Locked' : 'Ready'}
                </div>
              </div>
            </div>

            <div
              style={{
                padding: 14,
                borderRadius: 20,
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.08)',
                marginBottom: 16,
                color: 'rgba(255,255,255,0.86)',
                lineHeight: 1.45
              }}
            >
              {selectedNode.description}
            </div>

            {selectedNode.tags.length ? (
              <div
                style={{
                  display: 'flex',
                  gap: 8,
                  overflowX: 'auto',
                  marginBottom: 16
                }}
              >
                {selectedNode.tags.map((tag, i) => (
                  <div
                    key={`${tag}-${i}`}
                    style={{
                      padding: '8px 12px',
                      borderRadius: 999,
                      background: 'rgba(255,255,255,0.05)',
                      border: '1px solid rgba(255,255,255,0.08)',
                      whiteSpace: 'nowrap',
                      fontSize: 12,
                      color: 'rgba(255,255,255,0.78)'
                    }}
                  >
                    {String(tag)}
                  </div>
                ))}
              </div>
            ) : null}

            <NodeRunner node={selectedNode.raw} />
          </div>
        </div>
      ) : null}
    </div>
  );
}
