export const ORDER_STATUSES = ["pending", "processing", "shipped", "delivered", "cancelled"] as const;
export const DELIVERY_STATUSES = ["pending", "assigned", "accepted", "declined", "picked_up", "out_for_delivery", "delivered", "cancelled"] as const;

type OrderStatus = (typeof ORDER_STATUSES)[number];
type DeliveryStatus = (typeof DELIVERY_STATUSES)[number];

const orderTransitions: Record<OrderStatus, readonly OrderStatus[]> = {
    pending: ["processing", "cancelled"],
    processing: ["shipped", "cancelled"],
    shipped: ["delivered", "cancelled"],
    delivered: [],
    cancelled: [],
};

const deliveryTransitions: Record<DeliveryStatus, readonly DeliveryStatus[]> = {
    pending: ["assigned", "cancelled"],
    assigned: ["accepted", "declined", "pending", "cancelled"],
    accepted: ["picked_up", "cancelled"],
    declined: ["assigned", "cancelled"],
    picked_up: ["out_for_delivery", "cancelled"],
    out_for_delivery: ["delivered", "cancelled"],
    delivered: [],
    cancelled: [],
};

export function isOrderStatus(value: string): value is OrderStatus {
    return (ORDER_STATUSES as readonly string[]).includes(value);
}

export function isDeliveryStatus(value: string): value is DeliveryStatus {
    return (DELIVERY_STATUSES as readonly string[]).includes(value);
}

export function canTransitionOrderStatus(current: string, next: string) {
    return current === next || (isOrderStatus(current) && isOrderStatus(next) && orderTransitions[current].includes(next));
}

export function canTransitionDeliveryStatus(current: string, next: string) {
    return current === next || (isDeliveryStatus(current) && isDeliveryStatus(next) && deliveryTransitions[current].includes(next));
}
