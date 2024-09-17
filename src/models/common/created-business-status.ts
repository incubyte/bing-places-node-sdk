export interface CreatedBusinessStatus {
  StoreId: string;
  Status: string;
  Operation?: string;
  ErrorMessage?: string; // non-empty if the request fails
  WarningMessages?: any[];
}
