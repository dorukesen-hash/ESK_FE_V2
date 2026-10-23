import { describe, it, expect } from 'vitest';
import { findNode, findAncestors, findNodeBySlug, canonicalPath } from './catalogNodeTree';

const tree = [
  {
    id: 1,
    name: 'Strapping & Load Securement',
    children: [
      {
        id: 2,
        name: 'Edge Protection',
        children: [{ id: 3, name: 'Corner Board', children: [] }],
      },
      { id: 4, name: 'Woven Strapping', children: [] },
    ],
  },
  { id: 5, name: 'Mailers', children: [] },
];

describe('findNode', () => {
  it('finds a root node', () => {
    expect(findNode(tree, 5)).toBe(tree[1]);
  });

  it('finds a node nested several levels deep', () => {
    expect(findNode(tree, 3)).toBe(tree[0].children[0].children[0]);
  });

  it('returns null for an unknown id', () => {
    expect(findNode(tree, 999)).toBeNull();
  });
});

describe('findAncestors', () => {
  it('returns an empty list for a root node', () => {
    expect(findAncestors(tree, 1)).toEqual([]);
  });

  it('returns ancestors root-first, excluding the node itself', () => {
    const ancestors = findAncestors(tree, 3);
    expect(ancestors.map((n) => n.id)).toEqual([1, 2]);
  });

  it('returns an empty list for an unknown id', () => {
    expect(findAncestors(tree, 999)).toEqual([]);
  });
});

describe('findNodeBySlug', () => {
  it('finds a node at any depth by its slugified name', () => {
    expect(findNodeBySlug(tree, 'corner-board')).toBe(tree[0].children[0].children[0]);
  });

  it('finds a root-level node', () => {
    expect(findNodeBySlug(tree, 'mailers')).toBe(tree[1]);
  });

  it('returns null when no node slugifies to the given slug', () => {
    expect(findNodeBySlug(tree, 'nonexistent')).toBeNull();
  });

  it('picks the first depth-first match when two different names collide on the same slug', () => {
    const collidingTree = [
      { id: 10, name: 'Ambalaj-Malzemeleri', children: [] },
      { id: 11, name: 'Ambalaj Malzemeleri', children: [] },
    ];
    expect(findNodeBySlug(collidingTree, 'ambalaj-malzemeleri').id).toBe(10);
  });
});

describe('canonicalPath', () => {
  it('returns a single slug for a root node', () => {
    expect(canonicalPath(tree, 5)).toEqual(['mailers']);
  });

  it('returns the full slug chain from root to a deeply nested node', () => {
    expect(canonicalPath(tree, 3)).toEqual([
      'strapping-load-securement',
      'edge-protection',
      'corner-board',
    ]);
  });

  it('returns an empty list for an unknown id', () => {
    expect(canonicalPath(tree, 999)).toEqual([]);
  });
});
