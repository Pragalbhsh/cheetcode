declare global {
  namespace Express {
    interface Request {
      /** Set by requireAuth from the verified JWT. */
      userId?: string
      /** IANA time zone from the X-Timezone header (defaults to UTC). */
      timeZone: string
    }
  }
}

export {}
