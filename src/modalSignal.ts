import { useSyncExternalStore } from '@harborclient/sdk/react';

interface ModalState {
  open: boolean;
  editingId: string | null;
}

let modalState: ModalState = { open: false, editingId: null };
const modalListeners = new Set<() => void>();

/**
 * Notifies modal state subscribers.
 */
function notifyModal(): void {
  for (const listener of modalListeners) {
    listener();
  }
}

/**
 * Subscribes to modal open/edit state changes.
 *
 * @param listener - Callback invoked when modal state changes.
 */
export function subscribeModal(listener: () => void): () => void {
  modalListeners.add(listener);
  return () => {
    modalListeners.delete(listener);
  };
}

/**
 * Returns the current modal state snapshot.
 */
export function getModalSnapshot(): ModalState {
  return modalState;
}

/**
 * Opens the schema modal in add mode.
 */
export function openAddModal(): void {
  modalState = { open: true, editingId: null };
  notifyModal();
}

/**
 * Opens the schema modal to edit an existing schema.
 *
 * @param id - Schema id to edit.
 */
export function openEditModal(id: string): void {
  modalState = { open: true, editingId: id };
  notifyModal();
}

/**
 * Closes the schema modal.
 */
export function closeModal(): void {
  modalState = { open: false, editingId: null };
  notifyModal();
}

/**
 * React hook for sidebar modal open state shared with header actions.
 */
export function useModalState(): ModalState {
  return useSyncExternalStore(subscribeModal, getModalSnapshot, () => ({
    open: false,
    editingId: null
  }));
}
