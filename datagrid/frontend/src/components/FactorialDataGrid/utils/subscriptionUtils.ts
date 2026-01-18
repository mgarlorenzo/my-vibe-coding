import { SubscriptionEvent, RowId } from '../types';

/**
 * Default implementation for applying subscription events to rows.
 * Can be used as a reference or directly passed to subscriptionConfig.applyEvent
 */
export function defaultApplyEvent<T>(
  rows: T[],
  event: SubscriptionEvent<T>,
  getRowId: (row: T) => RowId
): T[] {
  switch (event.type) {
    case 'CREATED':
      if (event.row) {
        // Check if row already exists (upsert behavior)
        const existingIndex = rows.findIndex(r => getRowId(r) === event.id);
        if (existingIndex >= 0) {
          return rows.map((r, i) => i === existingIndex ? event.row! : r);
        }
        return [...rows, event.row];
      }
      return rows;

    case 'UPSERT':
      if (event.row) {
        const existingIndex = rows.findIndex(r => getRowId(r) === event.id);
        if (existingIndex >= 0) {
          return rows.map((r, i) => i === existingIndex ? event.row! : r);
        }
        return [...rows, event.row];
      }
      return rows;

    case 'UPDATED':
      if (event.row) {
        return rows.map(r => getRowId(r) === event.id ? event.row! : r);
      }
      if (event.patch) {
        return rows.map(r => 
          getRowId(r) === event.id 
            ? { ...r, ...event.patch } 
            : r
        );
      }
      return rows;

    case 'DELETED':
    case 'TERMINATED':
      return rows.filter(r => getRowId(r) !== event.id);

    default:
      return rows;
  }
}

/**
 * Creates a debounced event handler for subscription events.
 * Useful when receiving bursts of events.
 */
export function createDebouncedEventHandler<T>(
  handler: (events: SubscriptionEvent<T>[]) => void,
  debounceMs: number = 100
): (event: SubscriptionEvent<T>) => void {
  let events: SubscriptionEvent<T>[] = [];
  let timeoutId: ReturnType<typeof setTimeout> | null = null;

  return (event: SubscriptionEvent<T>) => {
    events.push(event);

    if (timeoutId) {
      clearTimeout(timeoutId);
    }

    timeoutId = setTimeout(() => {
      handler(events);
      events = [];
      timeoutId = null;
    }, debounceMs);
  };
}

/**
 * Merges multiple events for the same row into a single event.
 * Useful for optimizing batch updates.
 */
export function mergeEvents<T>(events: SubscriptionEvent<T>[]): SubscriptionEvent<T>[] {
  const eventsByRow = new Map<RowId, SubscriptionEvent<T>>();

  for (const event of events) {
    const existing = eventsByRow.get(event.id);

    if (!existing) {
      eventsByRow.set(event.id, event);
      continue;
    }

    // Merge logic
    if (event.type === 'DELETED' || event.type === 'TERMINATED') {
      // Delete/terminate takes precedence
      eventsByRow.set(event.id, event);
    } else if (existing.type === 'CREATED' && event.type === 'UPDATED') {
      // Created + Updated = Created with updated data
      eventsByRow.set(event.id, {
        ...existing,
        row: event.row || (existing.row && event.patch 
          ? { ...existing.row, ...event.patch } 
          : existing.row),
      });
    } else if (existing.type === 'UPDATED' && event.type === 'UPDATED') {
      // Merge patches
      eventsByRow.set(event.id, {
        ...event,
        row: event.row,
        patch: existing.patch && event.patch 
          ? { ...existing.patch, ...event.patch }
          : event.patch || existing.patch,
      });
    } else {
      // Default: use latest event
      eventsByRow.set(event.id, event);
    }
  }

  return Array.from(eventsByRow.values());
}

/**
 * Creates a subscription handler that integrates with Apollo Client.
 * 
 * @example
 * ```tsx
 * import { useSubscription } from '@apollo/client';
 * 
 * function MyGrid() {
 *   const subscriptionConfig = createApolloSubscriptionConfig(
 *     EMPLOYEE_SUBSCRIPTION,
 *     {},
 *     (data) => ({
 *       type: data.employeeChanged.eventType,
 *       id: data.employeeChanged.employee.id,
 *       row: data.employeeChanged.employee,
 *     })
 *   );
 * 
 *   return <FactorialDataGrid subscriptionConfig={subscriptionConfig} />;
 * }
 * ```
 */
export function createApolloSubscriptionConfig<T, TData>(
  _useSubscriptionHook: (options: { 
    onData: (options: { data: { data?: TData } }) => void 
  }) => void,
  _variables: Record<string, unknown>,
  _transformEvent: (data: TData) => SubscriptionEvent<T>
) {
  return {
    subscribe: (_handler: (event: SubscriptionEvent<T>) => void) => {
      // This is a simplified example - in practice you'd use the hook properly
      // The actual implementation depends on how you structure your React components
      console.warn('createApolloSubscriptionConfig is a helper pattern - implement subscription in your component');
      return () => {};
    },
  };
}

/**
 * Example pattern for using subscriptions with the grid.
 * 
 * @example
 * ```tsx
 * function EmployeeGrid() {
 *   const gridRef = useRef<GridStore<Employee>>();
 *   
 *   // Apollo subscription
 *   useSubscription(EMPLOYEE_SUBSCRIPTION, {
 *     onData: ({ data }) => {
 *       if (data.data?.employeeChanged) {
 *         const event = data.data.employeeChanged;
 *         gridRef.current?.getState().applySubscriptionEvent({
 *           type: event.eventType,
 *           id: event.employee.id,
 *           row: event.employee,
 *         });
 *       }
 *     },
 *   });
 * 
 *   return (
 *     <FactorialDataGrid
 *       ref={gridRef}
 *       rows={employees}
 *       columns={columns}
 *       getRowId={(row) => row.id}
 *     />
 *   );
 * }
 * ```
 */
