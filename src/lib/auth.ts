import NextAuth from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import GitHub from "next-auth/providers/github";
import bcrypt from "bcryptjs";
import prisma from "./prisma";

function parseAdminEmails(): string[] {
  return (process.env.ADMIN_EMAILS || "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}

export function isEmailInAdminAllowlist(email?: string | null): boolean {
  if (!email) return false;
  return parseAdminEmails().includes(email.trim().toLowerCase());
}

export const { handlers, signIn, signOut, auth } = NextAuth({
  adapter: PrismaAdapter(prisma),
  trustHost: true,
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
  },
  providers: [
    Google({
      clientId: process.env.AUTH_GOOGLE_ID,
      clientSecret: process.env.AUTH_GOOGLE_SECRET,
      allowDangerousEmailAccountLinking: true,
    }),
    GitHub({
      clientId: process.env.AUTH_GITHUB_ID,
      clientSecret: process.env.AUTH_GITHUB_SECRET,
      allowDangerousEmailAccountLinking: true,
    }),
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        const email = String(credentials.email).trim().toLowerCase();
        const user = await prisma.user.findUnique({
          where: { email },
        });

        if (!user || !user.password) return null;

        const isValid = await bcrypt.compare(
          credentials.password as string,
          user.password
        );

        if (!isValid) return null;

        // Bootstrap allowlisted admins into the DB role system
        if (isEmailInAdminAllowlist(user.email) && user.role !== "ADMIN") {
          await prisma.user.update({
            where: { id: user.id },
            data: { role: "ADMIN" },
          });
          user.role = "ADMIN";
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.image,
          role: user.role,
          mustChangePassword: user.mustChangePassword,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      if (trigger === "update" && session) {
        if (typeof session.mustChangePassword === "boolean") {
          token.mustChangePassword = session.mustChangePassword;
        }
        if (typeof session.role === "string") {
          token.role = session.role;
        }
      }

      if (user) {
        token.id = user.id;
        token.role = (user as { role?: string }).role ?? "USER";
        token.mustChangePassword = Boolean(
          (user as { mustChangePassword?: boolean }).mustChangePassword
        );
      } else if (token.id) {
        const lastChecked =
          typeof (token as { roleCheckedAt?: number }).roleCheckedAt === "number"
            ? (token as { roleCheckedAt: number }).roleCheckedAt
            : 0;
        const shouldRefresh = Date.now() - lastChecked > 30_000;

        if (shouldRefresh) {
          const dbUser = await prisma.user.findUnique({
            where: { id: token.id as string },
            select: { role: true, mustChangePassword: true, email: true },
          });
          (token as { roleCheckedAt?: number }).roleCheckedAt = Date.now();
          if (dbUser) {
            if (
              isEmailInAdminAllowlist(dbUser.email) &&
              dbUser.role !== "ADMIN"
            ) {
              await prisma.user.update({
                where: { id: token.id as string },
                data: { role: "ADMIN" },
              });
              token.role = "ADMIN";
            } else {
              token.role = dbUser.role;
            }
            token.mustChangePassword = dbUser.mustChangePassword;
          }
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
        session.user.mustChangePassword = Boolean(token.mustChangePassword);
      }
      return session;
    },
  },
});

/** Primary check: database ADMIN/MODERATOR role. Allowlist bootstraps first admins. */
export async function isAdmin(userIdOrEmail?: string | null): Promise<boolean> {
  if (!userIdOrEmail) return false;

  if (userIdOrEmail.includes("@")) {
    if (isEmailInAdminAllowlist(userIdOrEmail)) return true;
    const user = await prisma.user.findUnique({
      where: { email: userIdOrEmail.trim().toLowerCase() },
      select: { role: true },
    });
    return user?.role === "ADMIN";
  }

  const user = await prisma.user.findUnique({
    where: { id: userIdOrEmail },
    select: { role: true, email: true },
  });
  if (!user) return false;
  if (user.role === "ADMIN") return true;
  return isEmailInAdminAllowlist(user.email);
}

export async function isModerator(userId: string): Promise<boolean> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true, email: true },
  });
  if (!user) return false;
  if (user.role === "MODERATOR" || user.role === "ADMIN") return true;
  return isEmailInAdminAllowlist(user.email);
}

/** Require authenticated moderator/admin for API routes */
export async function requireModerator() {
  const session = await auth();
  if (!session?.user?.id || !(await isModerator(session.user.id))) {
    return { session: null, error: Response.json({ error: "Forbidden" }, { status: 403 }) };
  }
  return { session, error: null };
}
