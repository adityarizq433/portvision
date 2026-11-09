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
            : 'Tautan Manual';

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
                    stroke: isDown ? '#DC2626' : selected ? '#1E55F0' : '#16A34A',
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
                    className={`nodrag nopan flex items-center gap-1.5 rounded-lg border px-2 py-0.5 text-[10px] font-mono shadow-md backdrop-blur-sm transition-all ${
                        selected
                            ? 'border-primary-500 bg-white text-primary-700 ring-2 ring-primary-400/30 font-bold'
                            : isDown
                            ? 'border-rose-300 bg-rose-50 text-rose-700 font-bold'
                            : 'border-gray-200 bg-white text-navy-900 hover:border-primary-300'
                    }`}
                >
                    <span>{labelText}</span>
                    {edgeData.isAdmin && (
                        <button
                            type="button"
                            onClick={handleDelete}
                            title="Putus tautan kabel ini"
                            aria-label={`Putus tautan ${labelText}`}
                            className="ml-1 flex h-5 w-5 items-center justify-center rounded-full bg-gray-100 text-gray-500 hover:bg-rose-600 hover:text-white transition-colors focus-visible:ring-2 focus-visible:ring-primary-400"
                        >
                            <svg className="h-2.5 w-2.5" aria-hidden="true" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    )}
                </div>
            </EdgeLabelRenderer>
        </>
    );
}
