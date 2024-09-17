import { DeleteBusinessStatus } from "../common/delete-business-status";

export interface DeleteBusinessesResponse {
  DeletedBusinesses: DeleteBusinessStatus[];
  Errors: Record<string, any>;
  TrackingId: string;
  OperationStatus: boolean;
  ErrorMessage: string | null;
  ErrorCode: number;
}
