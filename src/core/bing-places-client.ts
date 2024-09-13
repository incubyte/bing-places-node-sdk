import axios, { AxiosInstance } from "axios";
import { v4 as uuidv4 } from "uuid";
import {
  BusinessListing,
  CreateBusinessesRequest,
  CreateBusinessesResponse,
  Identity,
} from "../models";
import { Constants } from "./constants";
import { Utils } from "./utils";

interface BingPlacesClientOptions {
  useSandbox?: boolean;
  identity: Identity;
}

export class BingPlacesClient {
  private axiosInstance: AxiosInstance;
  private identity: Identity;
  private useSandbox: boolean;

  constructor(options: BingPlacesClientOptions) {
    options = options || { identity: null };

    if (
      !options.identity ||
      !options.identity.Puid ||
      !options.identity.EmailId ||
      !options.identity.AuthProvider
    ) {
      throw new Error(
        "BingPlacesClient: Identity is required. Please provide a valid Identity object."
      );
    }

    if (!Utils.isEmailValid(options.identity.EmailId)) {
      throw new Error(
        "BingPlacesClient: EmailId is not a valid email address."
      );
    }

    const { identity, useSandbox } = options;

    if (useSandbox !== undefined && typeof useSandbox !== "boolean") {
      console.warn(
        "BingPlacesClient: useSandbox not set. Defaulting to false."
      );
    }

    this.useSandbox = useSandbox || false;

    this.identity = identity;
    this.axiosInstance = axios.create({
      baseURL: useSandbox
        ? Constants.Endpoints.Sandbox
        : Constants.Endpoints.Production,
      headers: {
        "Content-Type": "application/json",
        "X-BingApis-SDK-Client": "bing-places-node",
        "X-BingApis-SDK-ClientVersion": "1.0.0",
        "X-BingApis-SDK-ClientRequestId": uuidv4(),
        "X-BingApis-SDK-Identity": JSON.stringify(identity),
      },
    });
  }

  getCurrentIdentity(): Identity {
    return Object.assign({}, this.identity); // so that the private variable can't be mutated by the caller
  }

  updateIdentity(identity: Identity): void {
    this.identity = identity;
    this.axiosInstance.defaults.headers["X-BingApis-SDK-Identity"] =
      JSON.stringify(identity);
  }

  isSandbox(): boolean {
    return this.useSandbox;
  }

  isProduction(): boolean {
    return !this.useSandbox;
  }

  shiftToSandbox(): void {
    this.useSandbox = true;
    this.axiosInstance.defaults.baseURL = Constants.Endpoints.Sandbox;
  }

  shiftToProduction(): void {
    this.useSandbox = false;
    this.axiosInstance.defaults.baseURL = Constants.Endpoints.Production;
  }

  public async createBusinesses(
    businesses: BusinessListing[]
  ): Promise<CreateBusinessesResponse> {
    // TODO: 1. add validations for businesses array
    // TODO: 2. add a way to track the request and response in a persistent way or through log storage like CloudWatch
    const requestBody: CreateBusinessesRequest = {
      Businesses: businesses,
      TrackingId: uuidv4(), // Generate a new GUID for each request
      Identity: this.identity,
    };

    try {
      const response = await this.axiosInstance.post<CreateBusinessesResponse>(
        "/CreateBusinesses",
        requestBody
      );
      return response.data;
    } catch (error) {
      throw new Error(`Failed to create businesses: ${error}`);
    }
  }

  public async createSingleBusiness(
    business: BusinessListing
  ): Promise<CreateBusinessesResponse> {
    return this.createBusinesses([business]);
  }
}
