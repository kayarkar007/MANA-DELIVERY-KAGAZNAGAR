import type { AuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import bcrypt from "bcryptjs";
import connectToDatabase from "@/lib/mongoose";
import User from "@/models/User";

const nextAuthSecret = process.env.NEXTAUTH_SECRET;
if (process.env.NODE_ENV === "production" && !nextAuthSecret) {
    console.error("⚠️ CRITICAL: NEXTAUTH_SECRET is not set in production! Auth will not work correctly.");
}

const isVercel = process.env.VERCEL === "1";
if (!process.env.NEXTAUTH_URL && !isVercel && process.env.NODE_ENV === "production") {
    console.warn("NEXTAUTH_URL is not set. This may cause issues with authentication redirects.");
}

const providers: AuthOptions["providers"] = [
    // ── 1. Email + Password login ─────────────────────────────────────────────
    CredentialsProvider({
        id: "credentials",
        name: "Email & Password",
        credentials: {
            email: { label: "Email", type: "email" },
            password: { label: "Password", type: "password" },
        },
        async authorize(credentials) {
            if (!credentials?.email || !credentials?.password) {
                throw new Error("Please enter your email and password.");
            }

            await connectToDatabase();
            const user = await User.findOne({ email: credentials.email });

            if (!user) {
                throw new Error("No account found with this email.");
            }

            if (user.privacyErasedAt) {
                throw new Error("This account is no longer available.");
            }

            if (!user.password) {
                throw new Error("This account uses Google login. Please sign in with Google.");
            }

            const isPasswordValid = await bcrypt.compare(credentials.password, user.password);
            if (!isPasswordValid) {
                throw new Error("Incorrect password. Please try again.");
            }

            if (!user.isVerified) {
                throw new Error("Please verify your email before logging in.");
            }

            return {
                id: user._id.toString(),
                name: user.name,
                email: user.email,
                role: user.role,
                phone: user.phone ?? null,
                isPhoneVerified: true, // ⚡ Phone verification temporarily bypassed
            };
        },
    }),

    // ── 2. Phone OTP login ─────────────────────────────────────────────────────
    // Flow: client calls /api/auth/phone-otp/verify → gets user object →
    //       then calls signIn("phone-otp", { phone, userId }) to create session.
    CredentialsProvider({
        id: "phone-otp",
        name: "Phone OTP",
        credentials: {
            phone: { label: "Phone", type: "text" },
            userId: { label: "User ID", type: "text" },
        },
        async authorize(credentials) {
            if (!credentials?.userId || !credentials?.phone) {
                throw new Error("Invalid phone login request.");
            }

            await connectToDatabase();
            const user = await User.findById(credentials.userId);

            if (!user) {
                throw new Error("User not found.");
            }

            if (user.privacyErasedAt) {
                throw new Error("This account is no longer available.");
            }

            // ⚡ Phone verification temporarily bypassed — skip the isPhoneVerified check
            // const normalizedPhone = credentials.phone.replace(/\D/g, "").replace(/^(91|0)/, "").slice(-10);
            // if (user.phone !== normalizedPhone || !user.isPhoneVerified) {
            //     throw new Error("Phone verification required.");
            // }

            return {
                id: user._id.toString(),
                name: user.name,
                email: user.email ?? null,
                role: user.role,
                phone: user.phone,
                isPhoneVerified: true,
            };
        },
    }),
];

// ── 3. Google OAuth ────────────────────────────────────────────────────────────
if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
    providers.push(
        GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        })
    );
}

export const authOptions: AuthOptions = {
    providers,
    session: {
        strategy: "jwt",
    },
    callbacks: {
        async signIn({ user, account }) {
            if (account?.provider === "google") {
                try {
                    await connectToDatabase();
                    let existingUser = await User.findOne({ email: user.email });
                    if (!existingUser) {
                        existingUser = await User.create({
                            name: user.name || "Google User",
                            email: user.email,
                            isVerified: true,
                            isPhoneVerified: true, // ⚡ Phone verification temporarily bypassed
                            role: "user",
                        });
                    }
                    user.id = existingUser._id.toString();
                    (user as any).role = existingUser.role;
                    (user as any).phone = existingUser.phone ?? null;
                    (user as any).isPhoneVerified = true; // ⚡ Phone verification temporarily bypassed
                    return true;
                } catch {
                    return false;
                }
            }
            return true;
        },
        async jwt({ token, user }) {
            if (user) {
                token.id = user.id;
                token.role = (user as any).role || "user";
                token.phone = (user as any).phone ?? null;
                token.isPhoneVerified = (user as any).isPhoneVerified ?? false;
            }
            return token;
        },
        async session({ session, token }) {
            if (token && session.user) {
                session.user.id = token.id as string;
                session.user.role = token.role as string;
                (session.user as any).phone = token.phone ?? null;
                (session.user as any).isPhoneVerified = token.isPhoneVerified ?? false;
            }
            return session;
        },
        async redirect({ url, baseUrl }) {
            // If relative URL, append to baseUrl
            if (url.startsWith("/")) return `${baseUrl}${url}`;

            // Safety guard: never redirect to placeholder domain
            if (url.includes("your-app-name")) return `${baseUrl}/login`;

            try {
                // If same origin, allow redirect
                if (new URL(url).origin === new URL(baseUrl).origin) return url;
            } catch { }

            return baseUrl;
        },
    },
    pages: {
        signIn: "/login",
    },
    secret: nextAuthSecret,
};
