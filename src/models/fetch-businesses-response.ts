import { BusinessListing } from "./business-listing";

export interface FetchBusinessesResponse {
  Businesses: BusinessListing[];
  Errors: Record<string, any>;
  TrackingId: string;
  OperationStatus: boolean;
  ErrorMessage: string | null;
  ErrorCode: number;
}
