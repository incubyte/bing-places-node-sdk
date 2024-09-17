import { BusinessAnalytics } from "../common";

export interface GetAnalyticsResponse {
  BusinessesAnalytics: BusinessAnalytics[];
  Errors: Record<string, any>;
  TrackingId: string;
  OperationStatus: boolean;
  ErrorMessage: string | null;
  ErrorCode: number;
}
