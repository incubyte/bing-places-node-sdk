import { QualityIssue } from "./quality-issue";

export interface BusinessStatusInfo {
  StoreId: string;
  BusinessStatus:
    | "QualityCheckInProgress"
    | "QualityIssueFound"
    | "PublishInProgress"
    | "Published"
    | "Dropped";
  YPId: string | null;
  YPIdAssignDate: string | null;
  PublishDate: string | null;
  LastUpdateDate: string | null;
  HasPendingPublish: boolean;
  PublishLink: string | null;
  QualityIssues: QualityIssue[] | null;
}
