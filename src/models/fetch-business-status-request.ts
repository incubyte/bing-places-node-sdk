import { Identity } from "./identity";
import { SearchCriteriaType } from "./search-criteria";

export interface FetchBusinessStatusInfoRequest {
  TrackingId: string;
  Identity: Identity;
  PageNumber: number;
  PageSize: number;
  CriteriaType: SearchCriteriaType;
  StoreIds?: string[];
}
