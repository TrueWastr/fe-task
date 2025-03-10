import Image from "next/image";
import styles from "./page.module.scss";
import {
  extractNFTs,
  NFT,
  Utxo,
  WalletInfo,
  resolveIpfsUrl,
} from "./helpers/nftExtractHelper";

const WALLET_ADDRESS = process.env.CARDANO_WALLET_ADDRESS as string;

async function getWalletInfo(address: string): Promise<WalletInfo> {
  const res = await fetch(
    `${process.env.BLOCKFROST_BASE_URL}/addresses/${address}`,
    {
      headers: {
        project_id: process.env.BLOCKFROST_API_KEY as string,
      },
      next: { revalidate: 60 },
    }
  );
  if (!res.ok) {
    throw new Error("Failed to fetch wallet info");
  }
  return res.json();
}

async function getAssetImage(assetId: string): Promise<string | null> {
  const res = await fetch(
    `https://cardano-mainnet.blockfrost.io/api/v0/assets/${assetId}`,
    {
      headers: {
        project_id: process.env.BLOCKFROST_API_KEY as string,
      },
    }
  );
  if (!res.ok) {
    return null;
  }
  const data = await res.json();
  if (data.onchain_metadata && data.onchain_metadata.image) {
    const imageData = data.onchain_metadata.image;
    if (Array.isArray(imageData)) {
      return imageData[0] + imageData[1];
    }
    return imageData;
  }
  return null;
}

async function getWalletUtxos(address: string): Promise<Utxo[]> {
  const res = await fetch(
    `https://cardano-mainnet.blockfrost.io/api/v0/addresses/${address}/utxos`,
    {
      headers: {
        project_id: process.env.BLOCKFROST_API_KEY as string,
      },
      next: { revalidate: 60 },
    }
  );
  if (!res.ok) {
    throw new Error("Failed to fetch wallet UTXOs");
  }
  return res.json();
}

export default async function Home() {
  const [walletInfo, utxos] = await Promise.all([
    getWalletInfo(WALLET_ADDRESS),
    getWalletUtxos(WALLET_ADDRESS),
  ]);
  const nfts = extractNFTs(utxos);

  const nftsWithImages: NFT[] = await Promise.all(
    nfts.map(async (nft) => {
      const image = await getAssetImage(nft.assetId);
      return { ...nft, image };
    })
  );

  const adaBalance =
    walletInfo.amount
      .filter((item) => item.unit === "lovelace")
      .reduce((acc, item) => acc + Number(item.quantity), 0) / 1e6;

  return (
    <>
      <div className={styles.navigation}>
        <p>Balance: {adaBalance.toFixed(2)} ADA</p>
      </div>
      <div className={styles.page}>
        <h1>NFT Collection: </h1>
        <section className={styles.nftCollection}>
          {nftsWithImages.length === 0 ? (
            <p>No NFTs found in this wallet.</p>
          ) : (
            <div className={styles.nftGrid}>
              {nftsWithImages.map((nft, index) => (
                <div key={index} className={styles.nft}>
                  {nft.image && resolveIpfsUrl(nft.image) !== "" ? (
                    <div className={styles.nftImage}>
                      <Image
                        src={resolveIpfsUrl(nft.image)}
                        alt={nft.asset}
                        fill
                        style={{ objectFit: "contain" }}
                      />
                    </div>
                  ) : (
                    <span>No Image</span>
                  )}
                  <div className={styles.nftDetails}>
                    <p>{nft.asset}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </>
  );
}
