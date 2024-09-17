import { ChainInfo } from "../common/chain-info";
import { Identity } from "../common/identity";

export interface UpdateBulkChainInfoRequest {
  ChainInfo: ChainInfo;
  TrackingId: string;
  Identity: Identity;
}
