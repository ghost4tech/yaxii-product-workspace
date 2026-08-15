import { zodResolver } from "@hookform/resolvers/zod";
import { useCallback, useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { saveDraft } from "@/lib/entryActions";
import { useWorkspaceRuntime } from "@/production/app/WorkspaceRuntime";
import type { CanonicalProduct } from "@/production/domain/products";
import { useWorkspacePreferences } from "@/production/features/preferences/useWorkspacePreferences";
import { fieldsToDraft, nextDraft, preferencesDraft } from "@/production/features/products/productDrafts";
import type { ProductFieldErrors, ProductSubmission } from "@/production/features/products/productMapping";
import { useProductCreate } from "@/production/features/products/useProductCreate";
import { useProductManagement } from "@/production/features/products/useProductManagement";
import { useProductStore } from "@/stores/productStore";
import type { ProductFormData, ProductImage } from "@/types/product";
import type { VariableAttribute, VariationCombination } from "@/production/domain/variableProducts";
import { productEntrySchema } from "./productEntrySchema";
import { toProductEntryValues, type ProductEntryValues } from "./productEntryModel";
import { __ } from "@/production/core/i18n/wordpress";

interface Options {
  onCloseEdit?: () => void;
  onProductSaved?: (product: CanonicalProduct, updated: boolean) => void;
  onProductUpdated?: (product: CanonicalProduct) => void;
  product?: CanonicalProduct | null;
}

function formData(
  values: ProductEntryValues,
  images: ProductImage[],
  saleStart?: Date,
  saleEnd?: Date,
  isVariable = false,
  attributes: VariableAttribute[] = [],
  combinations: VariationCombination[] = [],
): ProductFormData {
  return {
    ...values,
    images,
    isVariable,
    saleScheduleEnd: saleEnd,
    saleScheduleStart: saleStart,
    variations: [], variableAttributes: attributes, variationCombinations: combinations,
  };
}

export function useProductEntryController(options: Options) {
  const { onCloseEdit, onProductSaved, onProductUpdated, product } = options;
  const { bootstrap, client } = useWorkspaceRuntime();
  const { isLoading: preferencesLoading, preferences } = useWorkspacePreferences();
  const draftFormData = useProductStore((state) => state.draftFormData);
  const draftRevision = useProductStore((state) => state.draftRevision);
  const setDraftFormData = useProductStore((state) => state.setDraftFormData);
  const create = useProductCreate(client, bootstrap);
  const manage = useProductManagement(client, bootstrap.locale);
  const [images, setImages] = useState<ProductImage[]>(draftFormData.images);
  const [saleStart, setSaleStart] = useState<Date | undefined>(draftFormData.saleScheduleStart);
  const [saleEnd, setSaleEnd] = useState<Date | undefined>(draftFormData.saleScheduleEnd);
  const [isVariable, setIsVariable] = useState(Boolean(draftFormData.isVariable));
  const [variableAttributes, setVariableAttributes] = useState<VariableAttribute[]>(draftFormData.variableAttributes);
  const [variationCombinations, setVariationCombinations] = useState<VariationCombination[]>(draftFormData.variationCombinations);
  const [variableDirty, setVariableDirty] = useState(false);
  const [conflictOpen, setConflictOpen] = useState(false);
  const [trashOpen, setTrashOpen] = useState(false);
  const nameInputRef = useRef<HTMLInputElement>(null);
  const firstRevision = useRef(draftRevision);
  const priorProductId = useRef<number>();
  const preferencesApplied = useRef(false);
  const form = useForm<ProductEntryValues>({
    defaultValues: toProductEntryValues(draftFormData),
    resolver: zodResolver(productEntrySchema),
  });
  const editing = Boolean(product);
  const canWrite = bootstrap.capabilities.createProducts
    && (editing ? bootstrap.features.productManagement : (isVariable ? bootstrap.features.variableProductCreate : bootstrap.features.simpleProductCreate));

  const hydrate = useCallback((product: CanonicalProduct) => {
    const draft = fieldsToDraft(product, product.images);
    form.reset(toProductEntryValues(draft));
    setImages(draft.images);
    setSaleStart(draft.saleScheduleStart);
    setSaleEnd(draft.saleScheduleEnd);
    setIsVariable(Boolean(draft.isVariable));
    setVariableAttributes(draft.variableAttributes);
    setVariationCombinations(draft.variationCombinations);
    setVariableDirty(false);
  }, [form]);

  useEffect(() => {
    if (product) {
      priorProductId.current = product.id;
      hydrate(product);
    } else if (priorProductId.current) {
      priorProductId.current = undefined;
      const draft = useProductStore.getState().draftFormData;
      form.reset(toProductEntryValues(draft));
      setImages(draft.images);
      setSaleStart(draft.saleScheduleStart);
      setSaleEnd(draft.saleScheduleEnd);
      setIsVariable(Boolean(draft.isVariable));
      setVariableAttributes(draft.variableAttributes);
      setVariationCombinations(draft.variationCombinations);
      setVariableDirty(false);
    }
  }, [form, hydrate, product]);

  useEffect(() => {
    if (editing) return;
    const subscription = form.watch(() => {
      setDraftFormData(formData(form.getValues(), images, saleStart, saleEnd, isVariable, variableAttributes, variationCombinations));
    });
    return () => subscription.unsubscribe();
  }, [editing, form, images, isVariable, saleEnd, saleStart, setDraftFormData, variableAttributes, variationCombinations]);

  useEffect(() => {
    if (editing) return;
    setDraftFormData(formData(form.getValues(), images, saleStart, saleEnd, isVariable, variableAttributes, variationCombinations));
  }, [editing, form, images, isVariable, saleEnd, saleStart, setDraftFormData, variableAttributes, variationCombinations]);

  useEffect(() => {
    if (editing || draftRevision === firstRevision.current) return;
    const draft = useProductStore.getState().draftFormData;
    form.reset(toProductEntryValues(draft));
    setImages(draft.images);
    setSaleStart(draft.saleScheduleStart);
    setSaleEnd(draft.saleScheduleEnd);
    setIsVariable(Boolean(draft.isVariable));
    setVariableAttributes(draft.variableAttributes);
    setVariationCombinations(draft.variationCombinations);
    setVariableDirty(false);
    nameInputRef.current?.focus();
  }, [draftRevision, editing, form]);

  useEffect(() => {
    if (preferences.auto_focus_name) nameInputRef.current?.focus();
  }, [preferences.auto_focus_name]);

  useEffect(() => {
    if (editing || preferencesLoading || preferencesApplied.current || form.formState.isDirty) return;
    preferencesApplied.current = true;
    const values = form.getValues();
    const hasContent = Boolean(values.name || values.sku || values.regularPrice
      || values.categoryId || values.shortDescription || values.longDescription || images.length);
    if (hasContent) return;
    const draft = preferencesDraft(preferences);
    form.reset(toProductEntryValues(draft));
    setDraftFormData(draft);
  }, [editing, form, images.length, preferences, preferencesLoading, setDraftFormData]);

  const applyErrors = useCallback((fields: ProductFieldErrors) => {
    Object.entries(fields).forEach(([field, message]) => {
      if (!message) return;
      if (field === "root") form.setError("root.server", { message });
      else form.setError(field as keyof ProductEntryValues, { message });
    });
  }, [form]);

  const uploadMedia = useCallback(async (file: File): Promise<ProductImage> => {
    if (!bootstrap.capabilities.uploadMedia) {
      throw new Error(__("You are not allowed to upload media.", "yaxii-product-workspace"));
    }
    const media = await client.uploadMedia(file);
    return { id: `wp-${media.id}`, preview: media.url, wpMediaId: media.id };
  }, [bootstrap.capabilities.uploadMedia, client]);

  const submission = useCallback((values: ProductEntryValues): ProductSubmission => ({
    attributes: variableAttributes, combinations: variationCombinations,
    images, isVariable, saleEnd, saleStart, values,
  }), [images, isVariable, saleEnd, saleStart, variableAttributes, variationCombinations]);

  const submit = useCallback(async (values: ProductEntryValues) => {
    form.clearErrors();
    if (!canWrite) {
      form.setError("root.server", { message: __("This product operation is unavailable.", "yaxii-product-workspace") });
      return;
    }
    if (product) {
      const outcome = await manage.update(product, submission(values));
      if (outcome.state === "conflict") setConflictOpen(true);
      if (outcome.product) {
        onProductUpdated?.(outcome.product);
        hydrate(outcome.product);
        if (outcome.state === "succeeded") onProductSaved?.(outcome.product, true);
      }
      applyErrors(outcome.fields);
      return;
    }
    const outcome = await create.submit(submission(values));
    applyErrors(outcome.fields);
    if (outcome.state !== "succeeded" || !outcome.result?.product) return;
    onProductSaved?.(outcome.result.product, false);
    const draft = nextDraft(outcome.result.product, preferences);
    form.reset(toProductEntryValues(draft));
    setImages(draft.images);
    setSaleStart(draft.saleScheduleStart);
    setSaleEnd(draft.saleScheduleEnd);
    setIsVariable(Boolean(draft.isVariable));
    setVariableAttributes(draft.variableAttributes);
    setVariationCombinations(draft.variationCombinations);
    setVariableDirty(false);
    setDraftFormData(draft);
    nameInputRef.current?.focus();
  }, [applyErrors, canWrite, create, form, hydrate, manage, onProductSaved, onProductUpdated, preferences, product, setDraftFormData, submission]);

  const reset = useCallback(() => {
    const draft = product ? fieldsToDraft(product, product.images) : preferencesDraft(preferences);
    form.reset(toProductEntryValues(draft));
    setImages(draft.images);
    setSaleStart(draft.saleScheduleStart);
    setSaleEnd(draft.saleScheduleEnd);
    setIsVariable(Boolean(draft.isVariable));
    setVariableAttributes(draft.variableAttributes);
    setVariationCombinations(draft.variationCombinations);
    setVariableDirty(false);
    if (!product) setDraftFormData(draft);
    nameInputRef.current?.focus();
  }, [form, preferences, product, setDraftFormData]);

  const reloadLatest = useCallback(async () => {
    if (!product) return;
    try {
      const latest = await client.getProduct(product.id);
      onProductUpdated?.(latest);
      hydrate(latest);
      setConflictOpen(false);
    } catch (error) {
      form.setError("root.server", {
        message: error instanceof Error ? error.message : __("The latest product could not be loaded.", "yaxii-product-workspace"),
      });
    }
  }, [client, form, hydrate, onProductUpdated, product]);

  const trash = useCallback(async () => {
    if (!product || !(await manage.trash(product))) return;
    setTrashOpen(false);
    onCloseEdit?.();
  }, [manage, onCloseEdit, product]);

  const changeVariableType = useCallback((value: boolean) => {
    setIsVariable(value);
    setVariableDirty(true);
  }, []);
  const changeVariableAttributes = useCallback((value: VariableAttribute[]) => {
    setVariableAttributes(value);
    setVariableDirty(true);
  }, []);
  const changeVariationCombinations = useCallback((value: VariationCombination[]) => {
    setVariationCombinations(value);
    setVariableDirty(true);
  }, []);

  const cancelEdit = useCallback(() => onCloseEdit?.(), [onCloseEdit]);

  return {
    bootstrap, cancelEdit, canWrite, conflictOpen, create, editing, form, images, manage, nameInputRef,
    isVariable, reloadLatest, reset, saleEnd, saleStart, saveDraft, setConflictOpen, setImages,
    setIsVariable: changeVariableType, setVariableAttributes: changeVariableAttributes,
    setVariationCombinations: changeVariationCombinations, variableAttributes, variableDirty, variationCombinations,
    setSaleEnd, setSaleStart, setTrashOpen, submit, trash, trashOpen, uploadMedia,
  };
}
