import { BusinessListing } from "../common/business-listing";
import { Identity } from "../common/identity";

export interface UpdateBusinessesRequest {
  Businesses: BusinessListing[];
  TrackingId: string;
  Identity: Identity;
}
