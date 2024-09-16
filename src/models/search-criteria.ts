export type SearchCriteriaType =
  | "GetInBatches"
  | "SearchByStoreIds"
  | "SearchByQuery";

export interface SearchCriteria {
  CriteriaType: SearchCriteriaType;
  StoreIds?: string[];
  BusinessName?: string;
  City?: string;
  BPCategoryId?: number;
  Zip?: string;
}
