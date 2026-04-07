/**
 * Utility functions for grouping and manipulating orders
 */

import { type Order } from './types';

/**
 * Order group interface - represents ONE order (or multiple orders) from the same pharmacy
 * When all medications are ordered from the same pharmacy, there is ONE order with ONE verification code
 */
export interface OrderGroup {
  pharmacyId: string;
  pharmacy: {
    name: string;
    address: string;
    city: string;
    phone?: string;
    latitude?: number | null;
    longitude?: number | null;
  };
  orders: Order[];
  totalItems: number;
  totalPrice: number;
  status: Order['status'];
  createdAt: Date;
  // For same-pharmacy orders placed together, this will contain a single code
  // For separate orders, it contains all codes
  verificationCodes: string[];
}

/**
 * Status priority for determining worst status (pending > confirmed > ready > picked_up/delivered > cancelled)
 */
const STATUS_PRIORITY: Record<string, number> = {
  pending: 5,
  confirmed: 4,
  ready: 3,
  picked_up: 2,
  delivered: 2,
  cancelled: 1,
};

/**
 * Get the worst (least progressed) status from a list of orders
 * This represents the overall status of the group
 */
function getWorstStatus(orders: Order[]): Order['status'] {
  if (orders.length === 0) return 'pending';

  let worstStatus = orders[0].status;
  let highestPriority = STATUS_PRIORITY[worstStatus] || 0;

  for (const order of orders) {
    const priority = STATUS_PRIORITY[order.status] || 0;
    if (priority > highestPriority) {
      highestPriority = priority;
      worstStatus = order.status;
    }
  }

  return worstStatus;
}

/**
 * Get the most recent creation date from a list of orders
 */
function getMostRecentDate(orders: Order[]): Date {
  if (orders.length === 0) return new Date();

  let mostRecent = orders[0].createdAt;

  for (const order of orders) {
    const orderDate = typeof order.createdAt === 'string'
      ? new Date(order.createdAt)
      : order.createdAt;
    const mostRecentDate = typeof mostRecent === 'string'
      ? new Date(mostRecent)
      : mostRecent;
    if (orderDate > mostRecentDate) {
      mostRecent = order.createdAt;
    }
  }

  return typeof mostRecent === 'string' ? new Date(mostRecent) : mostRecent;
}

/**
 * Group orders by pharmacy
 * Orders are grouped if they share the same pharmacyId
 */
export function groupOrdersByPharmacy(orders: Order[]): OrderGroup[] {
  const groups = new Map<string, Order[]>();

  // Group orders by pharmacyId
  for (const order of orders) {
    if (!groups.has(order.pharmacyId)) {
      groups.set(order.pharmacyId, []);
    }
    groups.get(order.pharmacyId)!.push(order);
  }

  // Convert map to array of OrderGroup
  return Array.from(groups.entries())
    .map(([pharmacyId, pharmacyOrders]) => {
      const firstOrder = pharmacyOrders[0];

      return {
        pharmacyId,
        pharmacy: {
          name: firstOrder.pharmacy?.name || 'Pharmacie inconnue',
          address: firstOrder.pharmacy?.address || '',
          city: firstOrder.pharmacy?.city || '',
          phone: firstOrder.pharmacy?.phone,
          latitude: firstOrder.pharmacy?.latitude,
          longitude: firstOrder.pharmacy?.longitude,
        },
        orders: pharmacyOrders,
        totalItems: pharmacyOrders.reduce((sum, o) => sum + o.totalQuantity, 0),
        totalPrice: pharmacyOrders.reduce((sum, o) => sum + o.totalPrice, 0),
        status: getWorstStatus(pharmacyOrders),
        createdAt: getMostRecentDate(pharmacyOrders),
        verificationCodes: pharmacyOrders
          .map(o => o.verificationCode)
          .filter((code): code is string => code !== null && code !== undefined),
      };
    })
    // Sort by most recent first
    .sort((a, b) => {
      const dateA = typeof a.createdAt === 'string' ? new Date(a.createdAt).getTime() : a.createdAt.getTime();
      const dateB = typeof b.createdAt === 'string' ? new Date(b.createdAt).getTime() : b.createdAt.getTime();
      return dateB - dateA;
    });
}

/**
 * Check if multiple orders were placed on the same day at the same pharmacy
 */
export function areSameDayOrders(orders: Order[]): boolean {
  if (orders.length < 2) return false;

  const firstDate = new Date(orders[0].createdAt);
  const firstDay = firstDate.toDateString();

  return orders.every(order => {
    const orderDate = new Date(order.createdAt);
    return orderDate.toDateString() === firstDay;
  });
}

/**
 * Get a summary string for an order group
 */
export function getOrderGroupSummary(group: OrderGroup): string {
  const orderCount = group.orders.length;
  
  // If there's only ONE order (all medications from same pharmacy ordered together)
  if (orderCount === 1) {
    const medicationCount = group.orders[0].items?.length || 1;
    const medicationText = medicationCount === 1
      ? '1 médicament'
      : `${medicationCount} médicaments`;
    return `${medicationText} commandés à ${group.pharmacy.name} - Total ${group.totalPrice.toLocaleString()} FCFA`;
  }
  
  // Multiple orders (different pharmacies or separate orders)
  const medicationCount = group.totalItems;
  const medicationText = medicationCount === 1
    ? '1 médicament'
    : `${medicationCount} médicaments`;

  return `${medicationText} en ${orderCount} commande(s) à ${group.pharmacy.name} - Total ${group.totalPrice.toLocaleString()} FCFA`;
}
