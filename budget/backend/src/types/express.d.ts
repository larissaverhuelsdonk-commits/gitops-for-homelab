declare global {
  namespace Express {
    interface Request {
      /** Set by `requireAuth` after a valid session cookie. */
      userId?: string;
    }
  }
}

export {};
