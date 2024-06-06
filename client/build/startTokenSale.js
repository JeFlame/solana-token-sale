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
var BN = require("bn.js");
var borsh = require("@project-serum/borsh");
var utils_1 = require("./utils");
var account_1 = require("./account");
var spl_token_1 = require("@solana/spl-token");
var base58 = require("bs58");
var transaction = function () { return __awaiter(void 0, void 0, void 0, function () {
    var configInstructionLayout, DECIMAL, connection, tokenSaleProgramId, sellerKeypair, sellerTokenAccountPubkey, tokenMintAccountPubkey, totalSaleTokenAmount, idoTokenAccountKeypair, createIdoTokenAccountIx, _a, _b, initIdoTokenAccountIx, transferTokenToTempTokenAccountIx, tokenSaleProgramAccountKeypair, createTokenSaleProgramAccountIx, _c, _d, buffer, price, nowTime, startTime, endTime, idoConfigProgramAccountKeypair, createIdoConfigProgramAccountIx, _e, _f, initTokenSaleProgramIx, tx;
    var _g, _h, _j;
    return __generator(this, function (_k) {
        switch (_k.label) {
            case 0:
                configInstructionLayout = borsh.struct([
                    borsh.u8("variant"),
                    borsh.u64("total_sale_token"),
                    borsh.u64("price"),
                    borsh.u64("start_time"),
                    borsh.u64("end_time"),
                ]);
                DECIMAL = 9;
                //phase1 (setup Transaction & send Transaction)
                console.log("Setup Transaction");
                connection = new web3_js_1.Connection((0, web3_js_1.clusterApiUrl)("devnet"), "confirmed");
                tokenSaleProgramId = new web3_js_1.PublicKey(process.env.CUSTOM_PROGRAM_ID);
                sellerKeypair = web3_js_1.Keypair.fromSecretKey(base58.decode(process.env.SELLER_PRIVATE_KEY));
                sellerTokenAccountPubkey = new web3_js_1.PublicKey(process.env.SELLER_TOKEN_ACCOUNT_PUBKEY);
                tokenMintAccountPubkey = new web3_js_1.PublicKey(process.env.TOKEN_PUBKEY);
                totalSaleTokenAmount = 100 * Math.pow(10, 6);
                console.log(totalSaleTokenAmount);
                idoTokenAccountKeypair = new web3_js_1.Keypair();
                _b = (_a = web3_js_1.SystemProgram).createAccount;
                _g = {
                    fromPubkey: sellerKeypair.publicKey,
                    newAccountPubkey: idoTokenAccountKeypair.publicKey
                };
                return [4 /*yield*/, connection.getMinimumBalanceForRentExemption(spl_token_1.AccountLayout.span)];
            case 1:
                createIdoTokenAccountIx = _b.apply(_a, [(_g.lamports = _k.sent(),
                        _g.space = spl_token_1.AccountLayout.span,
                        _g.programId = spl_token_1.TOKEN_PROGRAM_ID,
                        _g)]);
                initIdoTokenAccountIx = (0, spl_token_1.createInitializeAccountInstruction)(idoTokenAccountKeypair.publicKey, tokenMintAccountPubkey, sellerKeypair.publicKey);
                transferTokenToTempTokenAccountIx = (0, spl_token_1.createTransferInstruction)(sellerTokenAccountPubkey, idoTokenAccountKeypair.publicKey, sellerKeypair.publicKey, totalSaleTokenAmount * Math.pow(10, DECIMAL));
                tokenSaleProgramAccountKeypair = new web3_js_1.Keypair();
                _d = (_c = web3_js_1.SystemProgram).createAccount;
                _h = {
                    fromPubkey: sellerKeypair.publicKey,
                    newAccountPubkey: tokenSaleProgramAccountKeypair.publicKey
                };
                return [4 /*yield*/, connection.getMinimumBalanceForRentExemption(account_1.TokenSaleAccountLayout.span)];
            case 2:
                createTokenSaleProgramAccountIx = _d.apply(_c, [(_h.lamports = _k.sent(),
                        _h.space = account_1.TokenSaleAccountLayout.span,
                        _h.programId = tokenSaleProgramId,
                        _h)]);
                buffer = Buffer.alloc(1000);
                price = 10000;
                nowTime = Number((new Date().getTime() / 1000).toFixed(0));
                startTime = nowTime;
                endTime = nowTime + 1000000;
                configInstructionLayout.encode({
                    variant: 0,
                    total_sale_token: new BN("" + totalSaleTokenAmount * Math.pow(10, DECIMAL)),
                    price: new BN(price),
                    start_time: new BN(startTime),
                    end_time: new BN(endTime)
                }, buffer);
                buffer = buffer.slice(0, configInstructionLayout.getSpan(buffer));
                idoConfigProgramAccountKeypair = new web3_js_1.Keypair();
                _f = (_e = web3_js_1.SystemProgram).createAccount;
                _j = {
                    fromPubkey: sellerKeypair.publicKey,
                    newAccountPubkey: idoConfigProgramAccountKeypair.publicKey
                };
                return [4 /*yield*/, connection.getMinimumBalanceForRentExemption(account_1.TokenSaleAccountLayout.span)];
            case 3:
                createIdoConfigProgramAccountIx = _f.apply(_e, [(_j.lamports = _k.sent(),
                        _j.space = account_1.TokenSaleAccountLayout.span,
                        _j.programId = tokenSaleProgramId,
                        _j)]);
                initTokenSaleProgramIx = new web3_js_1.TransactionInstruction({
                    programId: tokenSaleProgramId,
                    keys: [
                        (0, utils_1.createAccountInfo)(sellerKeypair.publicKey, true, false),
                        (0, utils_1.createAccountInfo)(idoTokenAccountKeypair.publicKey, false, true),
                        (0, utils_1.createAccountInfo)(tokenSaleProgramAccountKeypair.publicKey, false, true),
                        (0, utils_1.createAccountInfo)(web3_js_1.SYSVAR_RENT_PUBKEY, false, false),
                        (0, utils_1.createAccountInfo)(spl_token_1.TOKEN_PROGRAM_ID, false, false),
                        (0, utils_1.createAccountInfo)(idoConfigProgramAccountKeypair.publicKey, false, true),
                    ],
                    data: buffer
                });
                console.log({
                    TOKEN_PROGRAM_ID: spl_token_1.TOKEN_PROGRAM_ID,
                    tokenMintAccountPubkey: String(tokenMintAccountPubkey),
                    sellerTokenAccountPubkey: String(sellerTokenAccountPubkey),
                    idoTokenAccountKeypair: String(idoTokenAccountKeypair.publicKey),
                    sellerKeypair: String(sellerKeypair.publicKey),
                    tokenSaleProgramAccountKeypair: String(tokenSaleProgramAccountKeypair.publicKey),
                    initTokenSaleProgramIx: initTokenSaleProgramIx
                });
                //make transaction with several instructions(ix)
                console.log("Send transaction...\n");
                tx = new web3_js_1.Transaction().add(createIdoTokenAccountIx, initIdoTokenAccountIx, transferTokenToTempTokenAccountIx, createTokenSaleProgramAccountIx, createIdoConfigProgramAccountIx, initTokenSaleProgramIx);
                return [4 /*yield*/, connection.sendTransaction(tx, [
                        sellerKeypair,
                        idoTokenAccountKeypair,
                        tokenSaleProgramAccountKeypair,
                        idoConfigProgramAccountKeypair,
                    ], {
                        skipPreflight: false,
                        preflightCommitment: "confirmed"
                    })];
            case 4:
                _k.sent();
                //phase1 end
                //wait block update
                return [4 /*yield*/, new Promise(function (resolve) { return setTimeout(resolve, 5000); })];
            case 5:
                //phase1 end
                //wait block update
                _k.sent();
                //phase2 (check Transaction result is valid)
                return [4 /*yield*/, (0, utils_1.getConfig)(tokenSaleProgramAccountKeypair.publicKey, connection)];
            case 6:
                //phase2 (check Transaction result is valid)
                _k.sent();
                return [4 /*yield*/, (0, utils_1.getIdoConfig)(idoConfigProgramAccountKeypair.publicKey, connection)];
            case 7:
                _k.sent();
                console.table([
                    {
                        tokenSaleProgramAccountPubkey: tokenSaleProgramAccountKeypair.publicKey.toString()
                    },
                ]);
                console.log("\u2728TX successfully finished\u2728\n");
                //#phase2 end
                process.env.TOKEN_SALE_PROGRAM_ACCOUNT_PUBKEY =
                    tokenSaleProgramAccountKeypair.publicKey.toString();
                process.env.IDO_TOKEN_ACCOUNT_PUBKEY =
                    idoTokenAccountKeypair.publicKey.toString();
                process.env.IDO_CONFIG_ACCOUNT_PUBKEY =
                    idoConfigProgramAccountKeypair.publicKey.toString();
                (0, utils_1.updateEnv)();
                return [2 /*return*/];
        }
    });
}); };
transaction();
//# sourceMappingURL=startTokenSale.js.map