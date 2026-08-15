import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useWorkspaceRuntime } from "@/production/app/WorkspaceRuntime";
import { useProductStore } from "@/stores/productStore";
import type { Category } from "@/types/product";
import { buildCategoryTree, withAncestors } from "./categoryTree";

const PAGE_SIZE = 25;

interface BranchState {
  hasMore: boolean;
  loading: boolean;
  page: number;
}

export function useCategoryTree(open: boolean, query: string, selectedIds: number[]) {
  const { bootstrap, client } = useWorkspaceRuntime();
  const categories = useProductStore((state) => state.categories);
  const mergeCategories = useProductStore((state) => state.mergeCategories);
  const [collapsed, setCollapsed] = useState<Set<number>>(new Set());
  const [branches, setBranches] = useState<Record<number, BranchState>>({});
  const [rootState, setRootState] = useState<BranchState>({ hasMore: false, loading: false, page: 0 });
  const [searchItems, setSearchItems] = useState<Category[]>([]);
  const [searching, setSearching] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const searchRequest = useRef<AbortController | null>(null);

  const loadRoots = useCallback(async (page = 1) => {
    if (!bootstrap.features.categoryLookup || rootState.loading) return;
    setRootState((state) => ({ ...state, loading: true }));
    try {
      const result = await client.listCategories({ page, parent: 0, perPage: PAGE_SIZE });
      mergeCategories(result.items);
      setCollapsed((current) => {
        const next = new Set(current);
        result.items.filter((item) => item.hasChildren).forEach((item) => next.add(item.id));
        return next;
      });
      setRootState({ hasMore: result.has_more, loading: false, page: result.page });
      setLoadError(false);
    } catch {
      setRootState((state) => ({ ...state, loading: false }));
      setLoadError(true);
    }
  }, [bootstrap.features.categoryLookup, client, mergeCategories, rootState.loading]);

  const loadChildren = useCallback(async (parent: number, page = 1) => {
    if (branches[parent]?.loading) return;
    setBranches((state) => ({ ...state, [parent]: { ...state[parent], hasMore: false, loading: true, page: state[parent]?.page ?? 0 } }));
    try {
      const result = await client.listCategories({ page, parent, perPage: PAGE_SIZE });
      mergeCategories(result.items);
      setCollapsed((current) => {
        const next = new Set(current);
        result.items.filter((item) => item.hasChildren).forEach((item) => next.add(item.id));
        return next;
      });
      setBranches((state) => ({ ...state, [parent]: { hasMore: result.has_more, loading: false, page: result.page } }));
      setLoadError(false);
    } catch {
      setBranches((state) => ({ ...state, [parent]: { ...state[parent], hasMore: false, loading: false, page: state[parent]?.page ?? 0 } }));
      setLoadError(true);
    }
  }, [branches, client, mergeCategories]);

  useEffect(() => {
    if (open && rootState.page === 0) void loadRoots();
  }, [loadRoots, open, rootState.page]);

  useEffect(() => {
    if (!selectedIds.length || !bootstrap.features.categoryLookup) return;
    const missing = selectedIds.filter((id) => !categories.some((category) => category.id === id));
    if (!missing.length) return;
    void client.listCategories({ include: missing, perPage: 20 }).then((result) => {
      mergeCategories(withAncestors(result.items));
    }).catch(() => setLoadError(true));
  }, [bootstrap.features.categoryLookup, categories, client, mergeCategories, selectedIds]);

  useEffect(() => {
    const search = query.trim();
    searchRequest.current?.abort();
    if (!open || !search) {
      setSearchItems([]);
      setSearching(false);
      return;
    }
    const controller = new AbortController();
    searchRequest.current = controller;
    const timer = window.setTimeout(() => {
      setSearching(true);
      void client.listCategories({ perPage: 20, search, signal: controller.signal }).then((result) => {
        const contextual = withAncestors(result.items);
        mergeCategories(contextual);
        setSearchItems(contextual);
        setLoadError(false);
      }).catch((error: unknown) => {
        if (!(error instanceof DOMException && error.name === "AbortError")) setLoadError(true);
      }).finally(() => {
        if (!controller.signal.aborted) setSearching(false);
      });
    }, 250);
    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [client, mergeCategories, open, query]);

  const toggleCollapse = useCallback((category: Category) => {
    const expanding = collapsed.has(category.id);
    setCollapsed((current) => {
      const next = new Set(current);
      if (expanding) next.delete(category.id);
      else next.add(category.id);
      return next;
    });
    if (expanding && category.hasChildren && !branches[category.id]) void loadChildren(category.id);
  }, [branches, collapsed, loadChildren]);

  const tree = useMemo(
    () => buildCategoryTree(query.trim() ? searchItems : categories),
    [categories, query, searchItems],
  );

  return {
    branches,
    collapsed,
    loadChildren,
    loadError,
    loadRoots,
    rootState,
    searching,
    toggleCollapse,
    tree,
  };
}
