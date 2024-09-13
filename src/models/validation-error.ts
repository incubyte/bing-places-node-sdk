export interface ValidationError {
  AttributeName?: string;
  ErrorMessage?: string;
  StoreId?: string;
  BusinessErrors?: {
    ColumnName: string;
    ErrorMessage: string;
  }[];
}
