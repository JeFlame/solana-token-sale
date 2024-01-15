import * as dotenv from "dotenv";
dotenv.config();

import {
  Connection,
  Keypair,
  PublicKey,
  LAMPORTS_PER_SOL,
  clusterApiUrl,
} from "@solana/web3.js";
import { Token, TOKEN_PROGRAM_ID } from "@solana/spl-token";
import { updateEnv } from "./utils";
import base58 = require("bs58");

const setup = async () => {
  let connection = new Connection(clusterApiUrl("devnet"), "confirmed");
  // const sellerPubkey = new PublicKey(process.env.SELLER_PUBLIC_KEY!);
  // const sellerPrivateKey = Uint8Array.from(
  //   JSON.parse(process.env.SELLER_PRIVATE_KEY!)
  // );
  // const sellerKeypair = new Keypair({
  //   publicKey: sellerPubkey.toBytes(),
  //   secretKey: sellerPrivateKey,
  // });
  const sellerKeypair = Keypair.fromSecretKey(
    base58.decode(process.env.SELLER_PRIVATE_KEY!)
  );
  const buyerPubkey = new PublicKey(process.env.BUYER_PUBLIC_KEY!);

  console.log("Create Token Mint Account...\n");
  const token = await Token.createMint(
    connection,
    sellerKeypair,
    sellerKeypair.publicKey,
    null,
    9,
    TOKEN_PROGRAM_ID
  );

  console.log("Create Saler Token Account...\n");
  const sellerTokenAccount = await token.getOrCreateAssociatedAccountInfo(
    sellerKeypair.publicKey
  );

  console.log("Mint Token to seller token account...\n");
  await token.mintTo(
    sellerTokenAccount.address,
    sellerKeypair,
    [],
    50000000 * 10 ** 8
  );

  await token.burn(
    sellerTokenAccount.address,
    sellerKeypair,
    [],
    10000000 * 10 ** 8
  );

  const sellerTokenBalance = await connection.getTokenAccountBalance(
    sellerTokenAccount.address,
    "confirmed"
  );

  console.log("Requesting SOL for buyer...");
  // await connection.requestAirdrop(buyerPubkey, LAMPORTS_PER_SOL * 2);

  console.table([
    {
      tokenPubkey: token.publicKey.toString(),
      sellerTokenAccountPubkey: sellerTokenAccount.address.toString(),
      sellerTokenBalance: sellerTokenBalance.value.amount,
    },
  ]);
  console.log(`✨TX successfully finished✨\n`);

  process.env.SELLER_TOKEN_ACCOUNT_PUBKEY =
    sellerTokenAccount.address.toString();
  process.env.TOKEN_PUBKEY = token.publicKey.toString();
  updateEnv();
};

setup();
