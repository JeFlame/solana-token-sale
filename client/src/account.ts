import { PublicKey } from "@solana/web3.js";

//@ts-expect-error missing types
import * as BufferLayout from "buffer-layout";

export const TokenSaleAccountLayout = BufferLayout.struct([
  BufferLayout.u8("isInitialized"), //1byte
  BufferLayout.blob(32, "sellerPubkey"), //pubkey(32byte)
  BufferLayout.blob(32, "tempTokenAccountPubkey"), //pubkey(32byte)
  BufferLayout.blob(8, "totalSaleTokenAmount"), //8byte
  BufferLayout.blob(8, "price"), //8byte
  BufferLayout.blob(8, "startTime"), //8byte
  BufferLayout.blob(8, "endTime"), //8byte
]);

export interface TokenSaleAccountLayoutInterface {
  [index: string]: number | Uint8Array;
  isInitialized: number;
  sellerPubkey: Uint8Array;
  tempTokenAccountPubkey: Uint8Array;
  totalSaleTokenAmount: Uint8Array;
  price: Uint8Array;
  startTime: Uint8Array;
  endTime: Uint8Array;
}

export interface ExpectedTokenSaleAccountLayoutInterface {
  [index: string]: number | PublicKey;
  isInitialized: number;
  sellerPubkey: PublicKey;
  tempTokenAccountPubkey: PublicKey;
  totalSaleTokenAmount: number;
  price: number;
  startTime: number;
  endTime: number;
}
