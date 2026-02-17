import { NextAuthOptions } from 'next-auth'
import GithubProvider from 'next-auth/providers/github'
import { PrismaAdapter } from '@auth/prisma-adapter'
import { prisma } from '@/lib/db/prisma'

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma) as any,
  providers: [
    GithubProvider({
      clientId: process.env.GITHUB_CLIENT_ID!,
      clientSecret: process.env.GITHUB_CLIENT_SECRET!,
    }),
  ],
  session: {
    strategy: 'jwt',
  },
  callbacks: {
    async signIn({ user, profile }) {
      // Update username from GitHub profile on each sign in
      if (user.id && profile) {
        const githubProfile = profile as { login?: string }
        if (githubProfile.login) {
          await prisma.user.update({
            where: { id: user.id },
            data: { username: githubProfile.login },
          }).catch(() => {
            // Ignore errors (e.g., user not yet created by adapter)
          })
        }
      }
      return true
    },
    async session({ session, token }) {
      if (session.user && token.sub) {
        session.user.id = token.sub
        // Add username to session
        const dbUser = await prisma.user.findUnique({
          where: { id: token.sub },
          select: { username: true },
        })
        if (dbUser?.username) {
          (session.user as any).username = dbUser.username
        }
      }
      return session
    },
    async jwt({ token, user, profile }) {
      if (user) {
        token.id = user.id
      }
      // Store username in token from GitHub profile
      if (profile) {
        const githubProfile = profile as { login?: string }
        if (githubProfile.login) {
          token.username = githubProfile.login
        }
      }
      return token
    },
  },
  pages: {
    signIn: '/login',
  },
}
