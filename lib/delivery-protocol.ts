export type DeliveryClaim =
  | { tag: "acquired"; ownerAccepted: boolean }
  | { tag: "complete"; confirmationSent: boolean }
  | { tag: "pending" }
  | { tag: "conflict" }
  | { tag: "expired" };

/** The store records delivery metadata, never the enquiry body or raw address. */
export interface DeliveryStore {
  ready(): Promise<boolean>;
  allow(key: string): Promise<boolean>;
  claim(id: string, payloadHash: string, token: string): Promise<DeliveryClaim>;
  acceptOwner(id: string, token: string, providerId: string): Promise<boolean>;
  complete(
    id: string,
    token: string,
    confirmationSent: boolean,
  ): Promise<boolean>;
  uncertain(id: string, token: string): Promise<boolean>;
}
