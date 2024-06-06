"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
exports.__esModule = true;
var spl_token_1 = require("@solana/spl-token");
var web3_js_1 = require("@solana/web3.js");
var mpl_token_metadata_1 = require("@metaplex-foundation/mpl-token-metadata");
var utils_1 = require("./utils");
var dotenv = require("dotenv");
var bs58 = require("bs58");
dotenv.config();
var transaction = function () { return __awaiter(void 0, void 0, void 0, function () {
    var motherWallet, decimal, supply, name, symbol, uri, mintKeypair, connection, mint_rent, metadataPDA, tokenATA, tokenMetadata, createNewTokenTransaction, result;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                motherWallet = web3_js_1.Keypair.fromSecretKey(bs58.decode(process.env.SELLER_PRIVATE_KEY));
                decimal = 9;
                supply = 1 * Math.pow(10, 9);
                name = "Wukong";
                symbol = "WUKONG";
                uri = "https://arweave.net/-0ye6AB8I9sWqWF5Zq0iSOrHELvd2D0Ik1NEkiHU49I";
                mintKeypair = web3_js_1.Keypair.generate();
                connection = new web3_js_1.Connection((0, web3_js_1.clusterApiUrl)("devnet"), {
                    commitment: "confirmed",
                    confirmTransactionInitialTimeout: 9000000
                });
                console.log("Mother wallet address: ", motherWallet.publicKey.toBase58());
                return [4 /*yield*/, (0, spl_token_1.getMinimumBalanceForRentExemptMint)(connection)];
            case 1:
                mint_rent = _a.sent();
                metadataPDA = web3_js_1.PublicKey.findProgramAddressSync([
                    Buffer.from("metadata"),
                    mpl_token_metadata_1.PROGRAM_ID.toBuffer(),
                    mintKeypair.publicKey.toBuffer(),
                ], mpl_token_metadata_1.PROGRAM_ID)[0];
                return [4 /*yield*/, (0, spl_token_1.getAssociatedTokenAddress)(mintKeypair.publicKey, motherWallet.publicKey)];
            case 2:
                tokenATA = _a.sent();
                tokenMetadata = {
                    name: name,
                    symbol: symbol,
                    uri: uri,
                    sellerFeeBasisPoints: 0,
                    creators: null,
                    collection: null,
                    uses: null
                };
                createNewTokenTransaction = new web3_js_1.Transaction().add(
                // Create pda account for mint address for save data
                web3_js_1.SystemProgram.createAccount({
                    fromPubkey: motherWallet.publicKey,
                    newAccountPubkey: mintKeypair.publicKey,
                    space: spl_token_1.MINT_SIZE,
                    lamports: mint_rent,
                    programId: spl_token_1.TOKEN_PROGRAM_ID
                }), (0, spl_token_1.createInitializeMint2Instruction)(mintKeypair.publicKey, decimal, motherWallet.publicKey, motherWallet.publicKey, spl_token_1.TOKEN_PROGRAM_ID), (0, spl_token_1.createAssociatedTokenAccountInstruction)(motherWallet.publicKey, tokenATA, motherWallet.publicKey, mintKeypair.publicKey), (0, spl_token_1.createMintToInstruction)(mintKeypair.publicKey, tokenATA, motherWallet.publicKey, supply * Math.pow(10, decimal)), (0, mpl_token_metadata_1.createCreateMetadataAccountV3Instruction)({
                    metadata: metadataPDA,
                    mint: mintKeypair.publicKey,
                    mintAuthority: motherWallet.publicKey,
                    payer: motherWallet.publicKey,
                    updateAuthority: motherWallet.publicKey
                }, {
                    createMetadataAccountArgsV3: {
                        data: tokenMetadata,
                        isMutable: true,
                        //   collectionDetails: { __kind: "V1" },
                        collectionDetails: { __kind: "V1", size: 0 }
                    }
                }), (0, spl_token_1.createSetAuthorityInstruction)(mintKeypair.publicKey, motherWallet.publicKey, spl_token_1.AuthorityType.MintTokens, null)
                // createBurnInstruction(
                //   mintKeypair.publicKey,
                //   motherWallet.publicKey,
                //   motherWallet.publicKey,
                //   33 * Math.pow(10, decimal)
                // )
                );
                return [4 /*yield*/, (0, web3_js_1.sendAndConfirmTransaction)(connection, createNewTokenTransaction, [motherWallet, mintKeypair])];
            case 3:
                result = _a.sent();
                console.log("Token address: ", mintKeypair.publicKey.toBase58());
                console.log("Transaction hash:", result);
                console.log("\u2728TX successfully finished\u2728\n");
                process.env.SELLER_TOKEN_ACCOUNT_PUBKEY = tokenATA.toString();
                process.env.TOKEN_PUBKEY = mintKeypair.publicKey.toBase58();
                (0, utils_1.updateEnv)();
                return [2 /*return*/];
        }
    });
}); };
transaction();
//# sourceMappingURL=setup.js.map