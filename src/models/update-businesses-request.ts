import { BusinessListing } from "./business-listing";
import { Identity } from "./identity";

export interface UpdateBusinessesRequest {
  Businesses: BusinessListing[];
  TrackingId: string;
  Identity: Identity;
}
