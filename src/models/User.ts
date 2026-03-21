import mongoose from "mongoose";

const UserSchema = new mongoose.Schema(
    {
        name: { type: String, required: true },
        email: { type: String, required: true, unique: true },
        password: { type: String, required: true },
        whatsapp: { type: String, required: true },
        address: { type: String },
        savedAddresses: [{
            label: { type: String, required: true },
            address: { type: String, required: true },
            lat: { type: Number, required: true },
            lng: { type: Number, required: true }
        }],
        role: {
            type: String,
            enum: ["user", "admin", "rider"],
            default: "user",
        },
        currentLocation: {
            latitude: { type: Number },
            longitude: { type: Number },
            updatedAt: { type: Date }
        },
        walletBalance: { type: Number, default: 0 },
        isVerified: { type: Boolean, default: false },
        verifyOtp: { type: String },
        verifyOtpExpiry: { type: Date },
        resetToken: { type: String },
        resetTokenExpiry: { type: Date }
    },
    { timestamps: true }
);

export default mongoose.models.User || mongoose.model("User", UserSchema);
