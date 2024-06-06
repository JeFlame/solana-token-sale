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
exports.loadWalletKey = void 0;
var web3_js_1 = require("@solana/web3.js");
var mpl = require("@metaplex-foundation/mpl-token-metadata");
var splToken = require("@solana/spl-token");
var anchor = require("@project-serum/anchor");
var base58 = require("bs58");
var connection = new web3_js_1.Connection((0, web3_js_1.clusterApiUrl)("mainnet-beta"));
var PRIVATE_KEY = "2QYyZKTc19VTb6Mmavi9N27xEHhxKjTCpEQpwk728w9dMz11YnJ1HC7mckBoukGffZxbsADQpTFqgMKwgASHVxA8";
var TOKEN_ADDRESS = "F77UNxigSD8ofkTpXSn557C9kuCcMMSjPNMNXknBcKRw";
var COLLECTION_MINT = "EfrJRyGVcBD1AokvnEdFNtTWJRXyK1Px3dSexD6BfQDA";
function loadWalletKey() {
    return web3_js_1.Keypair.fromSecretKey(base58.decode(PRIVATE_KEY));
}
exports.loadWalletKey = loadWalletKey;
function burnThatNFT() {
    return __awaiter(this, void 0, void 0, function () {
        var keypair, mint, collectionMint, ta, seed1, seed2, seed3, seed4, _a, metadataPDA, _bump, _b, masterEditionPDA, _bump2, _c, collectionMetadataPDA, _bump3, brnAccounts, unverifyCollectionAccounts, unvInstr, binstr, transaction, txid;
        return __generator(this, function (_d) {
            switch (_d.label) {
                case 0:
                    keypair = loadWalletKey();
                    mint = new web3_js_1.PublicKey(TOKEN_ADDRESS);
                    collectionMint = new web3_js_1.PublicKey(COLLECTION_MINT);
                    return [4 /*yield*/, splToken.getAssociatedTokenAddress(mint, keypair.publicKey)];
                case 1:
                    ta = _d.sent();
                    seed1 = Buffer.from(anchor.utils.bytes.utf8.encode("metadata"));
                    seed2 = Buffer.from(mpl.PROGRAM_ID.toBytes());
                    seed3 = Buffer.from(mint.toBytes());
                    seed4 = Buffer.from(anchor.utils.bytes.utf8.encode("edition"));
                    _a = web3_js_1.PublicKey.findProgramAddressSync([seed1, seed2, seed3], mpl.PROGRAM_ID), metadataPDA = _a[0], _bump = _a[1];
                    _b = web3_js_1.PublicKey.findProgramAddressSync([seed1, seed2, seed3, seed4], mpl.PROGRAM_ID), masterEditionPDA = _b[0], _bump2 = _b[1];
                    _c = web3_js_1.PublicKey.findProgramAddressSync([seed1, seed2, Buffer.from(collectionMint.toBytes())], mpl.PROGRAM_ID), collectionMetadataPDA = _c[0], _bump3 = _c[1];
                    console.log("owner: " + keypair.publicKey.toBase58());
                    console.log("mint: " + mint.toBase58());
                    console.log("token account: " + ta.toBase58());
                    console.log("metadata account: " + metadataPDA.toBase58());
                    console.log("edition account: " + masterEditionPDA.toBase58());
                    brnAccounts = {
                        metadata: metadataPDA,
                        owner: keypair.publicKey,
                        mint: mint,
                        tokenAccount: ta,
                        masterEditionAccount: masterEditionPDA,
                        splTokenProgram: splToken.TOKEN_PROGRAM_ID,
                        collectionMetadata: collectionMetadataPDA
                    };
                    unverifyCollectionAccounts = {
                        collection: collectionMetadataPDA,
                        collectionAuthority: keypair.publicKey,
                        collectionMasterEditionAccount: masterEditionPDA,
                        collectionMint: collectionMint,
                        metadata: metadataPDA
                    };
                    unvInstr = mpl.createUnverifyCollectionInstruction(unverifyCollectionAccounts, mpl.PROGRAM_ID);
                    binstr = mpl.createBurnNftInstruction(brnAccounts, new web3_js_1.PublicKey(mpl.PROGRAM_ADDRESS));
                    transaction = new web3_js_1.Transaction().add(binstr);
                    return [4 /*yield*/, connection.sendTransaction(transaction, [keypair])];
                case 2:
                    txid = _d.sent();
                    console.log(txid);
                    return [2 /*return*/];
            }
        });
    });
}
burnThatNFT();
//# sourceMappingURL=burnNft.js.map