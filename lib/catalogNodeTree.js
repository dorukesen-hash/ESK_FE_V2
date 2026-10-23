import { slugify } from './slugify';

export function findNode(tree, nodeId) {
  for (const node of tree) {
    if (node.id === nodeId) return node;
    const found = findNode(node.children ?? [], nodeId);
    if (found) return found;
  }
  return null;
}

export function findAncestors(tree, nodeId) {
  function search(nodes, trail) {
    for (const node of nodes) {
      if (node.id === nodeId) return trail;
      const found = search(node.children ?? [], [...trail, node]);
      if (found) return found;
    }
    return null;
  }
  return search(tree, []) ?? [];
}

export function findNodeBySlug(tree, slug) {
  for (const node of tree) {
    if (slugify(node.name) === slug) return node;
    const found = findNodeBySlug(node.children ?? [], slug);
    if (found) return found;
  }
  return null;
}

export function canonicalPath(tree, nodeId) {
  const node = findNode(tree, nodeId);
  if (!node) return [];
  return [...findAncestors(tree, nodeId), node].map((n) => slugify(n.name));
}

export function countDescendantVariants(node) {
  return (
    (node.variants?.length ?? 0) +
    (node.children ?? []).reduce((total, child) => total + countDescendantVariants(child), 0)
  );
}
