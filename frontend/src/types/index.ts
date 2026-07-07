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
  round1Deadline: string;
  finalDeadline: string;
  finalistsPercentage: number;
  scoringCriteria: ScoringCriterion[];
  judges: ContestJudge[];
  status: ContestStatus;
  cancelReason?: string;
  createdAt: string;
}

export type Round1Result = "pending" | "advanced" | "eliminated" | "no_submission";
export type FinalResult =
  | "not_applicable"
  | "pending"
  | "winner"
  | "second"
  | "third"
  | "eliminated"
  | "no_submission";

export interface ContestParticipation {
  _id: string;
  contest: Contest;
  round1Result: Round1Result;
  finalResult: FinalResult;
  registeredAt: string;
}

export interface Submission {
  _id: string;
  contest: string;
  round: RoundType;
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
