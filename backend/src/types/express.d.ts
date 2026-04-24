import type { AuthedRequestUser } from "./index";

declare global {
  namespace Express {
    interface Request {
      user?: AuthedRequestUser;
    }
  }
}

export {};
