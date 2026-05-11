"use client";

import { useMemo } from "react";
import { Background, Controls, MarkerType, MiniMap, ReactFlow, type Edge, type Node } from "@xyflow/react";

import type { KnowledgeGraphEdge, KnowledgeGraphNode } from "@/types/founderos-dashboard";


function fallbackGraph(): { nodes: KnowledgeGraphNode[]; edges: KnowledgeGraphEdge[] } {
  return {
    nodes: [
      { id: "memory", label: "Founder Notes", kind: "memory" },
      { id: "strategy", label: "Launch Strategy", kind: "strategy" },
      { id: "output", label: "LinkedIn Campaign", kind: "output" },
    ],
    edges: [
      { from: "memory", to: "strategy" },
      { from: "strategy", to: "output" },
    ],
  };
}

export function FounderKnowledgeGraph({
  nodes,
  edges,
}: {
  nodes: KnowledgeGraphNode[];
  edges: KnowledgeGraphEdge[];
}) {
  const graph = nodes.length ? { nodes, edges } : fallbackGraph();

  const flowNodes = useMemo<Node[]>(() => {
    const laneX = {
      memory: 20,
      strategy: 245,
      output: 470,
    } as const;
    const laneOffset: Record<string, number> = {
      memory: 0,
      strategy: 0,
      output: 0,
    };

    return graph.nodes.map((node) => {
      const y = 20 + laneOffset[node.kind] * 110;
      laneOffset[node.kind] += 1;

      return {
        id: node.id,
        data: { label: node.label },
        position: {
          x: laneX[node.kind],
          y,
        },
        draggable: false,
        style: {
          border: "1px solid rgba(255,255,255,0.12)",
          background: "rgba(255,255,255,0.03)",
          color: "#e4e4e7",
          borderRadius: 12,
          fontSize: 11,
          padding: "8px 10px",
          width: 188,
        },
      };
    });
  }, [graph.nodes]);

  const flowEdges = useMemo<Edge[]>(() => {
    return graph.edges.map((edge, index) => ({
      id: `${edge.from}-${edge.to}-${index}`,
      source: edge.from,
      target: edge.to,
      animated: true,
      markerEnd: {
        type: MarkerType.ArrowClosed,
      },
      style: {
        stroke: "rgba(148,163,184,0.75)",
        strokeWidth: 1.4,
      },
    }));
  }, [graph.edges]);

  if (process.env.NODE_ENV === "test") {
    return (
      <div className="space-y-1">
        {graph.edges.map((edge, index) => {
          const from = graph.nodes.find((item) => item.id === edge.from)?.label || edge.from;
          const to = graph.nodes.find((item) => item.id === edge.to)?.label || edge.to;
          return (
            <p key={`${edge.from}-${edge.to}-${index}`} className="text-xs text-zinc-300">
              {from} {"->"} {to}
            </p>
          );
        })}
      </div>
    );
  }

  return (
    <div className="h-[260px] w-full overflow-hidden rounded-xl border border-white/10 bg-[#0f1219]">
      <ReactFlow
        nodes={flowNodes}
        edges={flowEdges}
        fitView
        nodesDraggable={false}
        nodesConnectable={false}
        elementsSelectable={false}
        panOnDrag={false}
        zoomOnScroll={false}
        zoomOnPinch={false}
        zoomOnDoubleClick={false}
        minZoom={0.6}
        maxZoom={1.2}
        proOptions={{ hideAttribution: true }}
      >
        <MiniMap
          pannable={false}
          zoomable={false}
          nodeColor={() => "rgba(163,163,163,0.75)"}
          maskColor="rgba(0,0,0,0.4)"
          style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.12)" }}
        />
        <Controls showInteractive={false} />
        <Background gap={24} size={1} color="rgba(255,255,255,0.08)" />
      </ReactFlow>
    </div>
  );
}
