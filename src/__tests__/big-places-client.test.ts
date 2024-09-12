import { BingPlacesClient } from "../core/bing-places-client";
import { Constants } from "../core/constants";
import { Identity } from "../models";
import axios from "axios";
import { v4 as uuidv4 } from "uuid";
import { BusinessListing, CreateBusinessesResponse } from "../models"; // Adjust the import based on your actual file structure

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
});
