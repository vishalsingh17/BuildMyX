import type { DeliveryStore } from "../delivery-protocol";

/** Isolated fake for HTTP orchestration tests; Convex tests verify the real store. */
export function memoryDeliveryStore(): DeliveryStore {
  const records = new Map<
    string,
    { hash: string; token: string; owner: boolean; result?: boolean }
  >();
  return {
    ready: async () => true,
    allow: async () => true,
    claim: async (id, hash, token) => {
      const record = records.get(id);
      if (record?.hash !== undefined && record.hash !== hash)
        return { tag: "conflict" };
      if (record?.result !== undefined)
        return { tag: "complete", confirmationSent: record.result };
      if (record?.token) return { tag: "pending" };
      records.set(id, { hash, token, owner: record?.owner ?? false });
      return { tag: "acquired", ownerAccepted: record?.owner ?? false };
    },
    acceptOwner: async (id, token) => {
      const record = records.get(id);
      if (!record || record.token !== token) return false;
      record.owner = true;
      return true;
    },
    complete: async (id, token, result) => {
      const record = records.get(id);
      if (!record?.owner || record.token !== token) return false;
      record.result = result;
      record.token = "";
      return true;
    },
    uncertain: async (id, token) => {
      const record = records.get(id);
      if (!record || record.token !== token) return false;
      record.token = "";
      return true;
    },
  };
}
