import { Identity } from "../common";

export interface GetAnalyticsRequest {
  TrackingId: string;
  Identity: Identity;
  PageNumber: number;
  PageSize: number;
  CriteriaType: "GetInBatches" | "SearchByStoreIds";
  StoreIds?: string[];
}
