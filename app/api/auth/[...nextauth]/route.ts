/**
 * NextAuth API Route Handler
 * Verarbeitet alle Authentication-Requests
 * NextAuth v5 beta API
 */
import { authOptions } from "@/lib/auth";
import NextAuth from "next-auth";

export const { GET, POST } = NextAuth(authOptions);
