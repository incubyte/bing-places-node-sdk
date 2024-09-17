import { Categories } from "./categories";
import { HolidayHoursTimePeriod } from "./holiday-hours-time-period";

export interface BusinessListing {
  StoreId: string; // required
  BusinessName: string; // required
  ChainName?: string;
  AddressLine1: string; // required
  AddressLine2?: string;
  City: string; // required
  StateOrProvince: string; // required
  Country: string; // required
  ZipCode: string; // required
  PhoneNumber?: string;
  Categories: Categories; // required
  Latitude?: string;
  Longitude?: string;
  BusinessEmail?: string;
  MainWebSite?: string;
  FacebookAddress?: string;
  TwitterAddress?: string;
  Photos?: string[];
  MenuURL?: string;
  OrderURL?: string;
  RestaurantPrice?: "$" | "$$" | "$$$" | "$$$$" | "$$$$$";
  HotelStarRating?: "1 star" | "2 star" | "3 star" | "4 star" | "5 star";
  Npi?: string;
  Offers?: any;
  Amenities?: { Id: string; Name: string }[];
  Open24Hours?: boolean; // default value is false
  OperatingHours?: string[]; // array of strings like "Mon 08:00 AM-08:00 PM"
  HolidayHours?: HolidayHoursTimePeriod[];
  HideAddress?: boolean | null; // nullable boolean, default value is null
  ServiceAreas?: string[];
  IsClosed?: boolean; // default value is false
}
