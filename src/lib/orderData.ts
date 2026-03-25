import Product from "@/models/Product";

type OrderItemLike = {
    productId?: string;
    image?: string;
};

type OrderLike = {
    items?: OrderItemLike[];
    toObject?: () => Record<string, any>;
};

function toPlainOrder(order: OrderLike | Record<string, any>) {
    const maybeOrder = order as OrderLike;
    if (typeof maybeOrder.toObject === "function") {
        return maybeOrder.toObject();
    }

    return order;
}

export async function hydrateOrderItemImages<T extends OrderLike | OrderLike[]>(input: T): Promise<T> {
    const orders = Array.isArray(input) ? input : [input];
    const plainOrders = orders.map((order) => toPlainOrder(order) as Record<string, any>);

    const productIds = Array.from(
        new Set(
            plainOrders.flatMap((order) =>
                Array.isArray(order.items)
                    ? order.items
                        .filter((item: Record<string, any>) => item?.productId && !item?.image)
                        .map((item: Record<string, any>) => item.productId.toString())
                    : []
            )
        )
    );

    if (productIds.length === 0) {
        return (Array.isArray(input) ? plainOrders : plainOrders[0]) as T;
    }

    const products = await Product.find({ _id: { $in: productIds } }).select("_id image").lean();
    const imageMap = new Map(
        products.map((product: any) => [product._id.toString(), product.image || ""])
    );

    const hydratedOrders = plainOrders.map((order) => ({
        ...order,
        items: Array.isArray(order.items)
            ? order.items.map((item: Record<string, any>) => ({
                ...item,
                image:
                    item.image ||
                    imageMap.get(item.productId?.toString?.() ?? item.productId) ||
                    undefined,
            }))
            : order.items,
    }));

    return (Array.isArray(input) ? hydratedOrders : hydratedOrders[0]) as T;
}
