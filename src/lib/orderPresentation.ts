type OrderItemLike = {
    image?: string;
    name?: string;
    quantity?: number;
};

type OrderLike = {
    type?: string;
    items?: OrderItemLike[];
    serviceCategory?: string;
};

export function getPrimaryOrderImage(order?: OrderLike | null) {
    if (!order || order.type !== "product" || !Array.isArray(order.items)) {
        return null;
    }

    return order.items.find((item) => item?.image)?.image || null;
}

export function getOrderItemSummary(order?: OrderLike | null) {
    if (!order) return "Order details unavailable";

    if (order.type === "service") {
        return order.serviceCategory || "Service request";
    }

    if (!Array.isArray(order.items) || order.items.length === 0) {
        return "No items";
    }

    return order.items
        .map((item) => `${item.quantity || 0}x ${item.name || "Item"}`)
        .join(", ");
}

export function getOrderMetaLabel(order?: OrderLike | null) {
    if (!order) return "No details";

    if (order.type === "service") {
        return "Service request";
    }

    const distinctItems = order.items?.length || 0;
    const totalUnits =
        order.items?.reduce((sum, item) => sum + (Number(item.quantity) || 0), 0) || 0;

    if (!distinctItems) {
        return "No items";
    }

    const itemLabel = distinctItems === 1 ? "item" : "items";
    const unitLabel = totalUnits === 1 ? "unit" : "units";

    return `${distinctItems} ${itemLabel} | ${totalUnits} ${unitLabel}`;
}

export function getMappedOrderStatus(deliveryStatus?: string, fallbackStatus = "pending") {
    switch (deliveryStatus) {
        case "assigned":
        case "accepted":
            return fallbackStatus === "pending" ? "processing" : fallbackStatus;
        case "picked_up":
        case "out_for_delivery":
            return "shipped";
        case "delivered":
            return "delivered";
        case "cancelled":
            return "cancelled";
        case "declined":
            return ["cancelled", "delivered"].includes(fallbackStatus) ? fallbackStatus : "pending";
        default:
            return fallbackStatus;
    }
}
