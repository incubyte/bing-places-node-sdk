import { Identity } from "../common/identity";
import { SearchCriteriaType } from "../common/search-criteria";

export interface FetchBusinessStatusInfoRequest {
  TrackingId: string;
  Identity: Identity;
  PageNumber: number;
  PageSize: number;
  CriteriaType: SearchCriteriaType;
  StoreIds?: string[];
}
