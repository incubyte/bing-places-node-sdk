import { Identity, SearchCriteriaType } from "../common";

export interface GetAnalyticsRequest {
  TrackingId: string;
  Identity: Identity;
  PageNumber: number;
  PageSize: number;
  CriteriaType: SearchCriteriaType;
  StoreIds?: string[];
}
