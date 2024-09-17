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

export interface BingPlacesClientOptions {
  verbose?: boolean;
  useSandbox?: boolean;
  identity: Identity;
}

// TODO: method names should exactly mimic API endpoints for better readability
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

  private async postRequest<T, V>({
    url,
    data,
    requestName,
  }: {
    url: string;
    data: T;
    requestName: string;
  }): Promise<{ response: V; status: number }> {
    try {
      const response = await this.axiosInstance.post<V>(url, data);
      return { response: response.data, status: response.status };
    } catch (error) {
      if (this.verbose) {
        console.error(
          `BingPlacesClient.postRequest: Failed to post request: ${requestName}.`,
          error
        );
      }

      if (axios.isAxiosError(error)) {
        throw new Error(
          `Failed to post request: ${
            error.response?.data?.ErrorMessage || error.message || requestName
          }`
        );
      } else {
        throw new Error(`Failed to post request: ${requestName}`);
      }
    }
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

    return this.postRequest<CreateBusinessesRequest, CreateBusinessesResponse>({
      url: "/CreateBusinesses",
      data: requestBody,
      requestName: "CreateBusinesses",
    });
  }

  public async createSingleBusiness({
    business,
  }: {
    business: BusinessListing;
  }): Promise<{ response: CreateBusinessesResponse; status: number }> {
    return this.createBusinesses({ businesses: [business] });
  }

  public async updateBusinesses({
    businesses,
  }: {
    businesses: BusinessListing[];
  }): Promise<{ response: UpdateBusinessesResponse; status: number }> {
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

    return this.postRequest<UpdateBusinessesRequest, UpdateBusinessesResponse>({
      url: "/UpdateBusinesses",
      data: requestBody,
      requestName: "UpdateBusinesses",
    });
  }

  public async fetchBusinesses({
    pageNumber,
    pageSize,
    searchCriteria,
  }: {
    pageNumber: number;
    pageSize: number;
    searchCriteria: FetchBusinessesRequest["SearchCriteria"];
  }): Promise<{ response: FetchBusinessesResponse; status: number }> {
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

    return this.postRequest<FetchBusinessesRequest, FetchBusinessesResponse>({
      url: "/GetBusinesses",
      data: requestBody,
      requestName: "FetchBusinesses",
    });
  }
  public async fetchBusinessStatusInfo({
    pageNumber,
    pageSize,
    criteriaType,
    storeIds,
  }: {
    pageNumber: number;
    pageSize: number;
    criteriaType: FetchBusinessStatusInfoRequest["CriteriaType"];
    storeIds?: string[];
  }): Promise<{ response: FetchBusinessStatusInfoResponse; status: number }> {
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

    return this.postRequest<
      FetchBusinessStatusInfoRequest,
      FetchBusinessStatusInfoResponse
    >({
      url: "/GetBusinessStatusInfo",
      data: requestBody,
      requestName: "FetchBusinessStatusInfo",
    });
  }

  public async getAnalyticsForBusiness({
    pageNumber,
    pageSize,
    criteriaType,
    storeIds,
  }: {
    pageNumber: number;
    pageSize: number;
    criteriaType: GetAnalyticsRequest["CriteriaType"];
    storeIds?: string[];
  }): Promise<{ response: GetAnalyticsResponse; status: number }> {
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

    return this.postRequest<GetAnalyticsRequest, GetAnalyticsResponse>({
      url: "/GetAnalytics",
      data: requestBody,
      requestName: "GetAnalyticsForBusiness",
    });
  }

  public async deleteBusinesses({
    storeIds,
  }: {
    storeIds: string[];
  }): Promise<{ response: DeleteBusinessesResponse; status: number }> {
    if (storeIds.length === 0) {
      throw new Error("StoreIds must not be empty.");
    }

    const requestBody: DeleteBusinessesRequest = {
      TrackingId: uuidv4(), // Generate a new GUID for each request
      Identity: this.identity,
      StoreIds: storeIds,
    };

    return this.postRequest<DeleteBusinessesRequest, DeleteBusinessesResponse>({
      url: "/DeleteBusinesses",
      data: requestBody,
      requestName: "DeleteBusinesses",
    });
  }

  public async createChain({
    chainInfo,
  }: {
    chainInfo: ChainInfo;
  }): Promise<{ response: CreateBulkChainResponse; status: number }> {
    if (chainInfo.Locations < 10) {
      throw new Error("Chain must have at least 10 locations.");
    }

    const requestBody: CreateBulkChainRequest = {
      ChainInfo: chainInfo,
      TrackingId: uuidv4(), // Generate a new GUID for each request
      Identity: this.identity,
    };

    return this.postRequest<CreateBulkChainRequest, CreateBulkChainResponse>({
      url: "/CreateBulkChain",
      data: requestBody,
      requestName: "CreateChain",
    });
  }

  public async updateChain({
    chainInfo,
  }: {
    chainInfo: ChainInfo;
  }): Promise<{ response: UpdateBulkChainInfoResponse; status: number }> {
    if (chainInfo.Locations < 10) {
      throw new Error("Chain must have at least 10 locations.");
    }

    const requestBody: UpdateBulkChainInfoRequest = {
      ChainInfo: chainInfo,
      TrackingId: uuidv4(), // Generate a new GUID for each request
      Identity: this.identity,
    };

    return this.postRequest<
      UpdateBulkChainInfoRequest,
      UpdateBulkChainInfoResponse
    >({
      url: "/UpdateBulkChainInfo",
      data: requestBody,
      requestName: "UpdateChain",
    });
  }
}
