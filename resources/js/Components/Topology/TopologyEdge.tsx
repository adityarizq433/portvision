import React from 'react';
import {
    BaseEdge,
    EdgeLabelRenderer,
    getBezierPath,
    type EdgeProps,
} from '@xyflow/react';

export interface TopologyEdgeData {
    id?: number;
    status?: string;
    source_port?: string;
    target_port?: string;
    source_type?: string;
    onDelete?: (edgeId: string, linkId?: number) => void;
    isAdmin?: boolean;
}

export default function TopologyEdge({
    id,
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition,
    targetPosition,
    style = {},
    markerEnd,
    data,
    selected,
}: EdgeProps) {
    const edgeData = (data || {}) as TopologyEdgeData;
    const isDown = edgeData.status === 'down';

    const [edgePath, labelX, labelY] = getBezierPath({
        sourceX,
        sourceY,
        sourcePosition,
        targetX,
        targetY,
        targetPosition,
    });

    const labelText =
        edgeData.source_port && edgeData.target_port
            ? `${edgeData.source_port} ↔ ${edgeData.target_port}`
            : 'Manual Link';

    const handleDelete = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (edgeData.onDelete) {
            edgeData.onDelete(id, edgeData.id);
        }
    };

    return (
        <>
            <BaseEdge
                path={edgePath}
                markerEnd={markerEnd}
                style={{
                    ...style,
                    stroke: isDown ? '#f43f5e' : selected ? '#38bdf8' : '#10b981',
                    strokeWidth: selected ? 3.5 : isDown ? 2 : 2.5,
                    strokeDasharray: isDown ? '5 5' : undefined,
                    transition: 'stroke 0.2s, stroke-width 0.2s',
                }}
                interactionWidth={25}
            />
            <EdgeLabelRenderer>
                <div
                    style={{
                        position: 'absolute',
                        transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
                        pointerEvents: 'all',
                    }}
                    className={`nodrag nopan flex items-center gap-1.5 rounded-md border px-2 py-0.5 text-[10px] font-mono shadow-md backdrop-blur-sm transition-all ${
                        selected
                            ? 'border-cyan-400 bg-slate-900 text-cyan-200 ring-2 ring-cyan-500/30'
                            : isDown
                            ? 'border-rose-800 bg-slate-950/90 text-rose-300'
                            : 'border-slate-700 bg-slate-950/90 text-slate-300 hover:border-slate-500'
                    }`}
                >
                    <span>{labelText}</span>
                    {edgeData.isAdmin && (
                        <button
                            type="button"
                            onClick={handleDelete}
                            title="Hapus / Putus sambungan ini"
                            className="ml-1 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-slate-800 text-slate-400 hover:bg-rose-600 hover:text-white transition-colors"
                        >
                            <svg className="h-2.5 w-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    )}
                </div>
            </EdgeLabelRenderer>
        </>
    );
}
