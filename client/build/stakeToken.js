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
var dotenv = require("dotenv");
dotenv.config();
var web3_js_1 = require("@solana/web3.js");
var utils_1 = require("./utils");
var spl_token_1 = require("@solana/spl-token");
var account_1 = require("./account");
var base58 = require("bs58");
var borsh = require("@project-serum/borsh");
var BN = require("bn.js");
var transaction = function () { return __awaiter(void 0, void 0, void 0, function () {
    var stakeTokenInstructionLayout, connection, tokenSaleProgramId, stakerKeypair, tokenPubkey, tokenSaleProgramAccountPubkey, idoTokenAccountPubkey, tokenSaleProgramAccount, encodedTokenSaleProgramAccountData, decodedTokenSaleProgramAccountData, tokenSaleProgramAccountData, PDA, buffer, tx, stakerAta, ataAccount, prizePoolPublickey, prizePoolAta, stakeTokenIx, idoTokenAccountBalance, stakerTokenAccountBalance, stakerSOLBalance;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                stakeTokenInstructionLayout = borsh.struct([
                    borsh.u8("variant"),
                    borsh.u64("sol_amount"),
                ]);
                //phase1 (setup Transaction & send Transaction)
                console.log("Setup Transaction");
                connection = new web3_js_1.Connection((0, web3_js_1.clusterApiUrl)("devnet"), "confirmed");
                tokenSaleProgramId = new web3_js_1.PublicKey(process.env.CUSTOM_PROGRAM_ID);
                stakerKeypair = web3_js_1.Keypair.fromSecretKey(base58.decode(process.env.STAKER_PRIVATE_KEY));
                tokenPubkey = new web3_js_1.PublicKey(process.env.TOKEN_PUBKEY);
                tokenSaleProgramAccountPubkey = new web3_js_1.PublicKey(process.env.TOKEN_SALE_PROGRAM_ACCOUNT_PUBKEY);
                idoTokenAccountPubkey = new web3_js_1.PublicKey(process.env.IDO_TOKEN_ACCOUNT_PUBKEY);
                // const idoConfigAccountPubkey = new PublicKey(
                //   process.env.IDO_CONFIG_ACCOUNT_PUBKEY!
                // );
                console.log(111111111111);
                ///////// GET CONFIG FROM CONTRACT
                return [4 /*yield*/, (0, utils_1.getConfig)(tokenSaleProgramAccountPubkey, connection)];
            case 1:
                ///////// GET CONFIG FROM CONTRACT
                _a.sent();
                return [4 /*yield*/, (0, utils_1.checkAccountInitialized)(connection, tokenSaleProgramAccountPubkey)];
            case 2:
                tokenSaleProgramAccount = _a.sent();
                encodedTokenSaleProgramAccountData = tokenSaleProgramAccount.data;
                decodedTokenSaleProgramAccountData = account_1.TokenSaleAccountLayout.decode(encodedTokenSaleProgramAccountData);
                tokenSaleProgramAccountData = {
                    isInitialized: decodedTokenSaleProgramAccountData.isInitialized,
                    poolPubkey: new web3_js_1.PublicKey(decodedTokenSaleProgramAccountData.sellerPubkey),
                    idoTokenAccountPubkey: new web3_js_1.PublicKey(decodedTokenSaleProgramAccountData.idoTokenAccountPubkey),
                    price: decodedTokenSaleProgramAccountData.price,
                    startTime: decodedTokenSaleProgramAccountData.startTime,
                    endTime: decodedTokenSaleProgramAccountData.endTime
                };
                console.log(2222222222222222);
                PDA = web3_js_1.PublicKey.findProgramAddressSync([Buffer.from("token_sale")], tokenSaleProgramId);
                buffer = Buffer.alloc(1000);
                stakeTokenInstructionLayout.encode({
                    variant: 3,
                    sol_amount: new BN(1000 * Math.pow(10, 9))
                }, buffer);
                buffer = buffer.slice(0, stakeTokenInstructionLayout.getSpan(buffer));
                tx = new web3_js_1.Transaction();
                stakerAta = (0, spl_token_1.getAssociatedTokenAddressSync)(tokenPubkey, stakerKeypair.publicKey);
                console.log('stakerAta', stakerAta);
                return [4 /*yield*/, connection.getAccountInfo(stakerAta)];
            case 3:
                ataAccount = _a.sent();
                console.log('ataAccount', ataAccount);
                if (!!ataAccount) return [3 /*break*/, 5];
                return [4 /*yield*/, (0, spl_token_1.getOrCreateAssociatedTokenAccount)(connection, stakerKeypair, tokenPubkey, stakerKeypair.publicKey)];
            case 4:
                _a.sent();
                _a.label = 5;
            case 5:
                prizePoolPublickey = new web3_js_1.PublicKey("H82m8AD5ggVMW4Z8NrTgtNX1uvuR6zCJ2pEW9yCGkp9b");
                prizePoolAta = (0, spl_token_1.getAssociatedTokenAddressSync)(tokenPubkey, prizePoolPublickey);
                console.log(prizePoolAta);
                console.log(55555555555555);
                stakeTokenIx = new web3_js_1.TransactionInstruction({
                    programId: tokenSaleProgramId,
                    keys: [
                        //account 1
                        (0, utils_1.createAccountInfo)(stakerKeypair.publicKey, true, true),
                        // account 2
                        (0, utils_1.createAccountInfo)(tokenSaleProgramAccountData.idoTokenAccountPubkey, false, true),
                        // account 2
                        (0, utils_1.createAccountInfo)(tokenSaleProgramAccountPubkey, false, false),
                        // account 4
                        (0, utils_1.createAccountInfo)(stakerAta, false, true),
                        // account 5
                        (0, utils_1.createAccountInfo)(spl_token_1.TOKEN_PROGRAM_ID, false, false),
                        //account 6
                        (0, utils_1.createAccountInfo)(prizePoolAta, false, true),
                        // account 7
                        (0, utils_1.createAccountInfo)(PDA[0], false, false),
                        // account 8
                        // createAccountInfo(idoConfigAccountPubkey, false, true),
                    ],
                    data: buffer
                });
                console.log('stakeTokenIx', stakeTokenIx);
                tx.add(stakeTokenIx);
                return [4 /*yield*/, connection.sendTransaction(tx, [stakerKeypair], {
                        skipPreflight: false,
                        preflightCommitment: "confirmed"
                    })];
            case 6:
                _a.sent();
                //phase1 end
                //wait block update
                return [4 /*yield*/, new Promise(function (resolve) { return setTimeout(resolve, 1000); })];
            case 7:
                //phase1 end
                //wait block update
                _a.sent();
                return [4 /*yield*/, connection.getTokenAccountBalance(idoTokenAccountPubkey)];
            case 8:
                idoTokenAccountBalance = _a.sent();
                return [4 /*yield*/, connection.getTokenAccountBalance(stakerAta)];
            case 9:
                stakerTokenAccountBalance = _a.sent();
                console.table([
                    {
                        idoTokenAccountBalance: +idoTokenAccountBalance.value.amount.toString() / web3_js_1.LAMPORTS_PER_SOL,
                        stakerTokenAccountBalance: +stakerTokenAccountBalance.value.amount.toString() / web3_js_1.LAMPORTS_PER_SOL
                    },
                ]);
                return [4 /*yield*/, connection.getBalance(stakerKeypair.publicKey, "confirmed")];
            case 10:
                stakerSOLBalance = _a.sent();
                // await getIdoConfig(idoConfigAccountPubkey, connection);
                console.table([
                    {
                        stakerSOLBalance: stakerSOLBalance / web3_js_1.LAMPORTS_PER_SOL
                    },
                ]);
                console.log("\u2728TX successfully finished\u2728\n");
                return [2 /*return*/];
        }
    });
}); };
transaction();
//# sourceMappingURL=stakeToken.js.map