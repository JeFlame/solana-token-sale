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
import {
  checkAccountInitialized,
  checkAccountDataIsValid,
  createAccountInfo,
  updateEnv,
} from "./utils";

import {
  TokenSaleAccountLayout,
  TokenSaleAccountLayoutInterface,
  ExpectedTokenSaleAccountLayoutInterface,
} from "./account";
import { AccountLayout, Token, TOKEN_PROGRAM_ID } from "@solana/spl-token";
import base58 = require("bs58");

type InstructionNumber = 0 | 1 | 2;

const transaction = async () => {
  const configInstructionLayout = borsh.struct([
    borsh.u8("variant"),
    borsh.u64("total_sale_token_amount"),
    borsh.u64("price"),
    borsh.u64("start_time"),
    borsh.u64("end_time"),
  ]);

  //phase1 (setup Transaction & send Transaction)
  console.log("Setup Transaction");
  const connection = new Connection(clusterApiUrl("devnet"), "confirmed");
  const tokenSaleProgramId = new PublicKey(process.env.CUSTOM_PROGRAM_ID!);
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
  const tokenMintAccountPubkey = new PublicKey(process.env.TOKEN_PUBKEY!);
  const sellerTokenAccountPubkey = new PublicKey(
    process.env.SELLER_TOKEN_ACCOUNT_PUBKEY!
  );

  const instruction: InstructionNumber = 0;
  const totalSaleTokenAmount = 150000 * 10 ** 8;

  const tempTokenAccountKeypair = new Keypair();
  const createTempTokenAccountIx = SystemProgram.createAccount({
    fromPubkey: sellerKeypair.publicKey,
    newAccountPubkey: tempTokenAccountKeypair.publicKey,
    lamports: await connection.getMinimumBalanceForRentExemption(
      AccountLayout.span
    ),
    space: AccountLayout.span,
    programId: TOKEN_PROGRAM_ID,
  });

  const initTempTokenAccountIx = Token.createInitAccountInstruction(
    TOKEN_PROGRAM_ID,
    tokenMintAccountPubkey,
    tempTokenAccountKeypair.publicKey,
    sellerKeypair.publicKey
  );

  const transferTokenToTempTokenAccountIx = Token.createTransferInstruction(
    TOKEN_PROGRAM_ID,
    sellerTokenAccountPubkey,
    tempTokenAccountKeypair.publicKey,
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
  const price = 1500;
  const nowTime = Number((new Date().getTime() / 1000).toFixed(0));
  const startTime = nowTime;
  const endTime = nowTime + 1000000;
  configInstructionLayout.encode(
    {
      variant: 0,
      total_sale_token_amount: new BN(totalSaleTokenAmount),
      price: new BN(price),
      start_time: new BN(startTime),
      end_time: new BN(endTime),
    },
    buffer
  );

  buffer = buffer.slice(0, configInstructionLayout.getSpan(buffer));
  const initTokenSaleProgramIx = new TransactionInstruction({
    programId: tokenSaleProgramId,
    keys: [
      createAccountInfo(sellerKeypair.publicKey, true, false),
      createAccountInfo(tempTokenAccountKeypair.publicKey, false, true),
      createAccountInfo(tokenSaleProgramAccountKeypair.publicKey, false, true),
      createAccountInfo(SYSVAR_RENT_PUBKEY, false, false),
      createAccountInfo(TOKEN_PROGRAM_ID, false, false),
    ],
    data: buffer,
  });

  console.log({
    TOKEN_PROGRAM_ID,
    tokenMintAccountPubkey: String(tokenMintAccountPubkey),
    sellerTokenAccountPubkey: String(sellerTokenAccountPubkey),
    tempTokenAccountKeypair: String(tempTokenAccountKeypair.publicKey),
    sellerKeypair: String(sellerKeypair.publicKey),
    tokenSaleProgramAccountKeypair: String(
      tokenSaleProgramAccountKeypair.publicKey
    ),
    initTokenSaleProgramIx,
  });

  //make transaction with several instructions(ix)
  console.log("Send transaction...\n");
  const tx = new Transaction().add(
    createTempTokenAccountIx,
    initTempTokenAccountIx,
    transferTokenToTempTokenAccountIx,
    createTokenSaleProgramAccountIx,
    initTokenSaleProgramIx
  );

  await connection.sendTransaction(
    tx,
    [sellerKeypair, tempTokenAccountKeypair, tokenSaleProgramAccountKeypair],
    {
      skipPreflight: false,
      preflightCommitment: "confirmed",
    }
  );
  //phase1 end

  //wait block update
  await new Promise((resolve) => setTimeout(resolve, 5000));

  //phase2 (check Transaction result is valid)
  const tokenSaleProgramAccount = await checkAccountInitialized(
    connection,
    tokenSaleProgramAccountKeypair.publicKey
  );

  await getConfig(tokenSaleProgramAccountKeypair.publicKey, connection);
  const encodedTokenSaleProgramAccountData = tokenSaleProgramAccount.data;
  const decodedTokenSaleProgramAccountData = TokenSaleAccountLayout.decode(
    encodedTokenSaleProgramAccountData
  ) as TokenSaleAccountLayoutInterface;

  const expectedTokenSaleProgramAccountData: ExpectedTokenSaleAccountLayoutInterface =
    {
      isInitialized: 1,
      sellerPubkey: sellerKeypair.publicKey,
      tempTokenAccountPubkey: tempTokenAccountKeypair.publicKey,
      totalSaleTokenAmount: totalSaleTokenAmount,
      price: price,
      startTime: startTime,
      endTime: endTime,
    };

  console.log("Current TokenSaleProgramAccountData:");
  checkAccountDataIsValid(
    decodedTokenSaleProgramAccountData,
    expectedTokenSaleProgramAccountData
  );

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
  process.env.TEMP_TOKEN_ACCOUNT_PUBKEY =
    tempTokenAccountKeypair.publicKey.toString();
  updateEnv();
};

async function getConfig(signer: PublicKey, connection: Connection) {
  const borshConfigSchema = borsh.struct([
    borsh.bool("is_initialized"),
    borsh.publicKey("seller_pubkey"),
    borsh.publicKey("temp_token_account_pubkey"),
    borsh.u64("total_sale_token_amount"),
    borsh.u64("price"),
    borsh.u64("start_time"),
    borsh.u64("end_time"),
  ]);

  const customAccount = await connection.getAccountInfo(signer);
  console.log({ customAccount });
  if (customAccount) {
    const data = borshConfigSchema.decode(
      customAccount ? customAccount.data : null
    );
    console.log({
      seller_pubkey: data["seller_pubkey"].toString(),
      temp_token_account_pubkey: data["temp_token_account_pubkey"].toString(),
      total_sale_token: data["total_sale_token_amount"].toString(),
      price: data["price"].toString(),
      start_time: data["start_time"].toString(),
      end_time: data["end_time"].toString(),
    });
  }
}

transaction();
