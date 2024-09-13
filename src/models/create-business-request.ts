import { BusinessListing } from "./business-listing";
import { Identity } from "./identity";

export interface CreateBusinessesRequest {
  Businesses: BusinessListing[];
  TrackingId: string;
  Identity: Identity;
}
