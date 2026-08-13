import NextAuth, { DefaultSession } from "next-auth";
import Google from "next-auth/providers/google";
import { prisma } from "@/lib/prisma";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: string;
    } & DefaultSession["user"];
  }
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Google({
      clientId: process.env.AUTH_GOOGLE_ID,
      clientSecret: process.env.AUTH_GOOGLE_SECRET,
    }),
  ],
  callbacks: {
    async signIn({ user, account }) {
      if (!user.email) return false;

      const isAdmin = user.email === process.env.ADMIN_EMAIL;
      const targetRole = isAdmin ? "ADMIN" : "USER";

      // Upsert user to database so they exist in User table for foreign keys
      await prisma.user.upsert({
        where: { email: user.email },
        update: {
          name: user.name || "Pemain",
          avatarUrl: user.image || null,
          role: targetRole,
        },
        create: {
          id: user.id || undefined,
          email: user.email,
          name: user.name || "Pemain",
          avatarUrl: user.image || null,
          provider: account?.provider || "google",
          role: targetRole,
        },
      });

      return true;
    },
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
      }
      if (token.email) {
        const dbUser = await prisma.user.findUnique({
          where: { email: token.email },
          select: { role: true },
        });
        if (dbUser) {
          token.role = dbUser.role;
        }
      }
      return token;
    },
    session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub as string;
        session.user.role = (token.role as string) || "USER";
      }
      return session;
    },
  },
});

