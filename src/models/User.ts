import mongoose from "mongoose";

const UserSchema = new mongoose.Schema(
    {
        name: { type: String, required: true },
        // Email is optional for phone-only users; sparse index allows multiple nulls
        email: { type: String, unique: true, sparse: true },
        password: { type: String },
        // Primary contact number — 10-digit Indian mobile
        phone: { type: String, sparse: true, index: true },
        isPhoneVerified: { type: Boolean, default: false },
        phoneOtp: { type: String },       // bcrypt-hashed OTP, cleared after use
        phoneOtpExpiry: { type: Date },
        fcmToken: { type: String },       // Firebase Cloud Messaging token for Android app push notifications
        // Legacy WhatsApp alias (auto-filled from phone on phone-signup)
        whatsapp: { type: String },
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
        isOnDuty: { type: Boolean, default: false },
        dutyStatus: {
            type: String,
            enum: ["offline", "on_duty", "on_break"],
            default: "offline",
        },
        currentShiftStartedAt: { type: Date },
        lastShiftEndedAt: { type: Date },
        currentBreakStartedAt: { type: Date },
        totalBreakMinutes: { type: Number, default: 0 },
        walletBalance: { type: Number, default: 0 },
        referralCode: { type: String, unique: true, sparse: true },
        referredBy: { type: String },
        referralCount: { type: Number, default: 0 },
        isVerified: { type: Boolean, default: false },
        verifyOtp: { type: String },
        verifyOtpExpiry: { type: Date },
        resetToken: { type: String },
    },
    { timestamps: true }
);

// Clean up empty optional fields to undefined so MongoDB sparse indexes work properly
UserSchema.pre("save", function (this: any) {
    if (this.email === null || (typeof this.email === "string" && !this.email.trim())) {
        this.email = undefined;
    }
    if (this.phone === null || (typeof this.phone === "string" && !this.phone.trim())) {
        this.phone = undefined;
    }
    if (this.referralCode === null || (typeof this.referralCode === "string" && !this.referralCode.trim())) {
        this.referralCode = undefined;
    }
});

const UserModel = mongoose.models.User || mongoose.model("User", UserSchema);

export default UserModel;

