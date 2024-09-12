import axios, { AxiosInstance } from "axios";
import { v4 as uuidv4 } from "uuid";
import { Identity } from "../models";
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
        "BigPlacesClient: Identity is required. Please provide a valid Identity object."
      );
    }

    if (!Utils.isEmailValid(options.identity.EmailId)) {
      throw new Error("BigPlacesClient: EmailId is not a valid email address.");
    }

    const { identity, useSandbox } = options;

    if (useSandbox !== undefined && typeof useSandbox !== "boolean") {
      console.warn("BigPlacesClient: useSandbox not set. Defaulting to false.");
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
}
