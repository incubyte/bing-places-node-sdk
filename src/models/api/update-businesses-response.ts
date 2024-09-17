export interface UpdateBusinessesResponse {
  UpdatedBusinesses: Record<string, any>;
  Errors: Record<string, any>;
  TrackingId: string;
  OperationStatus: boolean;
  ErrorMessage: string | null;
  ErrorCode: number;
}
