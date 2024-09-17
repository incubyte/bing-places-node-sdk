import { BusinessStatusInfo } from "./business-status-info";

export interface FetchBusinessStatusInfoResponse {
  BusinessesStatusInfo: BusinessStatusInfo[];
  Errors: Record<string, any>;
  TrackingId: string;
  OperationStatus: boolean;
  ErrorMessage: string | null;
  ErrorCode: number;
}
