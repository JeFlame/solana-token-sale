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
import {
  createAccountInfo,
  checkAccountInitialized,
  getConfig,
  getIdoConfig,
} from "./utils";
import {
  createAssociatedTokenAccount,
  createAssociatedTokenAccountInstruction,
  createTransferInstruction,
  getAssociatedTokenAddressSync,
  getMinimumBalanceForRentExemptMint,
  getOrCreateAssociatedTokenAccount,
  MINT_SIZE,
  TOKEN_PROGRAM_ID,
} from "@solana/spl-token";
import {
  TokenSaleAccountLayoutInterface,
  TokenSaleAccountLayout,
} from "./account";
import base58 = require("bs58");
import * as borsh from "@project-serum/borsh";
import BN = require("bn.js");

const DECIMAL = 9;

const transaction = async () => {
  const buyTokenInstructionLayout = borsh.struct([
    borsh.u8("variant"),
    borsh.u64("sol_amount"),
  ]);

  //phase1 (setup Transaction & send Transaction)
  console.log(clusterApiUrl("devnet"));
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
  const idoConfigAccountPubkey = new PublicKey(
    process.env.IDO_CONFIG_ACCOUNT_PUBKEY!
  );

  const prizePoolPublickey = new PublicKey(
    "2XNCcbF4UXbAQY6pDmHU4b6redJ9xiVMUr6EGh8PiadR"
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

  console.log(
    tokenSaleProgramAccountData.idoTokenAccountPubkey,
    idoTokenAccountPubkey
  );

  const PDA = PublicKey.findProgramAddressSync(
    [Buffer.from("token_sale")],
    tokenSaleProgramId
  );

  let buffer = Buffer.alloc(1000);
  buyTokenInstructionLayout.encode(
    {
      variant: 1, // instruction
      sol_amount: new BN(100 * 10 ** 9),
    },
    buffer
  );

  buffer = buffer.slice(0, buyTokenInstructionLayout.getSpan(buffer));

  const tx = new Transaction();

  const buyerAta = getAssociatedTokenAddressSync(
    tokenPubkey,
    buyerKeypair.publicKey
  );
  console.log({ buyerAta });
  const ataAccount = await connection.getAccountInfo(buyerAta);
  console.log({ ataAccount });
  if (!ataAccount) {
    await getOrCreateAssociatedTokenAccount(
      connection,
      buyerKeypair,
      tokenPubkey,
      buyerKeypair.publicKey,
      true
    );
  }

  const prizePoolAta = getAssociatedTokenAddressSync(
    tokenPubkey,
    prizePoolPublickey
  );
  console.log({ prizePoolAta });

  const buyTokenIx = new TransactionInstruction({
    programId: tokenSaleProgramId,
    keys: [
      //account 1: buyer keypair
      createAccountInfo(buyerKeypair.publicKey, true, true),

      // account 2 : seller public key
      createAccountInfo(sellerPubkey, false, true),

      // account 3 : The account is the token address on smartcontract
      createAccountInfo(idoTokenAccountPubkey, false, true),

      // account 4 : The account contains the token sale config
      createAccountInfo(tokenSaleProgramAccountPubkey, false, false),

      // account 5 : system progran id
      createAccountInfo(SystemProgram.programId, false, false),

      // account 6 :  The account is received token from smartcontract
      createAccountInfo(buyerAta, false, true),

      // account 7 : token program id
      createAccountInfo(TOKEN_PROGRAM_ID, false, false),

      // account 8 : address contain token on contract
      createAccountInfo(PDA[0], false, false),

      //account 9: The account is the prize pool address
      createAccountInfo(prizePoolPublickey, false, true),

      //account 10: The account is the prize pool address
      createAccountInfo(prizePoolAta, false, true),

      // account 11 :  The account contains the info token sale config.
      createAccountInfo(idoConfigAccountPubkey, false, true),
    ],
    data: buffer,
  });

  tx.add(buyTokenIx);

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
    buyerAta
  );

  console.table([
    {
      sellerTokenAccountBalance:
        +sellerTokenAccountBalance.value.amount.toString() / LAMPORTS_PER_SOL,
      idoTokenAccountBalance:
        +idoTokenAccountBalance.value.amount.toString() / LAMPORTS_PER_SOL,
      buyerTokenAccountBalance:
        +buyerTokenAccountBalance.value.amount.toString() / LAMPORTS_PER_SOL,
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

  await getIdoConfig(idoConfigAccountPubkey, connection);

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
