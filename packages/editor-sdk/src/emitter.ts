/**
 * FILE PURPOSE:
 * Type-safe pub/sub event emitter for decoupled editor state change notifications.
 *
 * MAIN RESPONSIBILITY:
 * Provides strongly-typed subscriptions and emissions for canvas mutations,
 * selection changes, zoom updates, history stack state, and layer reordering.
 *
 * CONNECTED SYSTEMS:
 * - packages/editor-sdk/src/RoohaeEditor.ts (owns the emitter instance)
 * - packages/editor-sdk/src/react/useRoohaeEditor.ts (subscribes to events)
 * - packages/ui/src/editor/* (reacts to state updates via hook subscriptions)
 */

type Listener<T> = (payload: T) => void;

/** Minimal typed event emitter — avoids a runtime dependency. */
// EVENT EMITTER:
// Manages listener sets for typed editor events and returns unsubscribe teardown callbacks.
export class Emitter<Events extends Record<keyof Events, unknown>> {

  private listeners = new Map<keyof Events, Set<Listener<never>>>();

  on<K extends keyof Events>(event: K, listener: Listener<Events[K]>): () => void {
    let set = this.listeners.get(event);
    if (!set) {
      set = new Set();
      this.listeners.set(event, set);
    }
    set.add(listener as Listener<never>);
    return () => set!.delete(listener as Listener<never>);
  }

  emit<K extends keyof Events>(event: K, payload: Events[K]): void {
    const set = this.listeners.get(event);
    if (!set) return;
    for (const listener of set) (listener as Listener<Events[K]>)(payload);
  }

  removeAll(): void {
    this.listeners.clear();
  }
}
