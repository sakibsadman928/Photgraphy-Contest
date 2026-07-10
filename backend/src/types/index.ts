export type UserRole = "admin" | "judge" | "participant";

// Single-round lifecycle: no more Round1 -> Final split.
// draft -> registration_open -> registration_closed -> submissions_open
//       -> submissions_closed (judging) -> completed
// "cancelled" can happen at "close registration" if too few participants joined.
export type ContestStatus =
  | "draft"
  | "registration_open"
  | "registration_closed"
  | "cancelled"
  | "submissions_open"
  | "submissions_closed"
  | "completed";

// Replaces the old Round1Result/FinalResult pair now that there's only one round.
// Only the top 3 ranked submissions are awarded; everyone else who submitted is
// "eliminated", and anyone registered who never submitted is "no_submission".
export type ParticipantResult =
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
