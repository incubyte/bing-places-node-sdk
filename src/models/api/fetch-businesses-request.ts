import { Identity } from "../common/identity";
import { SearchCriteria } from "../common/search-criteria";

export interface FetchBusinessesRequest {
  TrackingId: string;
  Identity: Identity;
  PageNumber: number;
  PageSize: number;
  SearchCriteria: SearchCriteria;
}
