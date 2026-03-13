import NextAuth, { AuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import connectToDatabase from "@/lib/mongoose";
import User from "@/models/User";
import bcrypt from "bcryptjs";

const nextAuthSecret = process.env.NEXTAUTH_SECRET;
if (process.env.NODE_ENV === "production" && !nextAuthSecret) {
    throw new Error("NEXTAUTH_SECRET is required in production");
}

export const authOptions: AuthOptions = {
    providers: [
        CredentialsProvider({
            name: "Credentials",
            credentials: {
                email: { label: "Email", type: "email", placeholder: "m@example.com" },
                password: { label: "Password", type: "password" },
            },
            async authorize(credentials) {
                if (!credentials?.email || !credentials?.password) {
                    throw new Error("Invalid credentials");
                }

                await connectToDatabase();
                const user = await User.findOne({ email: credentials.email });

                if (!user) {
                    throw new Error("No user found with this email");
                }

                // Verify Password
                const isPasswordValid = await bcrypt.compare(
                    credentials.password,
                    user.password
                );

                if (!isPasswordValid) {
                    throw new Error("Incorrect Password");
                }

                return {
                    id: user._id.toString(),
                    name: user.name,
                    email: user.email,
                    role: user.role,
                };
            },
        }),
    ],
    session: {
        strategy: "jwt",
    },
    callbacks: {
        async jwt({ token, user }) {
            // Include role and ID on token payload when the user signs in
            if (user) {
                token.id = user.id;
                token.role = user.role;
            }
            return token;
        },
        async session({ session, token }) {
            // Forward token payload to the client session 
            if (token && session.user) {
                session.user.id = token.id as string;
                session.user.role = token.role as string;
            }
            return session;
        },
    },
    pages: {
        signIn: "/login",
    },
    secret: nextAuthSecret,
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
