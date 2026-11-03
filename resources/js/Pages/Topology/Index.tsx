import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import DeviceNode from '@/Components/Topology/DeviceNode';
import TopologyEdge from '@/Components/Topology/TopologyEdge';
import { Head, router, usePage } from '@inertiajs/react';
import { Location } from '@/types/models';
import { PageProps } from '@/types';
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
    ReactFlow,
    Background,
    Controls,
    MiniMap,
    useNodesState,
    useEdgesState,
    addEdge,
    Connection,
    ConnectionMode,
    Node,
    Edge,
    NodeChange,
    BackgroundVariant,
    MarkerType,
} from '@xyflow/react';
import dagre from 'dagre';

interface Props {
    locations: Location[];
    selectedLocationId: number | null;
}

const nodeTypes = {
    deviceNode: DeviceNode,
};

const edgeTypes = {
    topologyEdge: TopologyEdge,
};

// Dagre layout helper for hierarchical graph arrangement
const getLayoutedElements = (nodes: Node[], edges: Edge[], direction = 'TB') => {
    const dagreGraph = new dagre.graphlib.Graph();
    dagreGraph.setDefaultEdgeLabel(() => ({}));
    dagreGraph.setGraph({ rankdir: direction, ranksep: 120, nodesep: 80 });

    nodes.forEach((node) => {
        dagreGraph.setNode(node.id, { width: 220, height: 120 });
    });

    edges.forEach((edge) => {
        dagreGraph.setEdge(edge.source, edge.target);
    });

    dagre.layout(dagreGraph);

    const layoutedNodes = nodes.map((node) => {
        const nodeWithPosition = dagreGraph.node(node.id);
        return {
            ...node,
            position: {
                x: nodeWithPosition.x - 110,
                y: nodeWithPosition.y - 60,
            },
        };
    });

    return { nodes: layoutedNodes, edges };
};

export default function TopologyIndex({ locations, selectedLocationId }: Props) {
    const { auth } = usePage<PageProps>().props;
    const isAdmin = auth.user?.role === 'admin';

    const [locationId, setLocationId] = useState<number | string>(selectedLocationId || '');
    const [isLoading, setIsLoading] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [isSyncing, setIsSyncing] = useState(false);
    const [saveMessage, setSaveMessage] = useState<string | null>(null);
    const [selectedEdge, setSelectedEdge] = useState<Edge | null>(null);

    const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
    const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);

    // Block accidental node deletion from canvas via keyboard delete
    const handleNodesChange = useCallback(
        (changes: NodeChange[]) => {
            const safeChanges = changes.filter((c) => c.type !== 'remove');
            onNodesChange(safeChanges);
        },
        [onNodesChange]
    );

    // Delete link from state and database
    const deleteLink = useCallback(
        async (edgeId: string, linkId?: number) => {
            if (!isAdmin) {
                setSaveMessage('Only administrators can remove links.');
                setTimeout(() => setSaveMessage(null), 3000);
                return;
            }

            const targetLinkId = linkId || parseInt(edgeId.replace('link-', ''), 10);

            // Optimistically remove from state
            setEdges((eds) => eds.filter((e) => e.id !== edgeId));
            setSelectedEdge((curr) => (curr?.id === edgeId ? null : curr));

            if (!targetLinkId || isNaN(targetLinkId)) {
                return;
            }

            try {
                const res = await fetch(`/api/topology/links/${targetLinkId}`, {
                    method: 'DELETE',
                    headers: {
                        'X-CSRF-TOKEN':
                            (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement)?.content || '',
                        'Accept': 'application/json',
                    },
                });

                if (res.ok) {
                    setSaveMessage('Sambungan kabel berhasil dihapus.');
                    setTimeout(() => setSaveMessage(null), 3000);
                } else {
                    const err = await res.json().catch(() => ({}));
                    setSaveMessage(`Gagal menghapus link: ${err.message || 'Server error'}`);
                    setTimeout(() => setSaveMessage(null), 4000);
                    fetchTopologyData(locationId);
                }
            } catch (err) {
                console.error('Failed to delete link', err);
                fetchTopologyData(locationId);
            }
        },
        [isAdmin, locationId, setEdges]
    );

    // Fetch topology data
    const fetchTopologyData = useCallback(async (locId: number | string) => {
        setIsLoading(true);
        try {
            const query = locId ? `?location_id=${locId}` : '';
            const res = await fetch(`/api/topology/data${query}`);
            if (res.ok) {
                const data = await res.json();

                // Style edges nicely with colors & arrows
                const formattedEdges = (data.edges || []).map((e: any) => {
                    const isDown = e.data?.status === 'down';
                    return {
                        id: e.id,
                        source: e.source,
                        target: e.target,
                        animated: !isDown,
                        type: 'topologyEdge',
                        interactionWidth: 25,
                        data: {
                            ...e.data,
                            id: e.data?.id,
                            status: isDown ? 'down' : 'active',
                            source_port: e.data?.source_port,
                            target_port: e.data?.target_port,
                            isAdmin,
                            onDelete: deleteLink,
                        },
                        markerEnd: {
                            type: MarkerType.ArrowClosed,
                            color: isDown ? '#f43f5e' : '#10b981',
                            width: 14,
                            height: 14,
                        },
                    };
                });

                setNodes(data.nodes || []);
                setEdges(formattedEdges);
            }
        } catch (err) {
            console.error('Failed to load topology', err);
        } finally {
            setIsLoading(false);
        }
    }, [isAdmin, deleteLink, setNodes, setEdges]);

    useEffect(() => {
        fetchTopologyData(locationId);
    }, [locationId, fetchTopologyData]);

    // Apply Dagre Hierarchical Layout
    const applyAutoLayout = () => {
        const { nodes: layoutedNodes, edges: layoutedEdges } = getLayoutedElements(
            nodes,
            edges,
            'TB'
        );
        setNodes([...layoutedNodes]);
        setEdges([...layoutedEdges]);
    };

    // Save Node coordinates
    const savePositions = async () => {
        if (!isAdmin) return;
        setIsSaving(true);
        setSaveMessage(null);
        try {
            const payload = {
                nodes: nodes.map((n) => ({
                    device_id: (n.data as any)?.id,
                    x: n.position.x,
                    y: n.position.y,
                })),
            };

            const res = await fetch('/api/topology/positions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement)?.content || '',
                    'Accept': 'application/json',
                },
                body: JSON.stringify(payload),
            });

            if (res.ok) {
                setSaveMessage('Node coordinates saved successfully.');
                setTimeout(() => setSaveMessage(null), 3500);
            }
        } catch (err) {
            console.error('Failed to save positions', err);
        } finally {
            setIsSaving(false);
        }
    };

    // Connect two devices manually by dragging between handles
    const onConnect = useCallback(
        async (connection: Connection) => {
            if (!connection.source || !connection.target || connection.source === connection.target) {
                return;
            }

            const sourceDeviceId = parseInt(connection.source.replace('device-', ''), 10);
            const targetDeviceId = parseInt(connection.target.replace('device-', ''), 10);

            if (!sourceDeviceId || !targetDeviceId) {
                return;
            }

            const tempId = `link-temp-${Date.now()}`;
            const newEdge: Edge = {
                id: tempId,
                source: connection.source,
                target: connection.target,
                sourceHandle: connection.sourceHandle,
                targetHandle: connection.targetHandle,
                animated: true,
                type: 'topologyEdge',
                interactionWidth: 25,
                data: {
                    status: 'active',
                    isAdmin,
                    onDelete: deleteLink,
                },
                markerEnd: {
                    type: MarkerType.ArrowClosed,
                    color: '#10b981',
                    width: 14,
                    height: 14,
                },
            };

            setEdges((eds) => addEdge(newEdge, eds));

            if (!isAdmin) {
                setSaveMessage('Only administrators can save topology links to the database.');
                setTimeout(() => setSaveMessage(null), 3500);
                return;
            }

            try {
                const res = await fetch('/api/topology/links', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-CSRF-TOKEN':
                            (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement)?.content || '',
                        'Accept': 'application/json',
                    },
                    body: JSON.stringify({
                        source_device_id: sourceDeviceId,
                        target_device_id: targetDeviceId,
                        status: 'active',
                    }),
                });

                if (res.ok) {
                    const data = await res.json();
                    if (data.link?.id) {
                        setEdges((eds) =>
                            eds.map((e) =>
                                e.id === tempId
                                    ? {
                                          ...e,
                                          id: `link-${data.link.id}`,
                                          data: {
                                              ...e.data,
                                              id: data.link.id,
                                              status: 'active',
                                              source_type: 'manual',
                                              isAdmin,
                                              onDelete: deleteLink,
                                          },
                                      }
                                    : e
                            )
                        );
                    }
                    setSaveMessage('Link connected and saved successfully.');
                    setTimeout(() => setSaveMessage(null), 3500);
                } else {
                    const err = await res.json().catch(() => ({}));
                    setSaveMessage(`Failed to save link: ${err.message || 'Validation error'}`);
                    setTimeout(() => setSaveMessage(null), 4000);
                    setEdges((eds) => eds.filter((e) => e.id !== tempId));
                }
            } catch (err) {
                console.error('Failed to save link', err);
                setSaveMessage('Failed to save link due to network error.');
                setTimeout(() => setSaveMessage(null), 4000);
                setEdges((eds) => eds.filter((e) => e.id !== tempId));
            }
        },
        [isAdmin, deleteLink, setEdges]
    );

    // Sync Links from LibreNMS
    const syncLinks = () => {
        setIsSyncing(true);
        router.post(
            route('topology.sync'),
            {},
            {
                preserveScroll: true,
                onFinish: () => {
                    setIsSyncing(false);
                    fetchTopologyData(locationId);
                },
            }
        );
    };

    return (
        <AuthenticatedLayout
            header={
                <div className="flex flex-wrap items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <div>
                            <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-3">
                                <span>NETWORK TOPOLOGY MAP</span>
                                <span className="text-xs font-mono font-normal rounded-full bg-cyan-950/80 text-cyan-400 border border-cyan-800/80 px-2.5 py-0.5">
                                    {nodes.length} Switches • {edges.length} Links
                                </span>
                            </h1>
                            <p className="mt-1 text-xs text-slate-400 font-mono">
                                Interactive LLDP/CDP multi-tier topology graph
                            </p>
                        </div>
                    </div>

                    {/* Toolbar Actions */}
                    <div className="flex flex-wrap items-center gap-3">
                        {/* Location Switcher */}
                        <div className="flex items-center gap-2">
                            <span className="text-xs text-slate-400 font-medium">Site:</span>
                            <select
                                value={locationId}
                                onChange={(e) => setLocationId(e.target.value)}
                                className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-1.5 text-xs text-slate-200 focus:border-cyan-500 focus:outline-none"
                            >
                                <option value="">All Locations (Global)</option>
                                {locations.map((loc) => (
                                    <option key={loc.id} value={loc.id}>
                                        {loc.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Auto Layout (Dagre) */}
                        <button
                            type="button"
                            onClick={applyAutoLayout}
                            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs font-medium text-slate-200 hover:bg-slate-700 hover:border-slate-600 transition-all"
                            title="Auto-arrange switches by hierarchy"
                        >
                            <svg className="h-3.5 w-3.5 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h7" />
                            </svg>
                            <span>Auto Layout</span>
                        </button>

                        {/* Admin Save Positions */}
                        {isAdmin && (
                            <>
                                <button
                                    type="button"
                                    onClick={savePositions}
                                    disabled={isSaving}
                                    className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-500 shadow-md shadow-emerald-950/40 transition-all disabled:opacity-50"
                                >
                                    <span>{isSaving ? 'Saving...' : 'Save Layout'}</span>
                                </button>

                                <button
                                    type="button"
                                    onClick={syncLinks}
                                    disabled={isSyncing}
                                    className="inline-flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs font-medium text-slate-200 hover:border-cyan-500 transition-all disabled:opacity-50"
                                >
                                    <svg className={`h-3.5 w-3.5 ${isSyncing ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                    </svg>
                                    <span>Sync LLDP Links</span>
                                </button>
                            </>
                        )}
                    </div>
                </div>
            }
        >
            <Head title="Network Topology" />

            {/* Notification Alert if saved */}
            {saveMessage && (
                <div className="mb-4 rounded-lg border border-emerald-800 bg-emerald-950/80 px-4 py-2.5 text-xs font-semibold text-emerald-300">
                    ✓ {saveMessage}
                </div>
            )}

            {/* React Flow Visual Canvas Container */}
            <div className="relative h-[720px] w-full overflow-hidden rounded-xl border border-slate-800 bg-[#080c14] shadow-2xl">
                {isLoading ? (
                    <div className="flex h-full w-full items-center justify-center">
                        <div className="flex flex-col items-center gap-3">
                            <div className="h-8 w-8 animate-spin rounded-full border-2 border-cyan-500 border-t-transparent" />
                            <span className="text-xs font-mono text-slate-400">Loading topology graph...</span>
                        </div>
                    </div>
                ) : nodes.length === 0 ? (
                    <div className="flex h-full w-full flex-col items-center justify-center text-center p-6">
                        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-800 text-slate-400 mb-3">
                            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                            </svg>
                        </div>
                        <h4 className="text-base font-bold text-white">No Network Devices Found</h4>
                        <p className="mt-1 text-xs text-slate-400 max-w-md">
                            No switches are assigned to this location or device inventory is empty. Sync devices from LibreNMS to build the topology.
                        </p>
                    </div>
                ) : (
                    <ReactFlow
                        nodes={nodes}
                        edges={edges}
                        onNodesChange={handleNodesChange}
                        onEdgesChange={onEdgesChange}
                        onConnect={onConnect}
                        onEdgeClick={(_, edge) => setSelectedEdge(edge)}
                        onPaneClick={() => setSelectedEdge(null)}
                        nodeTypes={nodeTypes}
                        edgeTypes={edgeTypes}
                        connectionMode={ConnectionMode.Loose}
                        deleteKeyCode={null}
                        fitView
                        fitViewOptions={{ padding: 0.3 }}
                        minZoom={0.2}
                        maxZoom={2}
                    >
                        <Background color="#1e293b" gap={24} size={1.5} variant={BackgroundVariant.Dots} />
                        <Controls className="!border-slate-700 !bg-slate-900" />
                        <MiniMap
                            nodeColor={(node: any) => {
                                if (node.data?.status === 'down') return '#f43f5e';
                                if (node.data?.tier === 'core') return '#a855f7';
                                if (node.data?.tier === 'distribution') return '#3b82f6';
                                return '#10b981';
                            }}
                            className="!border-slate-800 !bg-slate-950"
                        />
                    </ReactFlow>
                )}

                {/* Floating Active Cable Action Bar */}
                {selectedEdge && isAdmin && (
                    <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20 flex items-center gap-3 rounded-xl border border-cyan-500/60 bg-slate-950/95 px-4 py-2 text-xs font-mono shadow-2xl backdrop-blur-md">
                        <span className="text-slate-300">
                            Kabel Terpilih:{' '}
                            <strong className="text-cyan-400">
                                {(selectedEdge.data as any)?.source_port && (selectedEdge.data as any)?.target_port
                                    ? `${(selectedEdge.data as any)?.source_port} ↔ ${(selectedEdge.data as any)?.target_port}`
                                    : 'Manual Link'}
                            </strong>
                        </span>
                        <button
                            type="button"
                            onClick={() => {
                                deleteLink(selectedEdge.id, (selectedEdge.data as any)?.id);
                            }}
                            className="flex items-center gap-1.5 rounded-lg bg-rose-600 px-3 py-1 font-semibold text-white hover:bg-rose-500 transition-colors shadow-sm"
                        >
                            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                            <span>Putus Sambungan</span>
                        </button>
                        <button
                            type="button"
                            onClick={() => setSelectedEdge(null)}
                            className="text-slate-400 hover:text-white"
                        >
                            ✕
                        </button>
                    </div>
                )}

                {/* Floating Canvas Legend */}
                <div className="absolute bottom-4 left-4 z-10 flex items-center gap-4 rounded-lg border border-slate-800/90 bg-slate-950/80 px-3.5 py-2 text-xs font-mono backdrop-blur-md">
                    <div className="flex items-center gap-1.5">
                        <span className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.8)]" />
                        <span className="text-slate-300">Device UP</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <span className="h-2 w-2 rounded-full bg-rose-500 shadow-[0_0_6px_rgba(244,63,94,0.8)]" />
                        <span className="text-slate-300">Device DOWN</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <span className="h-0.5 w-4 bg-emerald-500" />
                        <span className="text-slate-300">Active Link</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <span className="h-0.5 w-4 bg-rose-500 border-dashed" />
                        <span className="text-slate-300">Down Link</span>
                    </div>
                </div>

                {/* Floating Connection Hint */}
                <div className="absolute top-4 right-4 z-10 hidden sm:flex items-center gap-2 rounded-lg border border-slate-800/80 bg-slate-950/80 px-3 py-1.5 text-[11px] font-mono text-slate-400 backdrop-blur-md">
                    <span className="h-1.5 w-1.5 rounded-full bg-cyan-400 animate-pulse" />
                    <span>Tarik titik handle untuk menghubungkan • Klik tombol ✕ pada kabel untuk memutus</span>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
