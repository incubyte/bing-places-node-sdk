import { Identity } from "./identity";
import { SearchCriteria } from "./search-criteria";

export interface FetchBusinessesRequest {
  TrackingId: string;
  Identity: Identity;
  PageNumber: number;
  PageSize: number;
  SearchCriteria: SearchCriteria;
}
