import Product from "@/models/Product";
import { type ClientSession } from "mongoose";

export type InventoryItem = {
    productId: string;
    quantity: number;
};

function coalesceInventory(items: InventoryItem[]) {
    const totals = new Map<string, number>();

    for (const item of items) {
        if (!item.productId || item.quantity <= 0) continue;
        totals.set(item.productId, (totals.get(item.productId) || 0) + item.quantity);
    }

    return [...totals.entries()].map(([productId, quantity]) => ({ productId, quantity }));
}

export function getInventoryItems(items: unknown): InventoryItem[] {
    if (!Array.isArray(items)) return [];

    return coalesceInventory(
        items
            .map((item) => {
                const value = item as { productId?: string; quantity?: number };
                return {
                    productId: `${value?.productId || ""}`.trim(),
                    quantity: Math.max(0, Number(value?.quantity) || 0),
                };
            })
            .filter((item) => item.productId && item.quantity > 0)
    );
}

export async function reserveInventory(items: InventoryItem[], session?: ClientSession) {
    const normalizedItems = coalesceInventory(items);
    const reservedItems: InventoryItem[] = [];

    try {
        for (const item of normalizedItems) {
            const updated = await Product.findOneAndUpdate(
                { _id: item.productId, stockQuantity: { $gte: item.quantity } },
                { $inc: { stockQuantity: -item.quantity } },
                { new: true, select: "_id stockQuantity", session }
            );

            if (!updated) {
                throw new Error("One or more items are out of stock");
            }

            await Product.updateOne(
                { _id: item.productId },
                { $set: { inStock: Number(updated.stockQuantity) > 0 } },
                { session }
            );

            reservedItems.push(item);
        }
    } catch (error) {
        if (reservedItems.length > 0 && !session) {
            await restoreInventory(reservedItems);
        }

        throw error;
    }
}

export async function restoreInventory(items: InventoryItem[], session?: ClientSession) {
    const normalizedItems = coalesceInventory(items);

    if (normalizedItems.length === 0) {
        return;
    }

    await Product.bulkWrite(
        normalizedItems.map((item) => ({
            updateOne: {
                filter: { _id: item.productId },
                update: { $inc: { stockQuantity: item.quantity } },
            },
        })),
        { session }
    );

    await Product.updateMany(
        { _id: { $in: normalizedItems.map((item) => item.productId) } },
        { $set: { inStock: true } },
        { session }
    );
}
