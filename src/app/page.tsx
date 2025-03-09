//import Image from "next/image";
import styles from "./page.module.scss";

type WalletInfo = {
  address: string;
  stake_address: string;
  amount: {
    unit: string;
    quantity: string;
  }[];
};

const WALLET_ADDRESS = process.env.CARDANO_WALLET_ADDRESS as string;

async function getWalletInfo(address: string): Promise<WalletInfo> {
  const res = await fetch(
    `${process.env.BLOCKFROST_BASE_URL}/addresses/${address}`,
    {
      headers: {
        // Blockfrost expects your API key in the "project_id" header.
        project_id: process.env.BLOCKFROST_API_KEY as string,
      },
      next: { revalidate: 60 }, // ISR: revalidate data every 60 seconds
    }
  );
  if (!res.ok) {
    throw new Error("Failed to fetch wallet info");
  }
  return res.json();
}

export default async function Home() {
  const walletInfo = await getWalletInfo(WALLET_ADDRESS);

  const adaBalance =
    walletInfo.amount
      .filter((item) => item.unit === "lovelace")
      .reduce((acc, item) => acc + Number(item.quantity), 0) / 1e6;
  return (
    <div className={styles.page}>
      <h1>Wallet Overview</h1>
      <section>
        <p>Adress: {walletInfo.address}</p>
        <p>Stake Address: {walletInfo.stake_address}</p>
        <p>ADA Balance: {adaBalance.toFixed(2)} ADA</p>
      </section>
    </div>
  );
}
