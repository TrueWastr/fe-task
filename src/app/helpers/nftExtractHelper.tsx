export type WalletInfo = {
  address: string;
  stake_address: string;
  amount: {
    unit: string;
    quantity: string;
  }[];
};

export type Utxo = {
  tx_hash: string;
  output_index: number;
  amount: {
    unit: string;
    quantity: string;
  }[];
  block: string;
  data_hash?: string;
  inline_datum?: string;
  reference_script_hash?: string;
};

export type NFT = {
  assetId: string;
  policy: string;
  asset: string;
  quantity: string;
  price: number;
  image?: string | null;
};

export function extractNFTs(utxos: Utxo[]): NFT[] {
  const nfts: NFT[] = [];
  utxos.forEach((utxo) => {
    const adaItem = utxo.amount.find((item) => item.unit === "lovelace");
    const price = adaItem ? Number(adaItem.quantity) / 1e6 : undefined;

    utxo.amount.forEach((item) => {
      if (item.unit !== "lovelace" && item.quantity === "1") {
        const assetId = item.unit;
        const policy = assetId.slice(0, 56);
        const assetHex = assetId.slice(56);
        let assetName = assetHex;
        try {
          const decodedName =
            Buffer.from(assetHex, "hex").toString("utf8") || assetHex;
          assetName = transformAssetName(decodedName);
        } catch (e) {
          console.error(e);
          assetName = assetHex;
        }
        nfts.push({
          assetId,
          policy,
          asset: assetName,
          quantity: item.quantity,
          price: price ? price : 0,
        });
      }
    });
  });
  console.log("Extracted NFTs:", nfts);
  return nfts;
}

export function resolveIpfsUrl(url: unknown): string {
  if (typeof url !== "string") return "";
  if (url.startsWith("ipfs://")) {
    return url.replace("ipfs://", "https://ipfs.io/ipfs/");
  }
  return url;
}

export function transformAssetName(name: string): string {
  const regex = /^(.*?)(0*)(\d+)$/;
  const match = name.match(regex);
  if (match) {
    return `${match[1].trim()} #${match[3]}`;
  }
  return name;
}
