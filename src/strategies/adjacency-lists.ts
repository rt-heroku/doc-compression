/**
 * Adjacency Lists Strategy
 * Extracts concepts and relationships, representing as graph notation
 * Target: 6x compression
 *
 * Techniques:
 * - Concept extraction as nodes
 * - Relationship detection as edges
 * - Graph notation: C1 → enables → [C2, C3]
 * - Relationship types: enables, requires, composed_of, prevents
 * - Transitive reduction for minimal representation
 */

import { BaseCompressionStrategy } from './base';
import type { DocumentInput, CompressionResult, StrategyConfig } from '../types';
import YAML from 'yaml';

interface GraphNode {
  id: string;
  name: string;
  description?: string;
  type?: string;
}

interface GraphEdge {
  from: string;
  to: string;
  relationship: string;
}

export class AdjacencyListsStrategy extends BaseCompressionStrategy {
  name = 'adjacency-lists';
  description = 'Relationship graphs using adjacency list notation';

  private nodes: Map<string, GraphNode> = new Map();
  private edges: GraphEdge[] = [];

  async compress(input: DocumentInput, config: StrategyConfig): Promise<CompressionResult> {
    const startTime = Date.now();

    // 1. Extract all text
    const allText = input.files.map(f => f.content).join('\n\n');

    // 2. Extract concepts (nodes)
    this.extractNodes(allText);

    // 3. Extract relationships (edges)
    this.extractEdges(allText);

    // 4. Build adjacency lists
    const adjacencyLists = this.buildAdjacencyLists();

    // 5. Create structure
    const structure = {
      META: {
        format_version: '1.0',
        compression_strategy: this.name,
        source_files: input.fileCount,
        original_size_bytes: input.totalSize,
        generated_at: new Date().toISOString(),
        graph_stats: {
          nodes: this.nodes.size,
          edges: this.edges.length,
          avg_connections: (this.edges.length / this.nodes.size).toFixed(1)
        }
      },
      NODES: this.serializeNodes(),
      RELATIONSHIPS: adjacencyLists
    };

    // 6. Generate YAML
    const compressed = YAML.stringify(structure, {
      indent: 2,
      lineWidth: 120
    });

    const compressedSize = Buffer.byteLength(compressed, 'utf-8');
    const compressionRatio = input.totalSize / compressedSize;

    return {
      compressed,
      compressionRatio,
      originalSize: input.totalSize,
      compressedSize,
      metadata: {
        strategy: this.name,
        timestamp: new Date().toISOString(),
        config,
        processingTimeMs: Date.now() - startTime,
        nodesExtracted: this.nodes.size,
        edgesExtracted: this.edges.length
      }
    };
  }

  /**
   * Extract concepts as nodes
   */
  private extractNodes(text: string): void {
    this.nodes.clear();

    // Extract from headings
    const headings = text.matchAll(/^#{1,6}\s+(.+)$/gm);
    for (const match of headings) {
      const name = match[1].trim();
      const id = this.generateNodeId(name);

      if (!this.nodes.has(id)) {
        this.nodes.set(id, {
          id,
          name,
          type: 'section'
        });
      }
    }

    // Extract from bold terms (definitions)
    const boldTerms = text.matchAll(/\*\*([^*]+)\*\*/g);
    for (const match of boldTerms) {
      const name = match[1].trim();
      const id = this.generateNodeId(name);

      if (!this.nodes.has(id) && name.length < 50) {
        this.nodes.set(id, {
          id,
          name,
          type: 'concept'
        });
      }
    }

    // Extract from code/technical terms
    const codeTerms = text.matchAll(/`([^`]+)`/g);
    for (const match of codeTerms) {
      const name = match[1].trim();
      const id = this.generateNodeId(name);

      if (!this.nodes.has(id) && name.length < 30 && !name.includes(' ')) {
        this.nodes.set(id, {
          id,
          name,
          type: 'technical'
        });
      }
    }
  }

  /**
   * Extract relationships as edges
   */
  private extractEdges(text: string): void {
    this.edges = [];

    // Relationship patterns
    const patterns: Array<{ pattern: RegExp; relationship: string }> = [
      { pattern: /(\w+)\s+enables?\s+(\w+)/gi, relationship: 'enables' },
      { pattern: /(\w+)\s+requires?\s+(\w+)/gi, relationship: 'requires' },
      { pattern: /(\w+)\s+uses?\s+(\w+)/gi, relationship: 'uses' },
      { pattern: /(\w+)\s+depends?\s+on\s+(\w+)/gi, relationship: 'depends_on' },
      { pattern: /(\w+)\s+is\s+composed\s+of\s+(\w+)/gi, relationship: 'composed_of' },
      { pattern: /(\w+)\s+prevents?\s+(\w+)/gi, relationship: 'prevents' },
      { pattern: /(\w+)\s+→\s+(\w+)/g, relationship: 'leads_to' },
      { pattern: /(\w+)\s+creates?\s+(\w+)/gi, relationship: 'creates' },
      { pattern: /(\w+)\s+implements?\s+(\w+)/gi, relationship: 'implements' }
    ];

    for (const { pattern, relationship } of patterns) {
      const matches = text.matchAll(pattern);
      for (const match of matches) {
        const from = this.generateNodeId(match[1]);
        const to = this.generateNodeId(match[2]);

        // Only add if both nodes exist
        if (this.nodes.has(from) && this.nodes.has(to)) {
          this.edges.push({ from, to, relationship });
        }
      }
    }

    // Remove duplicate edges
    this.edges = this.deduplicateEdges(this.edges);
  }

  /**
   * Build adjacency lists from edges
   */
  private buildAdjacencyLists(): any {
    const lists: any = {};

    // Group by relationship type
    const byType = new Map<string, GraphEdge[]>();
    for (const edge of this.edges) {
      if (!byType.has(edge.relationship)) {
        byType.set(edge.relationship, []);
      }
      byType.get(edge.relationship)!.push(edge);
    }

    // Build adjacency lists for each relationship type
    for (const [relType, edges] of byType.entries()) {
      const adjacency: any = {};

      for (const edge of edges) {
        const fromNode = this.nodes.get(edge.from);
        if (!fromNode) continue;

        if (!adjacency[fromNode.name]) {
          adjacency[fromNode.name] = [];
        }

        const toNode = this.nodes.get(edge.to);
        if (toNode) {
          adjacency[fromNode.name].push(toNode.name);
        }
      }

      if (Object.keys(adjacency).length > 0) {
        lists[relType] = adjacency;
      }
    }

    return lists;
  }

  /**
   * Serialize nodes compactly
   */
  private serializeNodes(): any {
    const byType: any = {};

    for (const node of this.nodes.values()) {
      const type = node.type || 'other';
      if (!byType[type]) {
        byType[type] = [];
      }
      byType[type].push(node.name);
    }

    return byType;
  }

  /**
   * Generate consistent node ID
   */
  private generateNodeId(name: string): string {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '_')
      .replace(/^_|_$/g, '');
  }

  /**
   * Remove duplicate edges
   */
  private deduplicateEdges(edges: GraphEdge[]): GraphEdge[] {
    const seen = new Set<string>();
    const unique: GraphEdge[] = [];

    for (const edge of edges) {
      const key = `${edge.from}:${edge.relationship}:${edge.to}`;
      if (!seen.has(key)) {
        seen.add(key);
        unique.push(edge);
      }
    }

    return unique;
  }

  protected calculateFidelity(result: CompressionResult, original: DocumentInput): number {
    // Check if relationships are preserved
    const originalText = original.files.map(f => f.content).join('\n');
    const originalRels = this.extractRelationships(originalText);
    const compressedRels = this.edges;

    if (originalRels.length === 0) return 1.0;

    // Count how many relationships are preserved
    let preserved = 0;
    for (const origRel of originalRels) {
      if (compressedRels.some(r =>
        r.from === this.generateNodeId(origRel.from) &&
        r.to === this.generateNodeId(origRel.to)
      )) {
        preserved++;
      }
    }

    return Math.min(1.0, preserved / originalRels.length);
  }

  protected calculateCoverage(result: CompressionResult, original: DocumentInput): number {
    // Graph coverage - percentage of concepts captured
    const originalText = original.files.map(f => f.content).join('\n');
    const originalConcepts = this.extractConcepts(originalText);

    if (originalConcepts.length === 0) return 1.0;

    const capturedConcepts = Array.from(this.nodes.values()).map(n => n.name);
    let covered = 0;

    for (const concept of originalConcepts) {
      if (capturedConcepts.some(c => this.conceptsMatch(c, concept))) {
        covered++;
      }
    }

    return covered / originalConcepts.length;
  }
}
