import * as web3 from "@solana/web3.js";
import base58 from "bs58";
import dotenv from "dotenv";
import * as borsh from "@project-serum/borsh";
import { PublicKey } from "@metaplex-foundation/js";
import {
  getAssociatedTokenAddressSync,
  getOrCreateAssociatedTokenAccount,
} from "@solana/spl-token";
import { BN } from "bn.js";
import * as fs from "fs";
dotenv.config();

export const PrizeProgramId = new web3.PublicKey(
  "5Qq8oK3zjfo7VhaQwyVz9BR42365eZP8jhgFxFxcHAaX"
);

export const TokenPubkey = new web3.PublicKey(
  "9cBLFeaq8oNTFnRBPpa8TWC1kWc352UVneQmy4TeuqBD"
);

export const PrizePoolAccount = new web3.PublicKey(
  "eePvPApaUUGBsNwmMDmEKRBHJj2jtXH7wPYaNGHtpih"
);

export function initializeOwnerKeypair(): web3.Keypair {
  const ownerKeypair = web3.Keypair.fromSecretKey(
    base58.decode(process.env.OWNER_PRIVATE_KEY!)
  );
  return ownerKeypair;
}

export function initializeClaimerKeypair(): web3.Keypair {
  // Claimer keypair
  const claimerKeypair = web3.Keypair.fromSecretKey(
    base58.decode(process.env.CLAIMER_PRIVATE_KEY!)
  );
  return claimerKeypair;
}

export function getProgramPda() {
  const [program_pda] = PublicKey.findProgramAddressSync(
    [Buffer.from("claim")],
    PrizeProgramId
  );

  console.log({ program_pda });
  return program_pda;
}

export function getPrizePoolAta() {
  const prizePoolPublic = new web3.PublicKey(
    "5Qq8oK3zjfo7VhaQwyVz9BR42365eZP8jhgFxFxcHAaX"
  );
  const PrizePoolAta = getAssociatedTokenAddressSync(
    TokenPubkey,
    prizePoolPublic
  );
  console.log({ PrizePoolAta });

  return PrizePoolAta;
}

export async function getClaimerPda(claimerPublic: web3.PublicKey) {
  const [pda_claimer] = await web3.PublicKey.findProgramAddress(
    [claimerPublic.toBuffer(), Buffer.from("claim")],
    PrizeProgramId
  );

  console.log("PDA Claimer is:", pda_claimer.toBase58());
  return pda_claimer;
}

export const configInstructionLayout = borsh.struct([
  borsh.u8("variant"),
  borsh.u64("total_prize"),
  borsh.u64("first_prize"),
  borsh.u64("second_prize"),
  borsh.u64("third_prize"),
  borsh.publicKey("first_account"),
  borsh.publicKey("second_account"),
  borsh.publicKey("third_account"),
  borsh.bool("is_first_claimed"),
  borsh.bool("is_second_claimed"),
  borsh.bool("is_third_claimed"),
  borsh.u64("start_time"),
  borsh.u64("end_time"),
]);

export const resetTokenInstructionLayout = borsh.struct([
  borsh.u8("variant"),
  borsh.u64("reset_amount"),
]);

export const getConfig = async (
  signer: web3.PublicKey,
  connection: web3.Connection
) => {
  const customAccount = await connection.getAccountInfo(signer);
  // console.log({ customAccount });
  if (customAccount) {
    const data = configInstructionLayout.decode(
      customAccount ? customAccount.data : null
    );
    const config = {
      total_prize: data["total_prize"].toString(),
      first_prize: data["first_prize"].toString(),
      second_prize: data["second_prize"].toString(),
      third_prize: data["third_prize"].toString(),
      first_account: data["first_account"].toString(),
      second_account: data["second_account"].toString(),
      third_account: data["third_account"].toString(),
      is_first_claimed: data["is_first_claimed"].toString(),
      is_second_claimed: data["is_second_claimed"].toString(),
      is_third_claimed: data["is_third_claimed"].toString(),
      start_time: data["start_time"].toString(),
      end_time: data["end_time"].toString(),
    };
    console.log(config);
    return config;
  }
};
