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
  const amountOfTokenWantToSale = 10000000;
  const swapSolAmount = 1;
  const swapTokenAmount = 2;

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
    amountOfTokenWantToSale
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

  const initTokenSaleProgramIx = new TransactionInstruction({
    programId: tokenSaleProgramId,
    keys: [
      createAccountInfo(sellerKeypair.publicKey, true, false),
      createAccountInfo(tempTokenAccountKeypair.publicKey, false, true),
      createAccountInfo(tokenSaleProgramAccountKeypair.publicKey, false, true),
      createAccountInfo(SYSVAR_RENT_PUBKEY, false, false),
      createAccountInfo(TOKEN_PROGRAM_ID, false, false),
    ],
    data: Buffer.from(
      Uint8Array.of(
        instruction,
        ...new BN(swapSolAmount).toArray("le", 8),
        ...new BN(swapTokenAmount).toArray("le", 8)
      )
    ),
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

  const encodedTokenSaleProgramAccountData = tokenSaleProgramAccount.data;
  const decodedTokenSaleProgramAccountData = TokenSaleAccountLayout.decode(
    encodedTokenSaleProgramAccountData
  ) as TokenSaleAccountLayoutInterface;

  const expectedTokenSaleProgramAccountData: ExpectedTokenSaleAccountLayoutInterface =
    {
      isInitialized: 1,
      sellerPubkey: sellerKeypair.publicKey,
      tempTokenAccountPubkey: tempTokenAccountKeypair.publicKey,
      swapSolAmount: swapSolAmount,
      swapTokenAmount: swapTokenAmount,
    };

  console.log("Current TokenSaleProgramAccountData");
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

transaction();
