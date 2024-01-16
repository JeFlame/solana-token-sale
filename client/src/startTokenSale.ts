import * as dotenv from "dotenv";
dotenv.config();

import {
  clusterApiUrl,
  Connection,
  Keypair,
  PublicKey,
  SystemProgram,
  SYSVAR_RENT_PUBKEY,
  Transaction,
  TransactionInstruction,
} from "@solana/web3.js";
import BN = require("bn.js");
import * as borsh from "@project-serum/borsh";
import { createAccountInfo, updateEnv, getConfig, getIdoConfig } from "./utils";

import { TokenSaleAccountLayout } from "./account";
import { AccountLayout, Token, TOKEN_PROGRAM_ID } from "@solana/spl-token";
import base58 = require("bs58");

const transaction = async () => {
  const configInstructionLayout = borsh.struct([
    borsh.u8("variant"),
    borsh.u64("total_sale_token"),
    borsh.u64("price"),
    borsh.u64("start_time"),
    borsh.u64("end_time"),
  ]);

  //phase1 (setup Transaction & send Transaction)
  console.log("Setup Transaction");
  const connection = new Connection(clusterApiUrl("devnet"), "confirmed");

  // Program Address -> smartcontract
  const tokenSaleProgramId = new PublicKey(process.env.CUSTOM_PROGRAM_ID!);

  // Seller keypair
  const sellerKeypair = Keypair.fromSecretKey(
    base58.decode(process.env.SELLER_PRIVATE_KEY!)
  );

  // Seller public key
  const sellerTokenAccountPubkey = new PublicKey(
    process.env.SELLER_TOKEN_ACCOUNT_PUBKEY!
  );

  // Token Address -> Id contract token wukong
  const tokenMintAccountPubkey = new PublicKey(process.env.TOKEN_PUBKEY!);

  const totalSaleTokenAmount = 10 * 10 ** 6 * 10 ** 8; // 100 million

  const idoTokenAccountKeypair = new Keypair();
  const createIdoTokenAccountIx = SystemProgram.createAccount({
    fromPubkey: sellerKeypair.publicKey,
    newAccountPubkey: idoTokenAccountKeypair.publicKey,
    lamports: await connection.getMinimumBalanceForRentExemption(
      AccountLayout.span
    ),
    space: AccountLayout.span,
    programId: TOKEN_PROGRAM_ID,
  });

  const initIdoTokenAccountIx = Token.createInitAccountInstruction(
    TOKEN_PROGRAM_ID,
    tokenMintAccountPubkey,
    idoTokenAccountKeypair.publicKey,
    sellerKeypair.publicKey
  );

  const transferTokenToTempTokenAccountIx = Token.createTransferInstruction(
    TOKEN_PROGRAM_ID,
    sellerTokenAccountPubkey,
    idoTokenAccountKeypair.publicKey,
    sellerKeypair.publicKey,
    [],
    totalSaleTokenAmount
  );

  const tokenSaleProgramAccountKeypair = new Keypair();
  const createTokenSaleProgramAccountIx = SystemProgram.createAccount({
    fromPubkey: sellerKeypair.publicKey,
    newAccountPubkey: tokenSaleProgramAccountKeypair.publicKey,
    lamports: await connection.getMinimumBalanceForRentExemption(
      TokenSaleAccountLayout.span
    ),
    space: TokenSaleAccountLayout.span,
    programId: tokenSaleProgramId,
  });

  let buffer = Buffer.alloc(1000);
  const price = 10000;
  const nowTime = Number((new Date().getTime() / 1000).toFixed(0));
  const startTime = nowTime;
  const endTime = nowTime + 1000000;
  configInstructionLayout.encode(
    {
      variant: 0, // instruction
      total_sale_token: new BN(totalSaleTokenAmount),
      price: new BN(price),
      start_time: new BN(startTime),
      end_time: new BN(endTime),
    },
    buffer
  );

  buffer = buffer.slice(0, configInstructionLayout.getSpan(buffer));

  const idoConfigProgramAccountKeypair = new Keypair();
  const createIdoConfigProgramAccountIx = SystemProgram.createAccount({
    fromPubkey: sellerKeypair.publicKey,
    newAccountPubkey: idoConfigProgramAccountKeypair.publicKey,
    lamports: await connection.getMinimumBalanceForRentExemption(
      TokenSaleAccountLayout.span
    ),
    space: TokenSaleAccountLayout.span,
    programId: tokenSaleProgramId,
  });

  const initTokenSaleProgramIx = new TransactionInstruction({
    programId: tokenSaleProgramId,
    keys: [
      createAccountInfo(sellerKeypair.publicKey, true, false),
      createAccountInfo(idoTokenAccountKeypair.publicKey, false, true),
      createAccountInfo(tokenSaleProgramAccountKeypair.publicKey, false, true),
      createAccountInfo(SYSVAR_RENT_PUBKEY, false, false),
      createAccountInfo(TOKEN_PROGRAM_ID, false, false),
      createAccountInfo(idoConfigProgramAccountKeypair.publicKey, false, true),
    ],
    data: buffer,
  });

  console.log({
    TOKEN_PROGRAM_ID,
    tokenMintAccountPubkey: String(tokenMintAccountPubkey),
    sellerTokenAccountPubkey: String(sellerTokenAccountPubkey),
    idoTokenAccountKeypair: String(idoTokenAccountKeypair.publicKey),
    sellerKeypair: String(sellerKeypair.publicKey),
    tokenSaleProgramAccountKeypair: String(
      tokenSaleProgramAccountKeypair.publicKey
    ),
    initTokenSaleProgramIx,
  });

  //make transaction with several instructions(ix)
  console.log("Send transaction...\n");
  const tx = new Transaction().add(
    createIdoTokenAccountIx,
    initIdoTokenAccountIx,
    transferTokenToTempTokenAccountIx,
    createTokenSaleProgramAccountIx,
    createIdoConfigProgramAccountIx,
    initTokenSaleProgramIx
  );

  await connection.sendTransaction(
    tx,
    [
      sellerKeypair,
      idoTokenAccountKeypair,
      tokenSaleProgramAccountKeypair,
      idoConfigProgramAccountKeypair,
    ],
    {
      skipPreflight: false,
      preflightCommitment: "confirmed",
    }
  );
  //phase1 end

  //wait block update
  await new Promise((resolve) => setTimeout(resolve, 5000));

  //phase2 (check Transaction result is valid)
  await getConfig(tokenSaleProgramAccountKeypair.publicKey, connection);
  await getIdoConfig(idoConfigProgramAccountKeypair.publicKey, connection);
  console.table([
    {
      tokenSaleProgramAccountPubkey:
        tokenSaleProgramAccountKeypair.publicKey.toString(),
    },
  ]);
  console.log(`✨TX successfully finished✨\n`);
  //#phase2 end

  process.env.TOKEN_SALE_PROGRAM_ACCOUNT_PUBKEY =
    tokenSaleProgramAccountKeypair.publicKey.toString();
  process.env.IDO_TOKEN_ACCOUNT_PUBKEY =
    idoTokenAccountKeypair.publicKey.toString();
  process.env.IDO_CONFIG_ACCOUNT_PUBKEY =
    idoConfigProgramAccountKeypair.publicKey.toString();
  updateEnv();
};

transaction();
