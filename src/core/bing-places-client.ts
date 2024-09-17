import axios, { AxiosInstance } from "axios";
import { v4 as uuidv4 } from "uuid";
import { BusinessListing, ChainInfo, Identity } from "../models/common";
import {
  UpdateBusinessesRequest,
  UpdateBusinessesResponse,
  CreateBusinessesRequest,
  CreateBusinessesResponse,
  FetchBusinessesRequest,
  FetchBusinessesResponse,
  FetchBusinessStatusInfoRequest,
  FetchBusinessStatusInfoResponse,
  GetAnalyticsRequest,
  GetAnalyticsResponse,
  DeleteBusinessesRequest,
  DeleteBusinessesResponse,
  CreateBulkChainRequest,
  CreateBulkChainResponse,
  UpdateBulkChainInfoRequest,
  UpdateBulkChainInfoResponse,
} from "../models/api";
import { Constants } from "./constants";
import { Utils } from "./utils";

interface BingPlacesClientOptions {
  verbose?: boolean;
  useSandbox?: boolean;
  identity: Identity;
}

export class BingPlacesClient {
  private axiosInstance: AxiosInstance;
  private identity: Identity;
  private useSandbox: boolean;
  private verbose: boolean;

  constructor(options: BingPlacesClientOptions) {
    options = options || { identity: null };

    this.verbose = options.verbose == undefined ? false : options.verbose;

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

  public async createBusinesses({
    businesses,
  }: {
    businesses: BusinessListing[];
  }): Promise<{ response: CreateBusinessesResponse; status: number }> {
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

      return {
        response: response.data,
        status: response.status,
      };
    } catch (error) {
      if (this.verbose) {
        console.error(
          "BigPlaces.createBusinesses: Failed to create businesses. ",
          error
        );
      }

      if (axios.isAxiosError(error)) {
        throw new Error(
          `Failed to create businesses: ${
            error.response?.data?.ErrorMessage || error.message
          }`
        );
      } else {
        throw new Error(`Failed to create businesses`);
      }
    }
  }

  public async createSingleBusiness(
    business: BusinessListing
  ): Promise<{ response: CreateBusinessesResponse; status: number }> {
    return this.createBusinesses({ businesses: [business] });
  }

  public async updateBusinesses(
    businesses: BusinessListing[]
  ): Promise<UpdateBusinessesResponse> {
    if (
      !Array.isArray(businesses) ||
      businesses.length === 0 ||
      businesses.length > 1000
    ) {
      throw new Error(
        "Businesses array must contain between 1 and 1000 items."
      );
    }

    const requestBody: UpdateBusinessesRequest = {
      Businesses: businesses,
      TrackingId: uuidv4(), // Generate a new GUID for each request
      Identity: this.identity,
    };

    try {
      const response = await this.axiosInstance.post<UpdateBusinessesResponse>(
        "/UpdateBusinesses",
        requestBody
      );
      return response.data;
    } catch (error) {
      throw new Error(`Failed to update businesses: ${error}`);
    }
  }

  public async fetchBusinesses(
    pageNumber: number,
    pageSize: number,
    searchCriteria: FetchBusinessesRequest["SearchCriteria"]
  ): Promise<FetchBusinessesResponse> {
    if (pageNumber < 1) {
      throw new Error("PageNumber must be greater than or equal to 1.");
    }
    if (pageSize < 1 || pageSize > 1000) {
      throw new Error("PageSize must be between 1 and 1000.");
    }

    const requestBody: FetchBusinessesRequest = {
      TrackingId: uuidv4(), // Generate a new GUID for each request
      Identity: this.identity,
      PageNumber: pageNumber,
      PageSize: pageSize,
      SearchCriteria: searchCriteria,
    };

    try {
      const response = await this.axiosInstance.post<FetchBusinessesResponse>(
        "/GetBusinesses",
        requestBody
      );
      return response.data;
    } catch (error) {
      throw new Error(`Failed to fetch businesses: ${error}`);
    }
  }

  public async fetchBusinessStatusInfo(
    pageNumber: number,
    pageSize: number,
    criteriaType: "GetInBatches" | "SearchByStoreIds",
    storeIds?: string[]
  ): Promise<FetchBusinessStatusInfoResponse> {
    if (pageNumber < 1) {
      throw new Error("PageNumber must be greater than or equal to 1.");
    }
    if (pageSize < 1 || pageSize > 1000) {
      throw new Error("PageSize must be between 1 and 1000.");
    }

    const requestBody: FetchBusinessStatusInfoRequest = {
      TrackingId: uuidv4(), // Generate a new GUID for each request
      Identity: this.identity,
      PageNumber: pageNumber,
      PageSize: pageSize,
      CriteriaType: criteriaType,
      StoreIds: storeIds,
    };

    try {
      const response =
        await this.axiosInstance.post<FetchBusinessStatusInfoResponse>(
          "/GetBusinessStatusInfo",
          requestBody
        );
      return response.data;
    } catch (error) {
      throw new Error(`Failed to fetch business status info: ${error}`);
    }
  }

  public async getAnalyticsForBusiness(
    pageNumber: number,
    pageSize: number,
    criteriaType: "GetInBatches" | "SearchByStoreIds",
    storeIds?: string[]
  ): Promise<GetAnalyticsResponse> {
    if (pageNumber < 1) {
      throw new Error("PageNumber must be greater than or equal to 1.");
    }
    if (pageSize < 1 || pageSize > 1000) {
      throw new Error("PageSize must be between 1 and 1000.");
    }

    const requestBody: GetAnalyticsRequest = {
      TrackingId: uuidv4(), // Generate a new GUID for each request
      Identity: this.identity,
      PageNumber: pageNumber,
      PageSize: pageSize,
      CriteriaType: criteriaType,
      StoreIds: storeIds,
    };

    try {
      const response = await this.axiosInstance.post<GetAnalyticsResponse>(
        "/GetAnalytics",
        requestBody
      );
      return response.data;
    } catch (error) {
      throw new Error(`Failed to fetch business analytics: ${error}`);
    }
  }

  public async deleteBusinesses(
    storeIds: string[]
  ): Promise<DeleteBusinessesResponse> {
    if (storeIds.length === 0) {
      throw new Error("StoreIds must not be empty.");
    }

    const requestBody: DeleteBusinessesRequest = {
      TrackingId: uuidv4(), // Generate a new GUID for each request
      Identity: this.identity,
      StoreIds: storeIds,
    };

    try {
      const response = await this.axiosInstance.post<DeleteBusinessesResponse>(
        "/DeleteBusinesses",
        requestBody
      );
      return response.data;
    } catch (error) {
      throw new Error(`Failed to delete businesses: ${error}`);
    }
  }

  public async createChain(
    chainInfo: ChainInfo
  ): Promise<CreateBulkChainResponse> {
    if (chainInfo.Locations < 10) {
      throw new Error("Chain must have at least 10 locations.");
    }

    const requestBody: CreateBulkChainRequest = {
      ChainInfo: chainInfo,
      TrackingId: uuidv4(), // Generate a new GUID for each request
      Identity: this.identity,
    };

    try {
      const response = await this.axiosInstance.post<CreateBulkChainResponse>(
        "/CreateBulkChain",
        requestBody
      );
      return response.data;
    } catch (error) {
      console.error("Failed to create chain: ", error);
      throw new Error(`Failed to create chain`);
    }
  }

  public async updateChain(
    chainInfo: ChainInfo
  ): Promise<UpdateBulkChainInfoResponse> {
    if (chainInfo.Locations < 10) {
      throw new Error("Chain must have at least 10 locations.");
    }

    const requestBody: UpdateBulkChainInfoRequest = {
      ChainInfo: chainInfo,
      TrackingId: uuidv4(), // Generate a new GUID for each request
      Identity: this.identity,
    };

    try {
      const response =
        await this.axiosInstance.post<UpdateBulkChainInfoResponse>(
          "/UpdateBulkChainInfo",
          requestBody
        );
      return response.data;
    } catch (error) {
      console.error("Failed to update chain: ", error);
      throw new Error(`Failed to update chain`);
    }
  }
}
