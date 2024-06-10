import * as web3 from "@solana/web3.js";
import * as borsh from "@project-serum/borsh";
import * as fs from "fs";
import base58 from "bs58";
import dotenv from "dotenv";
import { BN } from "bn.js";
dotenv.config();
import {
  TOKEN_PROGRAM_ID,
  getAssociatedTokenAddressSync,
  getOrCreateAssociatedTokenAccount,
} from "@solana/spl-token";
import {
  getProgramPda,
  PrizeProgramId,
  PrizePoolAccount,
  resetTokenInstructionLayout,
  initializeOwnerKeypair,
  getPrizePoolAta,
  TokenPubkey,
} from "./util";
import { PublicKey } from "@metaplex-foundation/js";

async function resetToken(
  initializer: web3.Keypair,
  programId: web3.PublicKey,
  connection: web3.Connection
) {
  let resetTokenBuffer = Buffer.alloc(1000);
  resetTokenInstructionLayout.encode(
    {
      variant: 4,
      reset_amount: new BN(998 * 10 ** 9),
    },
    resetTokenBuffer
  );
  const [ownerPda] = await web3.PublicKey.findProgramAddress(
    [initializer.publicKey.toBuffer(), Buffer.from("set-config-prize")],
    programId
  );
  console.log("PDA Owner is:", ownerPda.toBase58());

  resetTokenBuffer = resetTokenBuffer.slice(
    0,
    resetTokenInstructionLayout.getSpan(resetTokenBuffer)
  );

  const resetAccountPublic = new web3.PublicKey(
    "9awnhANDAD7CajDNxvzK5MzGfwXLK7f1JHzBnknXrz3p"
  );
  const ResetAccountAta = getAssociatedTokenAddressSync(
    TokenPubkey,
    resetAccountPublic
  );
  const ataResetAccount = await connection.getAccountInfo(ResetAccountAta);
  console.log({ ataResetAccount });
  if (!ataResetAccount) {
    await getOrCreateAssociatedTokenAccount(
      connection,
      initializer,
      TokenPubkey,
      resetAccountPublic
    );
  }

  const ProgramPDA = getProgramPda();
  // console.log({ ProgramPDA });

  const prizePoolAta = getPrizePoolAta();
  console.log({ prizePoolAta });

  const transaction = new web3.Transaction();
  const resetTokenInstruction = new web3.TransactionInstruction({
    programId: programId,
    data: resetTokenBuffer,
    keys: [
      {
        pubkey: initializer.publicKey,
        isSigner: true,
        isWritable: true,
      },
      {
        pubkey: ResetAccountAta,
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
  transaction.add(resetTokenInstruction);

  const tx = await web3.sendAndConfirmTransaction(connection, transaction, [
    initializer,
  ]);
  console.log(`https://explorer.solana.com/tx/${tx}?cluster=devnet`);
}

async function main() {
  console.log("connection");
  const connection = new web3.Connection(web3.clusterApiUrl("devnet"));

  const owner = initializeOwnerKeypair();

  await resetToken(owner, PrizeProgramId, connection);
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
