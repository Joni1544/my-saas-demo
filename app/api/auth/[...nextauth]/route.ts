import NextAuth from "next-auth"

import { authOptions } from "@/lib/auth"

const auth = NextAuth(authOptions)

export const GET = auth.handlers.GET

export const POST = auth.handlers.POST
