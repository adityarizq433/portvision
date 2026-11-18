import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import DeviceNode from '@/Components/Topology/DeviceNode';
import TopologyEdge from '@/Components/Topology/TopologyEdge';
import { Head, router, usePage } from '@inertiajs/react';
import { Location } from '@/types/models';
import { PageProps } from '@/types';
import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
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

// Otomatis pintar: pilih sisi dari posisi relatif (hindari bottom-top semua)
function pickHandles(
    sx: number, sy: number, tx: number, ty: number
): { sourceHandle: string; targetHandle: string } {
    const dx = tx - sx;
    const dy = ty - sy;
    if (Math.abs(dx) >= Math.abs(dy)) {
        return dx >= 0
            ? { sourceHandle: 'right-source', targetHandle: 'left-target' }
            : { sourceHandle: 'left-source', targetHandle: 'right-target' };
    }
    return dy >= 0
        ? { sourceHandle: 'bottom-source', targetHandle: 'top-target' }
        : { sourceHandle: 'top-source', targetHandle: 'bottom-target' };
}

// Dagre layout helper for hierarchical graph arrangement
const getLayoutedElements = (nodes: Node[], edges: Edge[], direction = 'TB') => {
    const dagreGraph = new dagre.graphlib.Graph();
    dagreGraph.setDefaultEdgeLabel(() => ({}));
    dagreGraph.setGraph({ rankdir: direction, ranksep: 120, nodesep: 80 });

    nodes.forEach((node) => {
        dagreGraph.setNode(node.id, { width: 200, height: 120 });
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
                x: nodeWithPosition.x - 100,
                y: nodeWithPosition.y - 60,
            },
        };
    });

    const posMap = new Map(layoutedNodes.map((n) => [n.id, n.position]));
    const layoutedEdges = edges.map((e) => {
        const s = posMap.get(e.source);
        const t = posMap.get(e.target);
        if (!s || !t) return e;
        return { ...e, ...pickHandles(s.x, s.y, t.x, t.y) };
    });

    return { nodes: layoutedNodes, edges: layoutedEdges };
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
    const [showIp, setShowIp] = useState(false);
    const showIpRef = useRef(false);

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
                setSaveMessage('Hanya administrator yang dapat menghapus tautan.');
                setTimeout(() => setSaveMessage(null), 3000);
                return;
            }

            // Remove locally
            setEdges((eds) => eds.filter((e) => e.id !== edgeId));
            setSelectedEdge(null);

            if (linkId) {
                try {
                    const res = await fetch(`/api/topology/links/${linkId}`, {
                        method: 'DELETE',
                        headers: {
                            'Content-Type': 'application/json',
                            'X-CSRF-TOKEN':
                                (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement)?.content || '',
                            'Accept': 'application/json',
                        },
                    });
                    if (res.ok) {
                        setSaveMessage('Tautan kabel berhasil dihapus.');
                        setTimeout(() => setSaveMessage(null), 3000);
                    } else {
                        const err = await res.json().catch(() => ({}));
                        setSaveMessage(`Gagal menghapus tautan: ${err.message || 'Kesalahan server'}`);
                        setTimeout(() => setSaveMessage(null), 4000);
                    }
                } catch (err) {
                    console.error('Failed to delete link', err);
                    setSaveMessage('Gagal menghapus tautan karena masalah jaringan.');
                    setTimeout(() => setSaveMessage(null), 4000);
                }
            }
        },
        [isAdmin, setEdges]
    );

    // Fetch Topology Data from backend
    const fetchTopologyData = useCallback(async (locId?: number | string) => {
        setIsLoading(true);
        setSelectedEdge(null);
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 15000);
        try {
            const params = new URLSearchParams();
            if (locId) params.append('location_id', locId.toString());

            const res = await fetch(`/api/topology/data?${params.toString()}`, {
                signal: controller.signal,
            });
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            if (res.ok) {
                const data = await res.json();

                // Format Nodes
                const formattedNodes: Node[] = data.nodes.map((n: any) => ({
                    id: n.id,
                    type: 'deviceNode',
                    position: {
                        x: n.position.x || Math.random() * 600,
                        y: n.position.y || Math.random() * 400,
                    },
                    data: {
                        id: n.data.id,
                        hostname: n.data.hostname,
                        ip: n.data.ip,
                        vendor: n.data.vendor,
                        model: n.data.model,
                        tier: n.data.tier,
                        status: n.data.status,
                        port_count: n.data.port_count,
                        port_up_count: n.data.port_up_count,
                        port_down_count: n.data.port_down_count,
                        is_locked: n.data.is_locked,
                        show_ip: showIpRef.current,
                    },
                }));

                // Format Edges
                const posMap = new Map(formattedNodes.map((n: any) => [n.id, n.position]));
                const formattedEdges: Edge[] = data.edges.map((e: any) => {
                    const s = posMap.get(e.source) as { x: number; y: number } | undefined;
                    const t = posMap.get(e.target) as { x: number; y: number } | undefined;
                    const auto = s && t ? pickHandles(s.x, s.y, t.x, t.y) : { sourceHandle: 'bottom-source', targetHandle: 'top-target' };
                    return ({
                    id: e.id,
                    source: e.source,
                    target: e.target,
                    sourceHandle: e.sourceHandle || auto.sourceHandle,
                    targetHandle: e.targetHandle || auto.targetHandle,
                    animated: e.data?.status === 'active',
                    type: 'topologyEdge',
                    interactionWidth: 25,
                    data: {
                        id: e.data.id,
                        status: e.data.status,
                        source_type: e.data.source_type,
                        source_port: e.data.source_port,
                        target_port: e.data.target_port,
                        speed: e.data.speed,
                        isAdmin,
                        onDelete: deleteLink,
                    },
                    markerEnd: {
                        type: MarkerType.ArrowClosed,
                        color: e.data?.status === 'down' ? '#ef4444' : '#10b981',
                        width: 14,
                        height: 14,
                    },
                    });
                });

                setNodes(formattedNodes);
                setEdges(formattedEdges);
            }
        } catch (err) {
            const aborted = err instanceof DOMException && err.name === 'AbortError';
            setSaveMessage(aborted
                ? 'Server tidak merespons dalam 15 detik. Periksa koneksi atau coba lagi.'
                : 'Gagal memuat data topologi. Periksa koneksi dan coba lagi.');
            setTimeout(() => setSaveMessage(null), 4000);
        } finally {
            clearTimeout(timeoutId);
            setIsLoading(false);
        }
    }, [isAdmin, deleteLink, setNodes, setEdges]);

    useEffect(() => {
        fetchTopologyData(locationId);
    }, [locationId, fetchTopologyData]);

    // Near-realtime: refresh device/port statuses from Redis every 10 seconds
    const refreshPortStatus = useCallback(async () => {
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 15000);
            const res = await fetch('/api/topology/port-status', { signal: controller.signal });
            clearTimeout(timeoutId);
            if (!res.ok) return;
            const payload = await res.json();
            setNodes((nds) =>
                nds.map((n) => {
                    const s = payload.devices?.[String(n.data.id)];
                    if (!s) return n;
                    return {
                        ...n,
                        data: {
                            ...n.data,
                            status: s.status,
                            port_count: s.port_count,
                            port_up_count: s.port_up_count,
                            port_down_count: s.port_down_count,
                        },
                    };
                })
            );
        } catch {
            // Transient failure — the next tick will retry.
        }
    }, [setNodes]);

    useEffect(() => {
        refreshPortStatus();
        const interval = setInterval(refreshPortStatus, 10000);
        return () => clearInterval(interval);
    }, [refreshPortStatus]);

    // Full topology data refresh every 60 seconds (covers new/removed links)
    useEffect(() => {
        const interval = setInterval(() => fetchTopologyData(locationId), 60000);
        return () => clearInterval(interval);
    }, [locationId, fetchTopologyData]);

    // Apply auto layout with Dagre
    const applyAutoLayout = useCallback(() => {
        const layouted = getLayoutedElements(nodes, edges, 'TB');
        setNodes([...layouted.nodes]);
        setEdges([...layouted.edges]);
    }, [nodes, edges, setNodes, setEdges]);

    // Toggle IP visibility on all topology nodes
    const toggleShowIp = useCallback(() => {
        const next = !showIpRef.current;
        showIpRef.current = next;
        setShowIp(next);
        setNodes((nds) =>
            nds.map((n) => ({ ...n, data: { ...n.data, show_ip: next } }))
        );
    }, [setNodes]);

    // Save positions to backend
    const savePositions = async () => {
        if (!isAdmin) return;
        setIsSaving(true);
        try {
            const positions = nodes.map((node) => ({
                id: node.data.id,
                position_x: Math.round(node.position.x),
                position_y: Math.round(node.position.y),
            }));

            const res = await fetch('/api/topology/positions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN':
                        (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement)?.content || '',
                    'Accept': 'application/json',
                },
                body: JSON.stringify({ positions }),
            });

            if (res.ok) {
                setSaveMessage('Tata letak posisi berhasil disimpan.');
                setTimeout(() => setSaveMessage(null), 3000);
            } else {
                setSaveMessage('Gagal menyimpan tata letak posisi.');
                setTimeout(() => setSaveMessage(null), 3000);
            }
        } catch (err) {
            console.error('Save failed', err);
            setSaveMessage('Gagal menyimpan tata letak karena kesalahan jaringan.');
            setTimeout(() => setSaveMessage(null), 3000);
        } finally {
            setIsSaving(false);
        }
    };

    // User drew a link between two device handles
    const onConnect = useCallback(
        async (connection: Connection) => {
            if (!connection.source || !connection.target) return;
            if (connection.source === connection.target) return;

            const sourceDeviceId = parseInt(connection.source.replace('dev-', ''), 10);
            const targetDeviceId = parseInt(connection.target.replace('dev-', ''), 10);

            if (isNaN(sourceDeviceId) || isNaN(targetDeviceId)) return;

            const tempId = `temp-${Date.now()}`;
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
                setSaveMessage('Hanya administrator yang dapat menyimpan tautan topologi ke basis data.');
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
                        source_handle: connection.sourceHandle,
                        target_handle: connection.targetHandle,
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
                    setSaveMessage('Tautan berhasil dihubungkan dan disimpan.');
                    setTimeout(() => setSaveMessage(null), 3500);
                } else {
                    const err = await res.json().catch(() => ({}));
                    setSaveMessage(`Gagal menyimpan tautan: ${err.message || 'Kesalahan validasi'}`);
                    setTimeout(() => setSaveMessage(null), 4000);
                    setEdges((eds) => eds.filter((e) => e.id !== tempId));
                }
            } catch (err) {
                console.error('Failed to save link', err);
                setSaveMessage('Gagal menyimpan tautan karena kesalahan jaringan.');
                setTimeout(() => setSaveMessage(null), 4000);
                setEdges((eds) => eds.filter((e) => e.id !== tempId));
            }
        },
        [isAdmin, deleteLink, setEdges]
    );

    // Manual: geser ujung kabel ke titik lain (reconnect)
    const onReconnect = useCallback(
        async (oldEdge: Edge, newConnection: Connection) => {
            if (!newConnection.source || !newConnection.target) return;
            if (newConnection.source === newConnection.target) return;
            if (!isAdmin) {
                setSaveMessage('Hanya administrator yang dapat mengubah tautan.');
                setTimeout(() => setSaveMessage(null), 3500);
                return;
            }
            const linkId = (oldEdge.data as any)?.id as number | undefined;
            const sourceDeviceId = parseInt(newConnection.source.replace('dev-', ''), 10);
            const targetDeviceId = parseInt(newConnection.target.replace('dev-', ''), 10);
            if (isNaN(sourceDeviceId) || isNaN(targetDeviceId)) return;
            setEdges((eds) =>
                eds.map((e) =>
                    e.id === oldEdge.id
                        ? { ...e, source: newConnection.source, target: newConnection.target, sourceHandle: newConnection.sourceHandle, targetHandle: newConnection.targetHandle }
                        : e
                )
            );
            if (!linkId) return;
            try {
                const res = await fetch('/api/topology/links', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-CSRF-TOKEN': (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement)?.content || '',
                        'Accept': 'application/json',
                    },
                    body: JSON.stringify({
                        source_device_id: sourceDeviceId,
                        target_device_id: targetDeviceId,
                        status: 'active',
                        source_handle: newConnection.sourceHandle,
                        target_handle: newConnection.targetHandle,
                    }),
                });
                if (!res.ok) throw new Error(`HTTP ${res.status}`);
                setSaveMessage('Titik tautan diperbarui.');
                setTimeout(() => setSaveMessage(null), 3000);
            } catch {
                setSaveMessage('Gagal menyimpan titik tautan.');
                setTimeout(() => setSaveMessage(null), 3000);
            }
        },
        [isAdmin, setEdges]
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
                            <div className="flex items-center gap-3">
                                <h1 className="text-lg font-bold tracking-tight text-navy-900">
                                    PETA TOPOLOGI JARINGAN
                                </h1>
                                <span className="rounded-full border border-primary-200 bg-primary-50 px-2.5 py-0.5 font-mono text-[11px] font-semibold text-primary-700">
                                    {nodes.length} Switch • {edges.length} Tautan
                                </span>
                            </div>
                            <p className="mt-0.5 text-xs text-gray-500 font-mono">
                                Grafik topologi hierarki multi-tier interaktif LLDP/CDP
                            </p>
                        </div>
                    </div>

                    {/* Toolbar Actions */}
                    <div className="flex flex-wrap items-center gap-2.5">
                        {/* Location Switcher */}
                        <div className="flex items-center gap-2">
                            <label htmlFor="topo-location" className="text-xs font-semibold uppercase tracking-wider text-gray-500">Wilayah:</label>
                            <select
                                id="topo-location"
                                value={locationId}
                                onChange={(e) => setLocationId(e.target.value)}
                                className="rounded-xl border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-navy-900 focus:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-400/20"
                            >
                                <option value="">Semua Wilayah (Global)</option>
                                {locations.map((loc) => (
                                    <option key={loc.id} value={loc.id}>
                                        {loc.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* IP Visibility Toggle */}
                        <button
                            type="button"
                            onClick={toggleShowIp}
                            className="pv-btn pv-btn--outline text-xs py-1.5"
                            title={showIp ? 'Sembunyikan IP switch di topologi' : 'Tampilkan IP switch di topologi'}
                            aria-pressed={showIp}
                        >
                            <svg className="h-3.5 w-3.5 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                {showIp ? (
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858-5.908a9.97 9.97 0 015.122-1.063c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L3 3m10.875 15.825L21 21" />
                                ) : (
                                    <>
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                    </>
                                )}
                            </svg>
                            <span>{showIp ? 'Sembunyikan IP' : 'Tampilkan IP'}</span>
                        </button>

                        {/* Auto Layout (Dagre) */}
                        <button
                            type="button"
                            onClick={applyAutoLayout}
                            className="pv-btn pv-btn--outline text-xs py-1.5"
                            title="Susun ulang switch secara hierarki otomatis"
                        >
                            <svg className="h-3.5 w-3.5 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h7" />
                            </svg>
                            <span>Tata Letak Otomatis</span>
                        </button>

                        {/* Admin Save Positions */}
                        {isAdmin && (
                            <>
                                <button
                                    type="button"
                                    onClick={savePositions}
                                    disabled={isSaving}
                                    className="pv-btn pv-btn--primary text-xs py-1.5"
                                >
                                    <span>{isSaving ? 'Menyimpan…' : 'Simpan Tata Letak'}</span>
                                </button>

                                <button
                                    type="button"
                                    onClick={syncLinks}
                                    disabled={isSyncing}
                                    className="pv-btn pv-btn--outline text-xs py-1.5"
                                >
                                    <svg className={`h-3.5 w-3.5 ${isSyncing ? 'animate-spin text-primary-600' : 'text-gray-500'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                    </svg>
                                    <span>Sinkronisasi Tautan LLDP</span>
                                </button>
                            </>
                        )}
                    </div>
                </div>
            }
        >
            <Head title="Peta Topologi" />

            {/* Notification Alert if saved */}
            {saveMessage && (
                <div className="mb-4 rounded-xl border border-green-200 bg-green-50 px-4 py-2.5 text-xs font-semibold text-green-800 flex items-center gap-2">
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                    <span>{saveMessage}</span>
                </div>
            )}

            {/* React Flow Visual Canvas Container */}
            <div className="relative h-[720px] w-full overflow-hidden rounded-2xl border border-gray-200 bg-slate-50 shadow-sm" role="application" aria-label="Canvas peta topologi jaringan. Gunakan tombol zoom dan kontrol untuk navigasi.">
                {isLoading ? (
                    <div className="flex h-full w-full items-center justify-center">
                        <div className="flex flex-col items-center gap-3">
                            <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary-500 border-t-transparent" />
                            <span className="text-xs font-mono text-gray-500">Memuat grafik topologi…</span>
                        </div>
                    </div>
                ) : nodes.length === 0 ? (
                    <div className="flex h-full w-full flex-col items-center justify-center text-center p-6">
                        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white border border-gray-200 text-gray-500 mb-3 shadow-sm">
                            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                            </svg>
                        </div>
                        <h4 className="text-base font-bold text-navy-900">Perangkat Jaringan Tidak Ditemukan</h4>
                        <p className="mt-1 text-xs text-gray-500 max-w-md">
                            Tidak ada switch yang ditugaskan di wilayah ini atau inventaris perangkat masih kosong. Sinkronkan perangkat dari LibreNMS untuk membangun topologi.
                        </p>
                    </div>
                ) : (
                    <ReactFlow
                        nodes={nodes}
                        edges={edges}
                        onNodesChange={handleNodesChange}
                        onEdgesChange={onEdgesChange}
                        onConnect={onConnect}
                        onReconnect={onReconnect}
                        onEdgeClick={(_, edge) => setSelectedEdge(edge)}
                        onPaneClick={() => setSelectedEdge(null)}
                        nodeTypes={nodeTypes}
                        edgeTypes={edgeTypes}
                        connectionMode={ConnectionMode.Loose}
                        connectionRadius={20}
                        deleteKeyCode={null}
                        fitView
                        fitViewOptions={{ padding: 0.3 }}
                        minZoom={0.2}
                        maxZoom={2}
                        className="pv-topology"
                    >
                        <Background color="#CBD5E1" gap={24} size={1.5} variant={BackgroundVariant.Dots} />
                        <Controls className="!border-gray-200 !bg-white !shadow-md" />
                        <MiniMap
                            nodeColor={(node: any) => {
                                if (node.data?.status === 'down') return '#EF4444';
                                if (node.data?.tier === 'core') return '#8E4BAA';
                                if (node.data?.tier === 'distribution') return '#6F9BC8';
                                return '#4A7F7A';
                            }}
                            className="!border-gray-200 !bg-gray-50"
                        />
                    </ReactFlow>
                )}

                {/* Floating Active Cable Action Bar */}
                {selectedEdge && isAdmin && (
                    <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20 flex items-center gap-3 rounded-xl border border-primary-300 bg-white px-4 py-2 text-xs font-mono shadow-xl">
                        <span className="text-gray-700">
                            Tautan Terpilih:{' '}
                            <strong className="text-primary-600">
                                {(selectedEdge.data as any)?.source_port && (selectedEdge.data as any)?.target_port
                                    ? `${(selectedEdge.data as any)?.source_port} ↔ ${(selectedEdge.data as any)?.target_port}`
                                    : 'Tautan Manual'}
                            </strong>
                        </span>
                        <button
                            type="button"
                            onClick={() => {
                                deleteLink(selectedEdge.id, (selectedEdge.data as any)?.id);
                            }}
                            className="flex items-center gap-1.5 rounded-lg bg-rose-600 px-3 py-1 font-semibold text-white hover:bg-rose-700 transition-colors shadow-sm"
                        >
                            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                            <span>Putus Tautan</span>
                        </button>
                        <button
                            type="button"
                            onClick={() => setSelectedEdge(null)}
                            className="text-gray-500 hover:text-gray-700 p-1"
                            aria-label="Batalkan pilihan tautan"
                        >
                            ✕
                        </button>
                    </div>
                )}

                {/* Floating Canvas Legend */}
                <div className="absolute bottom-4 left-4 z-10 flex flex-wrap items-center gap-4 rounded-xl border border-gray-200 bg-white/90 px-3.5 py-2 text-xs font-mono shadow-md backdrop-blur-md">
                    <div className="flex items-center gap-1.5">
                        <span className="h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.8)]" />
                        <span className="text-gray-700 font-semibold">Perangkat UP</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <span className="h-2 w-2 rounded-full bg-rose-500 shadow-[0_0_6px_rgba(244,63,94,0.8)]" />
                        <span className="text-gray-700 font-semibold">Perangkat DOWN</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <span className="h-0.5 w-4 bg-emerald-500" />
                        <span className="text-gray-700 font-semibold">Tautan Aktif</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <span className="h-0.5 w-4 bg-rose-500 border-dashed" />
                        <span className="text-gray-700 font-semibold">Tautan Mati</span>
                    </div>
                </div>

                {/* Floating Connection Hint */}
                <div className="absolute top-4 right-4 z-10 hidden sm:flex items-center gap-2 rounded-xl border border-gray-200 bg-white/90 px-3 py-1.5 text-[11px] font-mono text-gray-600 shadow-sm backdrop-blur-md">
                    <span className="h-1.5 w-1.5 rounded-full bg-primary-500 animate-pulse" />
                    <span>Tarik titik handle untuk menghubungkan • Klik tombol ✕ pada tautan untuk memutus</span>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
