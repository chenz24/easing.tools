import {
  type AnimationType,
  type FillType,
  PREVIEW_STORAGE_KEY,
  type PreviewItem,
  type ShapeType,
  defaultPreviewItems,
} from "@/lib/previewTypes";
import { useCallback, useEffect, useState } from "react";

/**
 * Factory: creates a preview-item store backed by localStorage.
 * Both easing and spring preview panels share the same logic —
 * only the storage key and id prefix differ.
 */
export function createPreviewStore(storageKey: string, idPrefix: string) {
  function getStoredPreviews(): PreviewItem[] {
    try {
      const stored = localStorage.getItem(storageKey);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (e) {
      console.error("Failed to load preview items:", e);
    }
    return defaultPreviewItems;
  }

  function savePreviews(items: PreviewItem[]): void {
    try {
      localStorage.setItem(storageKey, JSON.stringify(items));
    } catch (e) {
      console.error("Failed to save preview items:", e);
    }
  }

  return function useStore() {
    const [previews, setPreviews] = useState<PreviewItem[]>(() => getStoredPreviews());

    // Persist to localStorage when previews change
    useEffect(() => {
      savePreviews(previews);
    }, [previews]);

    // Add a new preview item
    const addPreview = useCallback(() => {
      const newItem: PreviewItem = {
        id: `${idPrefix}-${Date.now()}`,
        shape: "rectangle",
        fill: "solid",
        animation: "position",
      };
      setPreviews((prev) => [...prev, newItem]);
      return newItem;
    }, []);

    // Update a preview item's configuration
    const updatePreview = useCallback((id: string, updates: Partial<Omit<PreviewItem, "id">>) => {
      setPreviews((prev) => prev.map((item) => (item.id === id ? { ...item, ...updates } : item)));
    }, []);

    // Update shape
    const updateShape = useCallback(
      (id: string, shape: ShapeType) => {
        updatePreview(id, { shape });
      },
      [updatePreview],
    );

    // Update fill
    const updateFill = useCallback(
      (id: string, fill: FillType) => {
        updatePreview(id, { fill });
      },
      [updatePreview],
    );

    // Update animation
    const updateAnimation = useCallback(
      (id: string, animation: AnimationType) => {
        updatePreview(id, { animation });
      },
      [updatePreview],
    );

    // Duplicate a preview item
    const duplicatePreview = useCallback((id: string) => {
      setPreviews((prev) => {
        const original = prev.find((item) => item.id === id);
        if (!original) return prev;

        const duplicate: PreviewItem = {
          ...original,
          id: `${idPrefix}-${Date.now()}`,
        };

        const index = prev.findIndex((item) => item.id === id);
        const newPreviews = [...prev];
        newPreviews.splice(index + 1, 0, duplicate);
        return newPreviews;
      });
    }, []);

    // Delete a preview item
    const deletePreview = useCallback((id: string) => {
      setPreviews((prev) => prev.filter((item) => item.id !== id));
    }, []);

    // Reset to default previews
    const resetPreviews = useCallback(() => {
      setPreviews(defaultPreviewItems);
    }, []);

    return {
      previews,
      addPreview,
      updatePreview,
      updateShape,
      updateFill,
      updateAnimation,
      duplicatePreview,
      deletePreview,
      resetPreviews,
    };
  };
}

export const usePreviewStore = createPreviewStore(PREVIEW_STORAGE_KEY, "preview");
