import { Identity } from "../common/identity";

export interface DeleteBusinessesRequest {
  TrackingId: string;
  Identity: Identity;
  StoreIds: string[];
}
