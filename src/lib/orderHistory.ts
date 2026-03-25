type HistoryEntryInput = {
    status?: string;
    deliveryStatus?: string;
    label: string;
    note?: string;
    actorRole?: string;
    actorId?: string;
};

export function buildOrderHistoryEntry(input: HistoryEntryInput) {
    return {
        status: input.status,
        deliveryStatus: input.deliveryStatus,
        label: input.label,
        note: input.note,
        actorRole: input.actorRole,
        actorId: input.actorId,
        at: new Date(),
    };
}
