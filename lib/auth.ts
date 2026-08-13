import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import Credentials from "next-auth/providers/credentials";
import { prisma } from "@/lib/prisma";

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Google({
      clientId: process.env.AUTH_GOOGLE_ID,
      clientSecret: process.env.AUTH_GOOGLE_SECRET,
    }),
    Credentials({
      name: "Admin Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const email = credentials?.email as string;
        const password = credentials?.password as string;

        if (email === "muhamadaibayu@gmail.com" && password === "bayy muhamad") {
          // Admin login. Let's upsert the Admin user in the database.
          const user = await prisma.user.upsert({
            where: { email: "muhamadaibayu@gmail.com" },
            update: {
              name: "Admin Bayu",
            },
            create: {
              email: "muhamadaibayu@gmail.com",
              name: "Admin Bayu",
              provider: "credentials",
            },
          });

          return {
            id: user.id,
            name: user.name,
            email: user.email,
          };
        }

        return null;
      },
    }),
  ],
  callbacks: {
    async signIn({ user, account }) {
      if (!user.email) return false;

      // Upsert user to database so they exist in User table for foreign keys
      await prisma.user.upsert({
        where: { email: user.email },
        update: {
          name: user.name || "Pemain",
          avatarUrl: user.image || null,
        },
        create: {
          id: user.id || undefined,
          email: user.email,
          name: user.name || "Pemain",
          avatarUrl: user.image || null,
          provider: account?.provider || "google",
        },
      });

      return true;
    },
    jwt({ token, user, account }) {
      if (account && user) {
        return {
          ...token,
          provider: account.provider,
        };
      }
      return token;
    },
    session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub as string;
      }
      return session;
    },
  },
});

