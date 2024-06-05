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

const transaction = async () => {
  const stakeTokenInstructionLayout = borsh.struct([
    borsh.u8("variant"),
    borsh.u64("sol_amount"),
  ]);

  //phase1 (setup Transaction & send Transaction)
  console.log("Setup Transaction");
  const connection = new Connection(clusterApiUrl("devnet"), "confirmed");

  const tokenSaleProgramId = new PublicKey(process.env.CUSTOM_PROGRAM_ID!);

  const stakerKeypair = Keypair.fromSecretKey(
    base58.decode(process.env.STAKER_PRIVATE_KEY!)
  );

  const tokenPubkey = new PublicKey(process.env.TOKEN_PUBKEY!);
  const tokenSaleProgramAccountPubkey = new PublicKey(
    process.env.TOKEN_SALE_PROGRAM_ACCOUNT_PUBKEY!
  );

  const idoTokenAccountPubkey = new PublicKey(
    process.env.IDO_TOKEN_ACCOUNT_PUBKEY!
  );
  // const idoConfigAccountPubkey = new PublicKey(
  //   process.env.IDO_CONFIG_ACCOUNT_PUBKEY!
  // );

  console.log(111111111111);

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
    poolPubkey: new PublicKey(
      decodedTokenSaleProgramAccountData.sellerPubkey
    ),
    idoTokenAccountPubkey: new PublicKey(
      decodedTokenSaleProgramAccountData.idoTokenAccountPubkey
    ),
    price: decodedTokenSaleProgramAccountData.price,
    startTime: decodedTokenSaleProgramAccountData.startTime,
    endTime: decodedTokenSaleProgramAccountData.endTime,
  };

  console.log(2222222222222222);

  const PDA = PublicKey.findProgramAddressSync(
    [Buffer.from("token_sale")],
    tokenSaleProgramId
  );

  let buffer = Buffer.alloc(1000);
  stakeTokenInstructionLayout.encode(
    {
      variant: 3, // instruction
      sol_amount: new BN(1000 * 10 ** 9),
    },
    buffer
  );

  buffer = buffer.slice(0, stakeTokenInstructionLayout.getSpan(buffer));

  const tx = new Transaction();

  const stakerAta = getAssociatedTokenAddressSync(
    tokenPubkey,
    stakerKeypair.publicKey
  );
  console.log('stakerAta', stakerAta);

  const ataAccount = await connection.getAccountInfo(stakerAta);
  console.log('ataAccount', ataAccount);

  if (!ataAccount) {
    await getOrCreateAssociatedTokenAccount(
      connection,
      stakerKeypair,
      tokenPubkey,
      stakerKeypair.publicKey
    );
  }

  const prizePoolPublickey = new PublicKey(
    "H82m8AD5ggVMW4Z8NrTgtNX1uvuR6zCJ2pEW9yCGkp9b"
  );
  const prizePoolAta = getAssociatedTokenAddressSync(
    tokenPubkey,
    prizePoolPublickey
  );

  console.log(prizePoolAta);

  console.log(55555555555555);

  const stakeTokenIx = new TransactionInstruction({
    programId: tokenSaleProgramId,
    keys: [
      //account 1
      createAccountInfo(stakerKeypair.publicKey, true, true),
      // account 2
      createAccountInfo(
        tokenSaleProgramAccountData.idoTokenAccountPubkey,
        false,
        true
      ),
      // account 2
      createAccountInfo(tokenSaleProgramAccountPubkey, false, false),
      // account 4
      createAccountInfo(stakerAta, false, true),
      // account 5
      createAccountInfo(TOKEN_PROGRAM_ID, false, false),
      //account 6
      createAccountInfo(prizePoolAta, false, true),
      // account 7
      createAccountInfo(PDA[0], false, false),
      // account 8
      // createAccountInfo(idoConfigAccountPubkey, false, true),
    ],
    data: buffer,
  });
  console.log('stakeTokenIx', stakeTokenIx);

  tx.add(stakeTokenIx);
  await connection.sendTransaction(tx, [stakerKeypair], {
    skipPreflight: false,
    preflightCommitment: "confirmed",
  });
  //phase1 end

  //wait block update
  await new Promise((resolve) => setTimeout(resolve, 1000));

  //phase2 (check token sale)
  const idoTokenAccountBalance = await connection.getTokenAccountBalance(
    idoTokenAccountPubkey
  );
  const stakerTokenAccountBalance = await connection.getTokenAccountBalance(
    stakerAta
  );

  console.table([
    {
      idoTokenAccountBalance:
        +idoTokenAccountBalance.value.amount.toString() / LAMPORTS_PER_SOL,
      stakerTokenAccountBalance:
        +stakerTokenAccountBalance.value.amount.toString() / LAMPORTS_PER_SOL,
    },
  ]);

  const stakerSOLBalance = await connection.getBalance(
    stakerKeypair.publicKey,
    "confirmed"
  );

  // await getIdoConfig(idoConfigAccountPubkey, connection);

  console.table([
    {
      stakerSOLBalance: stakerSOLBalance / LAMPORTS_PER_SOL,
    },
  ]);

  console.log(`✨TX successfully finished✨\n`);
  //#phase2 end
};

transaction();
