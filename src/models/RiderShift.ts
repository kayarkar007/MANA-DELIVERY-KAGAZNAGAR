import mongoose, { Schema, Document } from "mongoose";

export interface IRiderShift extends Document {
    riderId: string;
    status: "active" | "on_break" | "ended";
    startedAt: Date;
    endedAt?: Date;
    currentBreakStartedAt?: Date;
    breakMinutes: number;
    completedOrders: number;
    earnings: number;
    createdAt: Date;
    updatedAt: Date;
}

const RiderShiftSchema = new Schema<IRiderShift>({
    riderId: { type: String, required: true, index: true },
    status: { type: String, enum: ["active", "on_break", "ended"], default: "active" },
    startedAt: { type: Date, default: Date.now },
    endedAt: { type: Date },
    currentBreakStartedAt: { type: Date },
    breakMinutes: { type: Number, default: 0 },
    completedOrders: { type: Number, default: 0 },
    earnings: { type: Number, default: 0 },
}, { timestamps: true });

RiderShiftSchema.index({ riderId: 1, startedAt: -1 });

export default mongoose.models.RiderShift || mongoose.model<IRiderShift>("RiderShift", RiderShiftSchema);
