import { BingPlacesClient } from "../core/bing-places-client";
import { Constants } from "../core/constants";
import axios from "axios";
import { v4 as uuidv4 } from "uuid";
import { Identity, BusinessListing, SearchCriteria } from "../models/common"; // Adjust the import based on your actual file structure
import {
  CreateBusinessesResponse,
  UpdateBusinessesResponse,
  FetchBusinessStatusInfoResponse,
  FetchBusinessesResponse,
  GetAnalyticsResponse,
  DeleteBusinessesResponse,
  CreateBulkChainResponse,
  UpdateBulkChainInfoResponse,
} from "../models/api";

jest.mock("axios");
jest.mock("uuid", () => ({
  v4: jest.fn(() => "mocked-uuid"),
}));

describe("BingPlacesClient", () => {
  describe("initialization tests", () => {
    let consoleWarnSpy: jest.SpyInstance;

    beforeEach(() => {
      consoleWarnSpy = jest.spyOn(console, "warn").mockImplementation(() => {});
    });

    afterEach(() => {
      consoleWarnSpy.mockRestore();
    });

    test("should throw error if identity is not provided", () => {
      expect(() => {
        new BingPlacesClient({
          identity: { Puid: "", AuthProvider: "", EmailId: "" },
        });
      }).toThrow();
    });

    test("should warn if useSandbox is not a boolean", () => {
      const useSandbox: any = "not a boolean"; // Example of an invalid value

      // Assuming BingPlacesClient is a class and the code is inside a method
      const client = new BingPlacesClient({
        identity: {
          Puid: "test",
          AuthProvider: "test",
          EmailId: "test@gmail.com",
        },
        useSandbox,
      });

      expect(consoleWarnSpy).toHaveBeenCalledWith(
        "BingPlacesClient: useSandbox not set. Defaulting to false."
      );
    });

    test("should not warn if useSandbox is a boolean", () => {
      const useSandbox: boolean = true; // Example of a valid value

      const client = new BingPlacesClient({
        identity: {
          Puid: "test",
          AuthProvider: "test",
          EmailId: "test@gmail.com",
        },
        useSandbox,
      });

      expect(consoleWarnSpy).not.toHaveBeenCalled();
    });

    test("should throw error if email is invalid", () => {
      expect(() => {
        new BingPlacesClient({
          identity: {
            Puid: "test",
            AuthProvider: "test",
            EmailId: "invalid-email",
          },
        });
      }).toThrow();
    });
  });

  describe("sanity checks for getters-setters", () => {
    let client: BingPlacesClient;
    let identity: Identity;

    beforeEach(() => {
      identity = {
        Puid: "test",
        AuthProvider: "test",
        EmailId: "test@gmail.com",
      }; // Example identity object
      client = new BingPlacesClient({ useSandbox: true, identity }); // Assuming constructor takes identity and useSandbox

      client["axiosInstance"] = axios as jest.Mocked<typeof axios>;
      (client["axiosInstance"] as any).defaults = {
        baseURL: "",
        headers: {},
      };
    });

    test("getCurrentIdentity should return a copy of the identity", () => {
      const currentIdentity = client.getCurrentIdentity();
      expect(currentIdentity).toEqual(identity);
      expect(currentIdentity).not.toBe(identity); // Ensure it's a copy, not the same reference
    });

    test("updateIdentity should update the identity and set the header", () => {
      const newIdentity = {
        Puid: "test-2",
        AuthProvider: "test-2",
        EmailId: "test-2@gmail.com",
      };
      client.updateIdentity(newIdentity);
      expect(client.getCurrentIdentity()).toEqual(newIdentity);
      const axiosInstance = client["axiosInstance"];
      expect(axiosInstance.defaults.headers["X-BingApis-SDK-Identity"]).toBe(
        JSON.stringify(newIdentity)
      );
    });

    test("isSandbox should return the correct sandbox status", () => {
      expect(client.isSandbox()).toBe(true);
      client.shiftToProduction();
      expect(client.isSandbox()).toBe(false);
    });

    test("isProduction should return the correct production status", () => {
      expect(client.isProduction()).toBe(false);
    });

    test("shiftToSandbox should set useSandbox to true and update baseURL", () => {
      client.shiftToSandbox();
      const axiosInstance = client["axiosInstance"];
      expect(client.isSandbox()).toBe(true);
      expect(axiosInstance.defaults.baseURL).toBe(Constants.Endpoints.Sandbox);
    });

    test("shiftToProduction should set useSandbox to false and update baseURL", () => {
      client.shiftToSandbox(); // First shift to sandbox
      client.shiftToProduction();
      const axiosInstance = client["axiosInstance"];
      expect(client.isSandbox()).toBe(false);
      expect(axiosInstance.defaults.baseURL).toBe(
        Constants.Endpoints.Production
      );
    });
  });

  describe("create businesses", () => {
    let client: BingPlacesClient;
    let identity: Identity;
    let axiosInstance: jest.Mocked<typeof axios>;

    beforeEach(() => {
      identity = {
        Puid: "test",
        AuthProvider: "test",
        EmailId: "test@gmail.com",
      }; // Example identity object
      client = new BingPlacesClient({ identity, useSandbox: true }); // Assuming constructor takes identity and useSandbox
      axiosInstance = axios as jest.Mocked<typeof axios>;
      client["axiosInstance"] = axiosInstance;
      (client["axiosInstance"] as any).defaults = {
        baseURL: "",
      };
    });

    afterEach(() => {
      jest.clearAllMocks();
    });

    const business: BusinessListing = {
      StoreId: "Store_1",
      BusinessName: "Business Name",
      AddressLine1: "Address Line",
      AddressLine2: "",
      City: "City",
      Country: "US",
      ZipCode: "98012",
      StateOrProvince: "WA",
      PhoneNumber: "(323) 123-4567",
      Categories: {
        BusinessCategories: [
          {
            CategoryName: "Restaurants",
            BPCategoryId: 700341,
          },
        ],
        PrimaryCategory: {
          CategoryName: "Restaurants",
          BPCategoryId: 700341,
        },
      },
    };

    test("createBusinesses should create businesses successfully", async () => {
      const response: CreateBusinessesResponse = {
        CreatedBusinesses: {
          "0": {
            StoreId: "Store_1",
            Operation: "BUSINESS_ADD",
            Status: "SUCCESSFUL",
            ErrorMessage: "",
          },
        },
        Errors: {},
        TrackingId: "mocked-uuid",
        OperationStatus: true,
        ErrorMessage: "",
        ErrorCode: 0,
      };

      axiosInstance.post.mockResolvedValueOnce({ data: response });

      const result = await client.createBusinesses([business]);

      expect(result).toEqual(response);
      expect(axiosInstance.post).toHaveBeenCalledWith("/CreateBusinesses", {
        Businesses: [business],
        TrackingId: "mocked-uuid",
        Identity: identity,
      });
    });

    test("createBusinesses should handle validation errors", async () => {
      const response: CreateBusinessesResponse = {
        CreatedBusinesses: {},
        Errors: {
          "0": {
            StoreId: "Store_3",
            BusinessErrors: [
              {
                ColumnName: "Country Code",
                ErrorMessage: "GH is not a supported country/region",
              },
            ],
          },
        },
        TrackingId: "mocked-uuid",
        OperationStatus: true,
        ErrorMessage: "",
        ErrorCode: 0,
      };

      axiosInstance.post.mockResolvedValueOnce({ data: response });

      const result = await client.createBusinesses([business]);

      expect(result).toEqual(response);
      expect(axiosInstance.post).toHaveBeenCalledWith("/CreateBusinesses", {
        Businesses: [business],
        TrackingId: "mocked-uuid",
        Identity: identity,
      });
    });

    test("createBusinesses should handle business creation failure due to existing store ID", async () => {
      const response: CreateBusinessesResponse = {
        CreatedBusinesses: {
          "0": {
            StoreId: "Store_1",
            Operation: "BUSINESS_ADD",
            Status: "FAILED",
            ErrorMessage:
              "Create business failed since store ID Store_1 already exists in your account.",
          },
        },
        Errors: {},
        TrackingId: "mocked-uuid",
        OperationStatus: true,
        ErrorMessage: "",
        ErrorCode: 0,
      };

      axiosInstance.post.mockResolvedValueOnce({ data: response });

      const result = await client.createBusinesses([business]);

      expect(result).toEqual(response);
      expect(axiosInstance.post).toHaveBeenCalledWith("/CreateBusinesses", {
        Businesses: [business],
        TrackingId: "mocked-uuid",
        Identity: identity,
      });
    });

    test("createBusinesses should handle business creation with warnings", async () => {
      const response: CreateBusinessesResponse = {
        CreatedBusinesses: {
          "0": {
            StoreId: "Store_1",
            Operation: "BUSINESS_ADD",
            Status: "SUCCESSFUL_WITH_WARNING",
            ErrorMessage: "",
            WarningMessages: [
              {
                ColumnName: "Hide Address",
                WarningMessage:
                  "You have selected categories (Plumbers) from Professionals & Services segment. Set value of ‘HideAddress’ attribute to ‘true’ if you do not want customers to visit the address that you have provided. Otherwise set its value to ‘false’.",
              },
            ],
          },
        },
        Errors: {},
        TrackingId: "mocked-uuid",
        OperationStatus: true,
        ErrorMessage: "",
        ErrorCode: 0,
      };

      axiosInstance.post.mockResolvedValueOnce({ data: response });

      const result = await client.createBusinesses([business]);

      expect(result).toEqual(response);
      expect(axiosInstance.post).toHaveBeenCalledWith("/CreateBusinesses", {
        Businesses: [business],
        TrackingId: "mocked-uuid",
        Identity: identity,
      });
    });

    test("createBusinesses should handle wrong number of businesses passed in request", async () => {
      const response: CreateBusinessesResponse = {
        CreatedBusinesses: {},
        Errors: {},
        TrackingId: "mocked-uuid",
        OperationStatus: false,
        ErrorMessage:
          "Total number of businesses should be greater than or equal to 1 and less than or equal to 1000",
        ErrorCode: 4,
      };

      axiosInstance.post.mockResolvedValueOnce({ data: response });

      const result = await client.createBusinesses([]);

      expect(result).toEqual(response);
      expect(axiosInstance.post).toHaveBeenCalledWith("/CreateBusinesses", {
        Businesses: [],
        TrackingId: "mocked-uuid",
        Identity: identity,
      });
    });

    test("createSingleBusiness should call createBusinesses with a single business", async () => {
      const response: CreateBusinessesResponse = {
        CreatedBusinesses: {
          "0": {
            StoreId: "Store_1",
            Operation: "BUSINESS_ADD",
            Status: "SUCCESSFUL",
            ErrorMessage: "",
          },
        },
        Errors: {},
        TrackingId: "mocked-uuid",
        OperationStatus: true,
        ErrorMessage: "",
        ErrorCode: 0,
      };

      axiosInstance.post.mockResolvedValueOnce({ data: response });

      const result = await client.createSingleBusiness(business);

      expect(result).toEqual(response);
      expect(axiosInstance.post).toHaveBeenCalledWith("/CreateBusinesses", {
        Businesses: [business],
        TrackingId: "mocked-uuid",
        Identity: identity,
      });
    });
  });

  describe("update businesses", () => {
    let client: BingPlacesClient;
    let identity: Identity;
    let axiosInstance: jest.Mocked<typeof axios>;

    const businesses: BusinessListing[] = [
      {
        StoreId: "Store_1",
        BusinessName: "New Business Name",
        AddressLine1: "Address Line",
        AddressLine2: "",
        City: "City",
        Country: "US",
        ZipCode: "98012",
        StateOrProvince: "WA",
        PhoneNumber: "(323) 123-4567",
        Categories: {
          BusinessCategories: [
            {
              CategoryName: "Restaurants",
              BPCategoryId: 700341,
            },
          ],
          PrimaryCategory: {
            CategoryName: "Restaurants",
            BPCategoryId: 700341,
          },
        },
      },
      {
        StoreId: "Store_2",
        BusinessName: "New Business Name - 2",
        AddressLine1: "Address Line",
        AddressLine2: "",
        City: "City",
        Country: "US",
        ZipCode: "12345",
        StateOrProvince: "WA",
        PhoneNumber: "(323) 123-4568",
        Categories: {
          BusinessCategories: [
            {
              CategoryName: "Restaurants",
              BPCategoryId: 700341,
            },
          ],
          PrimaryCategory: {
            CategoryName: "Restaurants",
            BPCategoryId: 700341,
          },
        },
      },
    ];

    beforeEach(() => {
      identity = {
        Puid: "test",
        AuthProvider: "test",
        EmailId: "test@gmail.com",
      }; // Example identity object
      client = new BingPlacesClient({ identity, useSandbox: true }); // Assuming constructor takes identity and useSandbox
      axiosInstance = axios as jest.Mocked<typeof axios>;
      client["axiosInstance"] = axiosInstance;
      (client["axiosInstance"] as any).defaults = {
        baseURL: "",
      };
    });

    afterEach(() => {
      jest.clearAllMocks();
    });

    test("should update businesses successfully", async () => {
      const response: UpdateBusinessesResponse = {
        UpdatedBusinesses: {
          "0": {
            StoreId: "Store_1",
            Operation: "BUSINESS_UPDATE",
            Status: "SUCCESSFUL",
            ErrorMessage: "",
          },
          "1": {
            StoreId: "Store_2",
            Operation: "BUSINESS_UPDATE",
            Status: "SUCCESSFUL",
            ErrorMessage: "",
            WarningMessages: null,
          },
        },
        Errors: {},
        TrackingId: "mocked-uuid",
        OperationStatus: true,
        ErrorMessage: null,
        ErrorCode: 0,
      };

      axiosInstance.post.mockResolvedValueOnce({ data: response });

      const result = await client.updateBusinesses(businesses);

      expect(result).toEqual(response);
      expect(axiosInstance.post).toHaveBeenCalledWith("/UpdateBusinesses", {
        Businesses: businesses,
        TrackingId: "mocked-uuid",
        Identity: identity,
      });
    });

    test("should handle update failure due to non-existent store ID", async () => {
      const response: UpdateBusinessesResponse = {
        UpdatedBusinesses: {
          "0": {
            StoreId: "Store_60",
            Operation: "BUSINESS_UPDATE",
            Status: "FAILED",
            ErrorMessage:
              "Update business failed since the store ID Store_60 does not exist in your account. Provide the correct store ID and retry to update the business or use CreateBusiness API to add the business.",
            WarningMessages: null,
          },
        },
        Errors: {},
        TrackingId: "mocked-uuid",
        OperationStatus: true,
        ErrorMessage: null,
        ErrorCode: 0,
      };

      axiosInstance.post.mockResolvedValueOnce({ data: response });

      const result = await client.updateBusinesses([
        {
          StoreId: "Store_60",
          BusinessName: "Non-existent Business",
          AddressLine1: "Address Line",
          AddressLine2: "",
          City: "City",
          Country: "US",
          ZipCode: "98012",
          StateOrProvince: "WA",
          PhoneNumber: "(323) 123-4567",
          Categories: {
            BusinessCategories: [
              {
                CategoryName: "Restaurants",
                BPCategoryId: 700341,
              },
            ],
            PrimaryCategory: {
              CategoryName: "Restaurants",
              BPCategoryId: 700341,
            },
          },
        },
      ]);

      expect(result).toEqual(response);
      expect(axiosInstance.post).toHaveBeenCalledWith("/UpdateBusinesses", {
        Businesses: [
          {
            StoreId: "Store_60",
            BusinessName: "Non-existent Business",
            AddressLine1: "Address Line",
            AddressLine2: "",
            City: "City",
            Country: "US",
            ZipCode: "98012",
            StateOrProvince: "WA",
            PhoneNumber: "(323) 123-4567",
            Categories: {
              BusinessCategories: [
                {
                  CategoryName: "Restaurants",
                  BPCategoryId: 700341,
                },
              ],
              PrimaryCategory: {
                CategoryName: "Restaurants",
                BPCategoryId: 700341,
              },
            },
          },
        ],
        TrackingId: "mocked-uuid",
        Identity: identity,
      });
    });

    test("should throw error for invalid number of businesses", async () => {
      await expect(client.updateBusinesses([])).rejects.toThrow(
        "Businesses array must contain between 1 and 1000 items."
      );

      const tooManyBusinesses = new Array(1001).fill(businesses[0]);
      await expect(client.updateBusinesses(tooManyBusinesses)).rejects.toThrow(
        "Businesses array must contain between 1 and 1000 items."
      );
    });
  });

  describe("fetch businesses", () => {
    let client: BingPlacesClient;
    let identity: Identity;
    let axiosInstance: jest.Mocked<typeof axios>;

    beforeEach(() => {
      identity = {
        Puid: "test",
        AuthProvider: "test",
        EmailId: "test@gmail.com",
      }; // Example identity object
      client = new BingPlacesClient({ identity, useSandbox: true }); // Assuming constructor takes identity and useSandbox
      axiosInstance = axios as jest.Mocked<typeof axios>;
      client["axiosInstance"] = axiosInstance; // Ensure axiosInstance is properly initialized
      (client["axiosInstance"] as any).defaults = {
        baseURL: "",
      };
    });

    afterEach(() => {
      jest.clearAllMocks();
    });

    const businessesResponse: FetchBusinessesResponse = {
      Businesses: [
        {
          StoreId: "Store_1",
          BusinessName: "New Business Name",
          AddressLine1: "Address Line",
          AddressLine2: "",
          City: "City",
          Country: "US",
          ZipCode: "98012",
          StateOrProvince: "WA",
          PhoneNumber: "(323) 123-4567",
          Categories: {
            BusinessCategories: [
              {
                CategoryName: "Restaurants",
                BPCategoryId: 700341,
              },
            ],
            PrimaryCategory: {
              CategoryName: "",
              BPCategoryId: 0,
            },
          },
          Latitude: "0",
          Longitude: "0",
          BusinessEmail: "",
          MainWebSite: "",
          FacebookAddress: "",
          TwitterAddress: "",
          Photos: [],
          MenuURL: "",
          OrderURL: undefined,
          RestaurantPrice: undefined,
          HotelStarRating: undefined,
          Amenities: [],
          Open24Hours: false,
          OperatingHours: [""],
          HolidayHours: undefined,
          HideAddress: false,
          IsClosed: false,
          Npi: undefined,
          Offers: null,
        },
        {
          StoreId: "Store_2",
          BusinessName: "New Business Name - 2",
          AddressLine1: "Address Line",
          AddressLine2: "",
          City: "City",
          Country: "US",
          ZipCode: "12345",
          StateOrProvince: "WA",
          PhoneNumber: "(323) 123-4568",
          Categories: {
            BusinessCategories: [
              {
                CategoryName: "Restaurants",
                BPCategoryId: 700341,
              },
            ],
            PrimaryCategory: {
              CategoryName: "",
              BPCategoryId: 0,
            },
          },
          Latitude: "0",
          Longitude: "0",
          BusinessEmail: "",
          MainWebSite: "",
          FacebookAddress: "",
          TwitterAddress: "",
          Photos: [],
          MenuURL: "",
          OrderURL: "",
          RestaurantPrice: undefined,
          HotelStarRating: undefined,
          Amenities: [],
          Open24Hours: false,
          OperatingHours: [""],
          HolidayHours: undefined,
          HideAddress: false,
          IsClosed: false,
          Npi: undefined,
          Offers: null,
        },
      ],
      Errors: {},
      TrackingId: "mocked-uuid",
      OperationStatus: true,
      ErrorMessage: null,
      ErrorCode: 0,
    };

    test("should fetch businesses page-wise", async () => {
      axiosInstance.post.mockResolvedValueOnce({ data: businessesResponse });

      const searchCriteria: SearchCriteria = {
        CriteriaType: "GetInBatches",
      };

      const result = await client.fetchBusinesses(1, 100, searchCriteria);

      expect(result).toEqual(businessesResponse);
      expect(axiosInstance.post).toHaveBeenCalledWith("/GetBusinesses", {
        TrackingId: "mocked-uuid",
        Identity: identity,
        PageNumber: 1,
        PageSize: 100,
        SearchCriteria: searchCriteria,
      });
    });

    test("should fetch businesses by store IDs", async () => {
      axiosInstance.post.mockResolvedValueOnce({ data: businessesResponse });

      const searchCriteria: SearchCriteria = {
        CriteriaType: "SearchByStoreIds",
        StoreIds: ["Store_1", "Store_2"],
      };

      const result = await client.fetchBusinesses(1, 100, searchCriteria);

      expect(result).toEqual(businessesResponse);
      expect(axiosInstance.post).toHaveBeenCalledWith("/GetBusinesses", {
        TrackingId: "mocked-uuid",
        Identity: identity,
        PageNumber: 1,
        PageSize: 100,
        SearchCriteria: searchCriteria,
      });
    });

    test("should fetch businesses by business name", async () => {
      axiosInstance.post.mockResolvedValueOnce({ data: businessesResponse });

      const searchCriteria: SearchCriteria = {
        CriteriaType: "SearchByQuery",
        BusinessName: "Contoso rentals",
      };

      const result = await client.fetchBusinesses(1, 100, searchCriteria);

      expect(result).toEqual(businessesResponse);
      expect(axiosInstance.post).toHaveBeenCalledWith("/GetBusinesses", {
        TrackingId: "mocked-uuid",
        Identity: identity,
        PageNumber: 1,
        PageSize: 100,
        SearchCriteria: searchCriteria,
      });
    });

    test("should throw error for invalid page number", async () => {
      const searchCriteria: SearchCriteria = {
        CriteriaType: "GetInBatches",
      };

      await expect(
        client.fetchBusinesses(0, 100, searchCriteria)
      ).rejects.toThrow("PageNumber must be greater than or equal to 1.");
    });

    test("should throw error for invalid page size", async () => {
      const searchCriteria: SearchCriteria = {
        CriteriaType: "GetInBatches",
      };

      await expect(
        client.fetchBusinesses(1, 0, searchCriteria)
      ).rejects.toThrow("PageSize must be between 1 and 1000.");

      await expect(
        client.fetchBusinesses(1, 1001, searchCriteria)
      ).rejects.toThrow("PageSize must be between 1 and 1000.");
    });
  });

  describe("fetch business status", () => {
    let client: BingPlacesClient;
    let identity: Identity;
    let axiosInstance: jest.Mocked<typeof axios>;

    const businessStatusInfoResponse1: FetchBusinessStatusInfoResponse = {
      BusinessesStatusInfo: [
        {
          StoreId: "Store_1",
          QualityIssues: [],
          YPId: null,
          YPIdAssignDate: "0001-01-01T00:00:00",
          PublishDate: "0001-01-01T00:00:00",
          HasPendingPublish: false,
          LastUpdateDate: "0001-01-01T00:00:00",
          BusinessStatus: "QualityCheckInProgress",
          PublishLink: null,
        },
        {
          StoreId: "Store_2",
          QualityIssues: [],
          YPId: null,
          YPIdAssignDate: "0001-01-01T00:00:00",
          PublishDate: "0001-01-01T00:00:00",
          HasPendingPublish: false,
          LastUpdateDate: "0001-01-01T00:00:00",
          BusinessStatus: "QualityCheckInProgress",
          PublishLink: null,
        },
      ],
      Errors: {},
      TrackingId: "mocked-uuid",
      OperationStatus: true,
      ErrorMessage: null,
      ErrorCode: 0,
    };

    const businessStatusInfoResponse2: FetchBusinessStatusInfoResponse = {
      BusinessesStatusInfo: [
        {
          StoreId: "Store_1",
          QualityIssues: [],
          YPId: "some ypid",
          YPIdAssignDate: "2016-03-06T09:31:46.617",
          PublishDate: "2016-03-06T09:31:46.617",
          HasPendingPublish: false,
          LastUpdateDate: "2016-03-05T17:16:52.767",
          BusinessStatus: "Published",
          PublishLink:
            "http://www.bing.com/mapspreview?ss=ypid.YN873x14884659662320771585&mkt=en-US",
        },
      ],
      Errors: {},
      TrackingId: "mocked-uuid",
      OperationStatus: true,
      ErrorMessage: null,
      ErrorCode: 0,
    };

    const businessStatusInfoResponse3: FetchBusinessStatusInfoResponse = {
      BusinessesStatusInfo: [
        {
          StoreId: "Store_1",
          QualityIssues: [
            {
              IssueType: "StaleBusinessData",
              SubIssueType: null,
            },
            {
              IssueType: "AddressGeocodeError",
              SubIssueType: null,
            },
            {
              IssueType: "ContentValidationError",
              SubIssueType: ["Description", "Business name"],
            },
          ],
          YPId: null,
          YPIdAssignDate: "0001-01-01T00:00:00",
          PublishDate: "0001-01-01T00:00:00",
          HasPendingPublish: false,
          LastUpdateDate: "0001-01-01T00:00:00",
          BusinessStatus: "QualityIssueFound",
          PublishLink: null,
        },
      ],
      Errors: {},
      TrackingId: "mocked-uuid",
      OperationStatus: true,
      ErrorMessage: null,
      ErrorCode: 0,
    };

    beforeEach(() => {
      identity = {
        Puid: "test",
        AuthProvider: "test",
        EmailId: "test@gmail.com",
      }; // Example identity object
      client = new BingPlacesClient({ identity, useSandbox: true }); // Assuming constructor takes identity and useSandbox
      axiosInstance = axios as jest.Mocked<typeof axios>;
      client["axiosInstance"] = axiosInstance;
      (client["axiosInstance"] as any).defaults = {
        baseURL: "",
      };
    });

    afterEach(() => {
      jest.clearAllMocks();
    });

    test("should fetch business status info page-wise", async () => {
      axiosInstance.post.mockResolvedValueOnce({
        data: businessStatusInfoResponse1,
      });

      const criteriaType = "GetInBatches";

      const result = await client.fetchBusinessStatusInfo(1, 100, criteriaType);

      expect(result).toEqual(businessStatusInfoResponse1);
      expect(axiosInstance.post).toHaveBeenCalledWith(
        "/GetBusinessStatusInfo",
        {
          TrackingId: "mocked-uuid",
          Identity: identity,
          PageNumber: 1,
          PageSize: 100,
          CriteriaType: criteriaType,
        }
      );
    });

    test("should fetch business status info by store IDs", async () => {
      axiosInstance.post.mockResolvedValueOnce({
        data: businessStatusInfoResponse2,
      });

      const criteriaType = "SearchByStoreIds";
      const storeIds = ["Store_1", "Store_2"];

      const result = await client.fetchBusinessStatusInfo(
        1,
        100,
        criteriaType,
        storeIds
      );

      expect(result).toEqual(businessStatusInfoResponse2);
      expect(axiosInstance.post).toHaveBeenCalledWith(
        "/GetBusinessStatusInfo",
        {
          TrackingId: "mocked-uuid",
          Identity: identity,
          PageNumber: 1,
          PageSize: 100,
          CriteriaType: criteriaType,
          StoreIds: storeIds,
        }
      );
    });

    test("should fetch business status info with quality issues", async () => {
      axiosInstance.post.mockResolvedValueOnce({
        data: businessStatusInfoResponse3,
      });

      const criteriaType = "SearchByStoreIds";
      const storeIds = ["Store_1"];

      const result = await client.fetchBusinessStatusInfo(
        1,
        100,
        criteriaType,
        storeIds
      );

      expect(result).toEqual(businessStatusInfoResponse3);
      expect(axiosInstance.post).toHaveBeenCalledWith(
        "/GetBusinessStatusInfo",
        {
          TrackingId: "mocked-uuid",
          Identity: identity,
          PageNumber: 1,
          PageSize: 100,
          CriteriaType: criteriaType,
          StoreIds: storeIds,
        }
      );
    });

    test("should throw error for invalid page number", async () => {
      const criteriaType = "GetInBatches";

      await expect(
        client.fetchBusinessStatusInfo(0, 100, criteriaType)
      ).rejects.toThrow("PageNumber must be greater than or equal to 1.");
    });

    test("should throw error for invalid page size", async () => {
      const criteriaType = "GetInBatches";

      await expect(
        client.fetchBusinessStatusInfo(1, 0, criteriaType)
      ).rejects.toThrow("PageSize must be between 1 and 1000.");

      await expect(
        client.fetchBusinessStatusInfo(1, 1001, criteriaType)
      ).rejects.toThrow("PageSize must be between 1 and 1000.");
    });
  });

  describe("get analytics of business", () => {
    let client: BingPlacesClient;
    let identity: Identity;
    let axiosInstance: jest.Mocked<typeof axios>;

    beforeEach(() => {
      identity = {
        Puid: "test",
        AuthProvider: "test",
        EmailId: "test@gmail.com",
      }; // Example identity object
      client = new BingPlacesClient({ identity, useSandbox: true }); // Assuming constructor takes identity and useSandbox
      axiosInstance = axios as jest.Mocked<typeof axios>;
      client["axiosInstance"] = axiosInstance;
      (client["axiosInstance"] as any).defaults = {
        baseURL: "",
      };
    });

    afterEach(() => {
      jest.clearAllMocks();
    });

    const analyticsResponse: GetAnalyticsResponse = {
      BusinessesAnalytics: [
        {
          StoreId: "750858",
          BusinessStatisticsList: [
            {
              ImpressionCount: 29,
              BusinessStatStartTime: "2015-11-30T00:00:00",
            },
            {
              ImpressionCount: 18,
              BusinessStatStartTime: "2015-12-07T00:00:00",
            },
            {
              ImpressionCount: 15,
              BusinessStatStartTime: "2015-12-14T00:00:00",
            },
            {
              ImpressionCount: 20,
              BusinessStatStartTime: "2015-12-21T00:00:00",
            },
            {
              ImpressionCount: 29,
              BusinessStatStartTime: "2015-12-28T00:00:00",
            },
            {
              ImpressionCount: 47,
              BusinessStatStartTime: "2016-01-04T00:00:00",
            },
            {
              ImpressionCount: 39,
              BusinessStatStartTime: "2016-01-11T00:00:00",
            },
            {
              ImpressionCount: 39,
              BusinessStatStartTime: "2016-01-18T00:00:00",
            },
            {
              ImpressionCount: 39,
              BusinessStatStartTime: "2016-01-25T00:00:00",
            },
            {
              ImpressionCount: 27,
              BusinessStatStartTime: "2016-02-01T00:00:00",
            },
            {
              ImpressionCount: 32,
              BusinessStatStartTime: "2016-02-08T00:00:00",
            },
            {
              ImpressionCount: 28,
              BusinessStatStartTime: "2016-02-15T00:00:00",
            },
          ],
        },
      ],
      Errors: {},
      TrackingId: "mocked-uuid",
      OperationStatus: true,
      ErrorMessage: null,
      ErrorCode: 0,
    };

    test("should fetch business analytics page-wise", async () => {
      axiosInstance.post.mockResolvedValueOnce({ data: analyticsResponse });

      const criteriaType = "GetInBatches";

      const result = await client.getAnalyticsForBusiness(1, 100, criteriaType);

      expect(result).toEqual(analyticsResponse);
      expect(axiosInstance.post).toHaveBeenCalledWith("/GetAnalytics", {
        TrackingId: "mocked-uuid",
        Identity: identity,
        PageNumber: 1,
        PageSize: 100,
        CriteriaType: criteriaType,
      });
    });

    test("should fetch business analytics by store IDs", async () => {
      axiosInstance.post.mockResolvedValueOnce({ data: analyticsResponse });

      const criteriaType = "SearchByStoreIds";
      const storeIds = ["Store_1", "Store_2"];

      const result = await client.getAnalyticsForBusiness(
        1,
        100,
        criteriaType,
        storeIds
      );

      expect(result).toEqual(analyticsResponse);
      expect(axiosInstance.post).toHaveBeenCalledWith("/GetAnalytics", {
        TrackingId: "mocked-uuid",
        Identity: identity,
        PageNumber: 1,
        PageSize: 100,
        CriteriaType: criteriaType,
        StoreIds: storeIds,
      });
    });

    test("should throw error for invalid page number", async () => {
      const criteriaType = "GetInBatches";

      await expect(
        client.getAnalyticsForBusiness(0, 100, criteriaType)
      ).rejects.toThrow("PageNumber must be greater than or equal to 1.");
    });

    test("should throw error for invalid page size", async () => {
      const criteriaType = "GetInBatches";

      await expect(
        client.getAnalyticsForBusiness(1, 0, criteriaType)
      ).rejects.toThrow("PageSize must be between 1 and 1000.");

      await expect(
        client.getAnalyticsForBusiness(1, 1001, criteriaType)
      ).rejects.toThrow("PageSize must be between 1 and 1000.");
    });
  });

  describe("delete businesses", () => {
    let client: BingPlacesClient;
    let identity: Identity;
    let axiosInstance: jest.Mocked<typeof axios>;

    beforeEach(() => {
      identity = {
        Puid: "test",
        AuthProvider: "test",
        EmailId: "test@gmail.com",
      }; // Example identity object
      client = new BingPlacesClient({ identity, useSandbox: true }); // Assuming constructor takes identity and useSandbox
      axiosInstance = axios as jest.Mocked<typeof axios>;
      client["axiosInstance"] = axiosInstance;
      (client["axiosInstance"] as any).defaults = {
        baseURL: "",
      };
    });

    afterEach(() => {
      jest.clearAllMocks();
    });

    const successfulResponse: DeleteBusinessesResponse = {
      DeletedBusinesses: [
        { StoreId: "Store_1", Status: "SUCCESSFUL" },
        { StoreId: "Store_2", Status: "SUCCESSFUL" },
      ],
      Errors: {},
      TrackingId: "mocked-uuid",
      OperationStatus: true,
      ErrorMessage: null,
      ErrorCode: 0,
    };

    const failedResponse: DeleteBusinessesResponse = {
      DeletedBusinesses: [
        {
          StoreId: "Store_6",
          Status: "FAILED",
          ErrorMessage:
            "Delete business failed since the store ID Store_6 does not exist in your account.",
        },
      ],
      Errors: {},
      TrackingId: "mocked-uuid",
      OperationStatus: true,
      ErrorMessage: null,
      ErrorCode: 0,
    };

    test("should delete businesses successfully", async () => {
      axiosInstance.post.mockResolvedValueOnce({ data: successfulResponse });

      const storeIds = ["Store_1", "Store_2"];

      const result = await client.deleteBusinesses(storeIds);

      expect(result).toEqual(successfulResponse);
      expect(axiosInstance.post).toHaveBeenCalledWith("/DeleteBusinesses", {
        TrackingId: "mocked-uuid",
        Identity: identity,
        StoreIds: storeIds,
      });
    });

    test("should handle failed deletion due to non-existent store IDs", async () => {
      axiosInstance.post.mockResolvedValueOnce({ data: failedResponse });

      const storeIds = ["Store_6"];

      const result = await client.deleteBusinesses(storeIds);

      expect(result).toEqual(failedResponse);
      expect(axiosInstance.post).toHaveBeenCalledWith("/DeleteBusinesses", {
        TrackingId: "mocked-uuid",
        Identity: identity,
        StoreIds: storeIds,
      });
    });

    test("should throw error for empty storeIds", async () => {
      await expect(client.deleteBusinesses([])).rejects.toThrow(
        "StoreIds must not be empty."
      );
    });
  });

  describe("create bulk chain", () => {
    let client: BingPlacesClient;
    let identity: Identity;
    let axiosInstance: jest.Mocked<typeof axios>;

    beforeEach(() => {
      identity = {
        Puid: "test",
        AuthProvider: "test",
        EmailId: "test@gmail.com",
      }; // Example identity object
      client = new BingPlacesClient({ identity, useSandbox: true }); // Assuming constructor takes identity and useSandbox
      axiosInstance = axios as jest.Mocked<typeof axios>;
      client["axiosInstance"] = axiosInstance;
      (client["axiosInstance"] as any).defaults = {
        baseURL: "",
      };
    });

    afterEach(() => {
      jest.clearAllMocks();
    });

    describe("createChain", () => {
      const chainInfo = {
        ChainName: "chain name",
        Website: "www.contoso.com",
        Locations: 100,
        ClientContactName: "contactName",
        ClientCorporateEmail: "sample@contoso.com",
      };

      const successfulResponse: CreateBulkChainResponse = {
        Operation: "CHAIN_ADD",
        ErrorMessage: "",
        TrackingId: "mocked-uuid",
        OperationStatus: true,
        ErrorCode: 0,
      };

      const failedResponse: CreateBulkChainResponse = {
        Operation: "CHAIN_ADD",
        ErrorMessage: "CreateBulkChain failed since chain name already exists",
        TrackingId: "mocked-uuid",
        OperationStatus: false,
        ErrorCode: 0,
      };

      const invalidRequestResponse = {
        Message: "The request is invalid.",
        ModelState: {
          "request.ChainInfo.Website": ["You can't leave Website empty."],
        },
      };

      test("should create chain successfully", async () => {
        axiosInstance.post.mockResolvedValueOnce({ data: successfulResponse });

        const result = await client.createChain(chainInfo);

        expect(result).toEqual(successfulResponse);
        expect(axiosInstance.post).toHaveBeenCalledWith("/CreateBulkChain", {
          ChainInfo: chainInfo,
          TrackingId: "mocked-uuid",
          Identity: identity,
        });
      });

      test("should handle failed creation due to existing chain name", async () => {
        axiosInstance.post.mockResolvedValueOnce({ data: failedResponse });

        const result = await client.createChain(chainInfo);

        expect(result).toEqual(failedResponse);
        expect(axiosInstance.post).toHaveBeenCalledWith("/CreateBulkChain", {
          ChainInfo: chainInfo,
          TrackingId: "mocked-uuid",
          Identity: identity,
        });
      });

      test("should handle invalid request due to missing website", async () => {
        axiosInstance.post.mockRejectedValueOnce({
          response: { data: invalidRequestResponse, status: 400 },
        });

        const invalidChainInfo = { ...chainInfo, Website: "" };

        await expect(client.createChain(invalidChainInfo)).rejects.toThrow();

        expect(axiosInstance.post).toHaveBeenCalledWith("/CreateBulkChain", {
          ChainInfo: invalidChainInfo,
          TrackingId: "mocked-uuid",
          Identity: identity,
        });
      });

      test("should throw error for less than 10 locations", async () => {
        const invalidChainInfo = { ...chainInfo, Locations: 5 };

        await expect(client.createChain(invalidChainInfo)).rejects.toThrow(
          "Chain must have at least 10 locations."
        );
      });
    });
  });

  describe("update bulk chain", () => {
    let client: BingPlacesClient;
    let identity: Identity;
    let axiosInstance: jest.Mocked<typeof axios>;

    beforeEach(() => {
      identity = {
        Puid: "test",
        AuthProvider: "test",
        EmailId: "test@gmail.com",
      }; // Example identity object
      client = new BingPlacesClient({ identity, useSandbox: true }); // Assuming constructor takes identity and useSandbox
      axiosInstance = axios as jest.Mocked<typeof axios>;
      client["axiosInstance"] = axiosInstance;
      (client["axiosInstance"] as any).defaults = {
        baseURL: "",
      };
    });

    afterEach(() => {
      jest.clearAllMocks();
    });

    const chainInfo = {
      ChainName: "chain name",
      Website: "www.contoso.com",
      Locations: 100,
      ClientContactName: "contactName2",
      ClientCorporateEmail: "sample2@contoso.com",
    };

    const successfulResponse: UpdateBulkChainInfoResponse = {
      Operation: "CHAIN_UPDATE",
      ErrorMessage: "",
      TrackingId: "mocked-uuid",
      OperationStatus: true,
      ErrorCode: 0,
    };

    const failedResponse: UpdateBulkChainInfoResponse = {
      Operation: "CHAIN_UPDATE",
      ErrorMessage:
        "UpdateBulkChainInfo failed since chain name does not exist",
      TrackingId: "mocked-uuid",
      OperationStatus: false,
      ErrorCode: 0,
    };

    const invalidRequestResponse = {
      Message: "The request is invalid.",
      ModelState: {
        "request.ChainInfo.Website": ["You can't leave Website empty."],
      },
    };

    test("should update chain successfully", async () => {
      axiosInstance.post.mockResolvedValueOnce({ data: successfulResponse });

      const result = await client.updateChain(chainInfo);

      expect(result).toEqual(successfulResponse);
      expect(axiosInstance.post).toHaveBeenCalledWith("/UpdateBulkChainInfo", {
        ChainInfo: chainInfo,
        TrackingId: "mocked-uuid",
        Identity: identity,
      });
    });

    test("should handle failed update due to non-existent chain name", async () => {
      axiosInstance.post.mockResolvedValueOnce({ data: failedResponse });

      const result = await client.updateChain(chainInfo);

      expect(result).toEqual(failedResponse);
      expect(axiosInstance.post).toHaveBeenCalledWith("/UpdateBulkChainInfo", {
        ChainInfo: chainInfo,
        TrackingId: "mocked-uuid",
        Identity: identity,
      });
    });

    test("should handle invalid request due to missing website", async () => {
      axiosInstance.post.mockRejectedValueOnce({
        response: { data: invalidRequestResponse },
      });

      const invalidChainInfo = { ...chainInfo, Website: "" };

      await expect(client.updateChain(invalidChainInfo)).rejects.toThrow(
        "Failed to update chain"
      );
      expect(axiosInstance.post).toHaveBeenCalledWith("/UpdateBulkChainInfo", {
        ChainInfo: invalidChainInfo,
        TrackingId: "mocked-uuid",
        Identity: identity,
      });
    });

    test("should throw error for less than 10 locations", async () => {
      const invalidChainInfo = { ...chainInfo, Locations: 5 };

      await expect(client.updateChain(invalidChainInfo)).rejects.toThrow(
        "Chain must have at least 10 locations."
      );
    });
  });
});
