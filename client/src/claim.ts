import * as web3 from "@solana/web3.js";
import * as borsh from "@project-serum/borsh";
import * as fs from "fs";
import base58 from "bs58";
import dotenv from "dotenv";
import { BN } from "bn.js";
dotenv.config();
import {
  AccountLayout,
  TOKEN_PROGRAM_ID,
  createInitializeAccountInstruction,
  getAssociatedTokenAddressSync,
  getOrCreateAssociatedTokenAccount,
} from "@solana/spl-token";
import { TokenPubkey, getProgramPda, getClaimerPda, initializeClaimerKeypair, getPrizePoolAta, initializeOwnerKeypair, configInstructionLayout, getConfig, PrizeProgramId, PrizePoolAccount } from "./util";

async function initContract(owner: web3.Keypair, connection: web3.Connection) {
  const PrizePoolAccountKeypair = new web3.Keypair();

  const createPrizePoolTokenAccountIx = web3.SystemProgram.createAccount({
    fromPubkey: owner.publicKey,
    newAccountPubkey: PrizePoolAccountKeypair.publicKey,
    lamports: await connection.getMinimumBalanceForRentExemption(
      AccountLayout.span
    ),
    space: AccountLayout.span,
    programId: TOKEN_PROGRAM_ID,
  });

  const ProgramPda = getProgramPda();

  const initPrizePoolTokenAccountIx = createInitializeAccountInstruction(
    PrizePoolAccountKeypair.publicKey,
    TokenPubkey,
    ProgramPda
  );

  const tx = new web3.Transaction().add(
    createPrizePoolTokenAccountIx,
    initPrizePoolTokenAccountIx
  );

  await connection.sendTransaction(tx, [owner, PrizePoolAccountKeypair], {
    skipPreflight: false,
    preflightCommitment: "confirmed",
  });

  console.log(PrizePoolAccountKeypair.publicKey);
}

async function claim(
  claimer: web3.Keypair,
  programId: web3.PublicKey,
  connection: web3.Connection
) {
  let claimBuffer = Buffer.alloc(1000);
  configInstructionLayout.encode(
    {
      variant: 2,
    },
    claimBuffer
  );
  const ownerPublicKey = new web3.PublicKey(
    "FJb9VqxEXEfiM2JNjqLYJqHDYejR2iCGbXGsQztWgAtv"
  );
  const [ownerPda] = await web3.PublicKey.findProgramAddress(
    [ownerPublicKey.toBuffer(), Buffer.from("set-config-prize")],
    programId
  );
  console.log("PDA Owner is:", ownerPda.toBase58());

  claimBuffer = claimBuffer.slice(
    0,
    configInstructionLayout.getSpan(claimBuffer)
  );
  
  const claimerPda = await getClaimerPda(claimer.publicKey);
  console.log("PDA Claimer is:", claimerPda.toBase58());

  const claimerAta = getAssociatedTokenAddressSync(
    TokenPubkey,
    claimer.publicKey
  );
  console.log('claimerAta', claimerAta);
  const ataClaimerAccount = await connection.getAccountInfo(claimerAta);
  console.log('ataClaimerAccount', ataClaimerAccount);
  if (!ataClaimerAccount) {
    await getOrCreateAssociatedTokenAccount(
      connection,
      claimer,
      TokenPubkey,
      claimer.publicKey
    );
  }
  
  const ProgramPDA = getProgramPda();
  // console.log({ ProgramPDA });

  const transaction = new web3.Transaction();
  const claimInstruction = new web3.TransactionInstruction({
    programId: programId,
    data: claimBuffer,
    keys: [
      {
        pubkey: ownerPublicKey,
        isSigner: false,
        isWritable: false,
      },
      {
        pubkey: ownerPda,
        isSigner: false,
        isWritable: true,
      },
      {
        pubkey: claimer.publicKey,
        isSigner: true,
        isWritable: false,
      },
      {
        pubkey: claimerPda,
        isSigner: false,
        isWritable: true,
      },
      {
        pubkey: claimerAta,
        isSigner: false,
        isWritable: true,
      },
      {
        pubkey: web3.SystemProgram.programId,
        isSigner: false,
        isWritable: true,
      },
      {
        pubkey: TOKEN_PROGRAM_ID,
        isSigner: false,
        isWritable: false,
      },
      {
        pubkey: ProgramPDA,
        isSigner: false,
        isWritable: true,
      },
      {
        pubkey: PrizePoolAccount,
        isSigner: false,
        isWritable: true,
      },
    ],
  });
  transaction.add(claimInstruction);

  const tx = await web3.sendAndConfirmTransaction(connection, transaction, [
    claimer,
  ]);
  console.log(`https://explorer.solana.com/tx/${tx}?cluster=devnet`);
}

async function main() {
  console.log('connection');
  const connection = new web3.Connection(web3.clusterApiUrl("devnet"));

  // const owner = initializeOwnerKeypair();
  // await initContract(owner, connection);
  
  const claimer = initializeClaimerKeypair();
  await claim(claimer, PrizeProgramId, connection);

  // const PDAPublicKey = await getClaimerPda(claimer.publicKey);
  // await getConfig(PDAPublicKey, connection);
}

main()
  .then(() => {
    console.log("Finished successfully");
    process.exit(0);
  })
  .catch((error) => {
    console.log(error);
    process.exit(1);
  });
