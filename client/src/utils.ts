import { Connection, Keypair, PublicKey } from "@solana/web3.js";
import {
  TokenSaleAccountLayoutInterface,
  ExpectedTokenSaleAccountLayoutInterface,
} from "./account";
import BN = require("bn.js");
import fs = require("fs");
import * as borsh from "@project-serum/borsh";

const envItems = [
  "CUSTOM_PROGRAM_ID",
  "SELLER_PUBLIC_KEY",
  "SELLER_PRIVATE_KEY",
  "BUYER_PUBLIC_KEY",
  "BUYER_PRIVATE_KEY",
  "TOKEN_PUBKEY",
  "SELLER_TOKEN_ACCOUNT_PUBKEY",
  "IDO_TOKEN_ACCOUNT_PUBKEY",
  "TOKEN_SALE_PROGRAM_ACCOUNT_PUBKEY",
];

export function updateEnv() {
  const eol = "\n";
  const envContents = envItems
    .map((item) => `${item}=${process.env[item]}`)
    .join(eol);
  fs.writeFileSync(".env", envContents);
}

export const getKeypair = (publicKey: string, privateKey: Uint8Array) =>
  new Keypair({
    publicKey: new PublicKey(publicKey).toBytes(),
    secretKey: privateKey,
  });

export const getTokenBalance = async (
  pubkey: PublicKey,
  connection: Connection
) => {
  return parseInt(
    (await connection.getTokenAccountBalance(pubkey)).value.amount
  );
};

export const createAccountInfo = (
  pubkey: PublicKey,
  isSigner: boolean,
  isWritable: boolean
) => {
  return {
    pubkey: pubkey,
    isSigner: isSigner,
    isWritable: isWritable,
  };
};

export const getConfig = async (signer: PublicKey, connection: Connection) => {
  const borshConfigSchema = borsh.struct([
    borsh.bool("is_initialized"),
    borsh.publicKey("seller_pubkey"),
    borsh.publicKey("ido_token_account_pubkey"),
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
    const config = {
      seller_pubkey: data["seller_pubkey"].toString(),
      ido_token_account_pubkey: data["ido_token_account_pubkey"].toString(),
      total_sale_token: data["total_sale_token_amount"].toString(),
      price: data["price"].toString(),
      start_time: data["start_time"].toString(),
      end_time: data["end_time"].toString(),
    };
    console.log(config);
    return config;
  }
};

export const checkAccountInitialized = async (
  connection: Connection,
  customAccountPubkey: PublicKey
) => {
  const customAccount = await connection.getAccountInfo(customAccountPubkey);

  if (customAccount === null || customAccount.data.length === 0) {
    console.log("Account of custom program has not been initialized properly");
    process.exit(1);
  }

  return customAccount;
};

export const checkAccountDataIsValid = (
  customAccountData: TokenSaleAccountLayoutInterface,
  expectedCustomAccountState: ExpectedTokenSaleAccountLayoutInterface
) => {
  const keysOfAccountData = Object.keys(customAccountData);
  const data: { [char: string]: string } = {};

  keysOfAccountData.forEach((key) => {
    const value = customAccountData[key];
    const expectedValue = expectedCustomAccountState[key];

    //PublicKey
    if (value instanceof Uint8Array && expectedValue instanceof PublicKey) {
      if (!new PublicKey(value).equals(expectedValue)) {
        console.log(`${key} is not matched expected one`);
        process.exit(1);
      }
    } else if (
      value instanceof Uint8Array &&
      typeof expectedValue === "number"
    ) {
      //value is undefined
      if (!value) {
        console.log(`${key} flag has not been set`);
        process.exit(1);
      }

      //value is not matched expected one.
      const isBufferSame = Buffer.compare(
        value,
        Buffer.from(new BN(expectedValue).toArray("le", value.length))
      );

      if (isBufferSame !== 0) {
        console.log(
          `[${key}] : expected value is ${expectedValue}, but current value is ${value}`
        );
        process.exit(1);
      }
    }

    data[key] = expectedValue.toString();
  });
  console.table([data]);
};
