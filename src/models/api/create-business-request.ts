import { BusinessListing } from "../common/business-listing";
import { Identity } from "../common/identity";

export interface CreateBusinessesRequest {
  Businesses: BusinessListing[];
  TrackingId: string;
  Identity: Identity;
}
