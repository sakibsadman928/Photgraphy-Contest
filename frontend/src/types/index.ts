export type UserRole = "admin" | "judge" | "participant";

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  bio?: string;
  country?: string;
  profilePhotoUrl?: string;
  mustChangePassword?: boolean;
}

// Single-round lifecycle: no more Round1 -> Final split.
export type ContestStatus =
  | "draft"
  | "registration_open"
  | "registration_closed"
  | "cancelled"
  | "submissions_open"
  | "submissions_closed"
  | "completed";

export interface ScoringCriterion {
  name: string;
  maxPoints: number;
}

export interface ContestJudge {
  judge: string | { _id: string; name: string; email: string };
  active: boolean;
  replacedBy?: string;
  replacedAt?: string;
}

export interface Contest {
  _id: string;
  title: string;
  theme: string;
  registrationDeadline: string;
  submissionDeadline: string;
  scoringCriteria: ScoringCriterion[];
  judges: ContestJudge[];
  status: ContestStatus;
  cancelReason?: string;
  createdAt: string;
}

// Replaces the old Round1Result/FinalResult pair now that there's only one
// round. Only the top 3 ranked submissions are awarded.
export type ParticipantResult =
  | "pending"
  | "winner"
  | "second"
  | "third"
  | "eliminated"
  | "no_submission";

export interface ContestParticipation {
  _id: string;
  contest: Contest;
  result: ParticipantResult;
  registeredAt: string;
}

export interface Submission {
  _id: string;
  contest: string;
  participant: string | { _id: string; name: string; country?: string; profilePhotoUrl?: string };
  title: string;
  description?: string;
  photoUrl: string;
  averageScore: number | null;
  tieStatus: "none" | "pending" | "resolved";
  createdAt: string;
}

export interface JudgingProgressEntry {
  judgeId: string;
  scoredCount: number;
  totalSubmissions: number;
}

export interface JudgingProgress {
  complete: boolean;
  totalSubmissions: number;
  progress: JudgingProgressEntry[];
}

export interface AppNotification {
  _id: string;
  type: string;
  message: string;
  read: boolean;
  contest?: string;
  createdAt: string;
}
