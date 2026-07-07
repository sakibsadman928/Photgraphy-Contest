export type UserRole = "admin" | "judge" | "participant";

export type ContestStatus =
  | "draft"
  | "registration_open"
  | "registration_closed"
  | "cancelled"
  | "round1_open"
  | "round1_closed"
  | "round1_results_published"
  | "final_open"
  | "final_closed"
  | "completed";

export type RoundType = "round1" | "final";

export type Round1Result = "pending" | "advanced" | "eliminated" | "no_submission";

export type FinalResult =
  | "not_applicable" // did not reach the final
  | "pending"
  | "winner"
  | "second"
  | "third"
  | "eliminated"
  | "no_submission";

export type TieStatus = "none" | "pending" | "resolved";

export interface AuthTokenPayload {
  userId: string;
  role: UserRole;
}

// Extends Express's Request with the authenticated user, set by the `protect` middleware.
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        role: UserRole;
      };
    }
  }
}
