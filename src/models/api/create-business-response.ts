import { CreatedBusinessStatus } from "../common/created-business-status";
import { ValidationError } from "../common/validation-error";

export interface CreateBusinessesResponse {
  Errors?: { [key: string]: ValidationError }; // this field holds only the validation errors
  CreatedBusinesses?: { [key: string]: CreatedBusinessStatus };
  TrackingId?: string;
  ErrorMessage?: string; // contains an error message if the API request couldn't be processed for some reason
  ErrorCode?: string | number;
  OperationStatus?: boolean;
}
