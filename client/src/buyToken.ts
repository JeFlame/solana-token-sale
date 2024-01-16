import * as dotenv from "dotenv";
dotenv.config();

import {
  clusterApiUrl,
  Connection,
  Keypair,
  LAMPORTS_PER_SOL,
  PublicKey,
  SystemProgram,
  Transaction,
  TransactionInstruction,
} from "@solana/web3.js";
import { createAccountInfo, checkAccountInitialized, getConfig } from "./utils";
import { Token, TOKEN_PROGRAM_ID } from "@solana/spl-token";
import {
  TokenSaleAccountLayoutInterface,
  TokenSaleAccountLayout,
} from "./account";
import base58 = require("bs58");
import * as borsh from "@project-serum/borsh";
import BN = require("bn.js");

const transaction = async () => {
  const buyTokenInstructionLayout = borsh.struct([
    borsh.u8("variant"),
    borsh.u64("sol_amount"),
  ]);

  //phase1 (setup Transaction & send Transaction)
  console.log("Setup Transaction");
  const connection = new Connection(clusterApiUrl("devnet"), "confirmed");
  const tokenSaleProgramId = new PublicKey(process.env.CUSTOM_PROGRAM_ID!);
  const sellerPubkey = new PublicKey(process.env.SELLER_PUBLIC_KEY!);
  const buyerKeypair = Keypair.fromSecretKey(
    base58.decode(process.env.BUYER_PRIVATE_KEY!)
  );

  const tokenPubkey = new PublicKey(process.env.TOKEN_PUBKEY!);
  const tokenSaleProgramAccountPubkey = new PublicKey(
    process.env.TOKEN_SALE_PROGRAM_ACCOUNT_PUBKEY!
  );
  const sellerTokenAccountPubkey = new PublicKey(
    process.env.SELLER_TOKEN_ACCOUNT_PUBKEY!
  );
  const idoTokenAccountPubkey = new PublicKey(
    process.env.IDO_TOKEN_ACCOUNT_PUBKEY!
  );

  ///////// GET CONFIG FROM CONTRACT
  await getConfig(tokenSaleProgramAccountPubkey, connection);
  const tokenSaleProgramAccount = await checkAccountInitialized(
    connection,
    tokenSaleProgramAccountPubkey
  );
  const encodedTokenSaleProgramAccountData = tokenSaleProgramAccount.data;
  const decodedTokenSaleProgramAccountData = TokenSaleAccountLayout.decode(
    encodedTokenSaleProgramAccountData
  ) as TokenSaleAccountLayoutInterface;

  const tokenSaleProgramAccountData = {
    isInitialized: decodedTokenSaleProgramAccountData.isInitialized,
    sellerPubkey: new PublicKey(
      decodedTokenSaleProgramAccountData.sellerPubkey
    ),
    idoTokenAccountPubkey: new PublicKey(
      decodedTokenSaleProgramAccountData.idoTokenAccountPubkey
    ),
    price: decodedTokenSaleProgramAccountData.price,
    startTime: decodedTokenSaleProgramAccountData.startTime,
    endTime: decodedTokenSaleProgramAccountData.endTime,
  };

  const token = new Token(
    connection,
    tokenPubkey,
    TOKEN_PROGRAM_ID,
    buyerKeypair
  );
  const buyerTokenAccount = await token.getOrCreateAssociatedAccountInfo(
    buyerKeypair.publicKey
  );

  const PDA = await PublicKey.findProgramAddress(
    [Buffer.from("token_sale")],
    tokenSaleProgramId
  );

  let buffer = Buffer.alloc(1000);
  buyTokenInstructionLayout.encode(
    {
      variant: 1, // instruction
      sol_amount: new BN(0.0123 * 10 ** 9),
    },
    buffer
  );

  buffer = buffer.slice(0, buyTokenInstructionLayout.getSpan(buffer));

  const buyTokenIx = new TransactionInstruction({
    programId: tokenSaleProgramId,
    keys: [
      createAccountInfo(buyerKeypair.publicKey, true, true),
      createAccountInfo(tokenSaleProgramAccountData.sellerPubkey, false, true),
      createAccountInfo(
        tokenSaleProgramAccountData.idoTokenAccountPubkey,
        false,
        true
      ),
      createAccountInfo(tokenSaleProgramAccountPubkey, false, false),
      createAccountInfo(SystemProgram.programId, false, false),
      createAccountInfo(buyerTokenAccount.address, false, true),
      createAccountInfo(TOKEN_PROGRAM_ID, false, false),
      createAccountInfo(PDA[0], false, false),
    ],
    data: buffer,
  });
  const tx = new Transaction().add(buyTokenIx);

  await connection.sendTransaction(tx, [buyerKeypair], {
    skipPreflight: false,
    preflightCommitment: "confirmed",
  });
  //phase1 end

  //wait block update
  await new Promise((resolve) => setTimeout(resolve, 1000));

  //phase2 (check token sale)
  const sellerTokenAccountBalance = await connection.getTokenAccountBalance(
    sellerTokenAccountPubkey
  );
  const idoTokenAccountBalance = await connection.getTokenAccountBalance(
    idoTokenAccountPubkey
  );
  const buyerTokenAccountBalance = await connection.getTokenAccountBalance(
    buyerTokenAccount.address
  );

  console.table([
    {
      sellerTokenAccountBalance:
        sellerTokenAccountBalance.value.amount.toString(),
      idoTokenAccountBalance: idoTokenAccountBalance.value.amount.toString(),
      buyerTokenAccountBalance:
        buyerTokenAccountBalance.value.amount.toString(),
    },
  ]);

  const sellerSOLBalance = await connection.getBalance(
    sellerPubkey,
    "confirmed"
  );
  const buyerSOLBalance = await connection.getBalance(
    buyerKeypair.publicKey,
    "confirmed"
  );

  console.table([
    {
      sellerSOLBalance: sellerSOLBalance / LAMPORTS_PER_SOL,
      buyerSOLBalance: buyerSOLBalance / LAMPORTS_PER_SOL,
    },
  ]);

  console.log(`✨TX successfully finished✨\n`);
  //#phase2 end
};

transaction();
