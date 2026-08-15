import type { Category } from "@/types/product";

export interface CategoryTreeNode {
  category: Category;
  children: CategoryTreeNode[];
}

export function withAncestors(categories: Category[]): Category[] {
  const result = new Map<number, Category>();
  categories.forEach((category) => {
    category.ancestors?.forEach((ancestor) => result.set(ancestor.id, ancestor));
    result.set(category.id, category);
  });
  return [...result.values()];
}

export function buildCategoryTree(categories: Category[]): CategoryTreeNode[] {
  const map = new Map<number, CategoryTreeNode>();
  categories.forEach((category) => map.set(category.id, { category, children: [] }));
  const roots: CategoryTreeNode[] = [];
  categories.forEach((category) => {
    const node = map.get(category.id);
    if (!node) return;
    const parent = category.parent ? map.get(category.parent) : undefined;
    if (parent) parent.children.push(node);
    else roots.push(node);
  });
  const sort = (nodes: CategoryTreeNode[]) => {
    nodes.sort((left, right) => left.category.name.localeCompare(right.category.name));
    nodes.forEach((node) => sort(node.children));
  };
  sort(roots);
  return roots;
}
