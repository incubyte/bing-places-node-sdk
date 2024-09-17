import { ChainInfo } from "../common/chain-info";
import { Identity } from "../common/identity";

export interface CreateBulkChainRequest {
  ChainInfo: ChainInfo;
  TrackingId: string;
  Identity: Identity;
}
