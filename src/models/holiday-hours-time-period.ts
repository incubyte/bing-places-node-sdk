export interface HolidayHoursTimePeriod {
  Date: string; // yyyy-MM-dd
  OpenTime?: string; // HH:mm (24-hour format)
  CloseTime?: string; // HH:mm (24-hour format)
  IsClosed?: boolean; // default value is false
}
