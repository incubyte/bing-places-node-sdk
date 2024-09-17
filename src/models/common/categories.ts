import { BusinessCategory } from "./business-category";

export interface Categories {
  BusinessCategories: BusinessCategory[];
  PrimaryCategory?: BusinessCategory;
}
