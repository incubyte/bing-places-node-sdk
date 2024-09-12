import { BingPlacesClient } from "../core/bing-places-client";
import { Constants } from "../core/constants";
import { Identity } from "../models";
import axios from "axios";

describe("BigPlacesClient", () => {
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

      // Assuming BigPlacesClient is a class and the code is inside a method
      const client = new BingPlacesClient({
        identity: {
          Puid: "test",
          AuthProvider: "test",
          EmailId: "test@gmail.com",
        },
        useSandbox,
      });

      expect(consoleWarnSpy).toHaveBeenCalledWith(
        "BigPlacesClient: useSandbox not set. Defaulting to false."
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
});
