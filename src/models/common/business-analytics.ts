import { BusinessStatistics } from "./business-statistics";

export interface BusinessAnalytics {
  StoreId: string;
  BusinessStatisticsList: BusinessStatistics[];
}
