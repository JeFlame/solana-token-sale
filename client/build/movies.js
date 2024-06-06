"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
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
var account_1 = require("./account");
var spl_token_1 = require("@solana/spl-token");
var base58 = require("bs58");
var MOVIE_REVIEW_PROGRAM_ID = "GJH4fbmFi28g2r7TzkRqzEAAbPEB8AuYFoinDHb1Z9ba";
function serialize(instruction) {
    var buffer = Buffer.alloc(1000);
    this.borshInstructionSchema.encode(__assign(__assign({}, this), { variant: instruction }), buffer);
    return buffer.slice(0, this.borshInstructionSchema.getSpan(buffer));
}
var transaction = function () { return __awaiter(void 0, void 0, void 0, function () {
    var connection, tokenSaleProgramId, sellerKeypair, instruction, pda, pdaCounter, buffer, initTokenSaleProgramIx, tx, tokenSaleProgramAccount, encodedTokenSaleProgramAccountData, decodedTokenSaleProgramAccountData, expectedTokenSaleProgramAccountData;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                //phase1 (setup Transaction & send Transaction)
                console.log("Setup Transaction");
                connection = new web3_js_1.Connection((0, web3_js_1.clusterApiUrl)("devnet"), "confirmed");
                tokenSaleProgramId = new web3_js_1.PublicKey(process.env.MOVIE_REVIEW_PROGRAM_ID);
                sellerKeypair = web3_js_1.Keypair.fromSecretKey(base58.decode(process.env.SELLER_PRIVATE_KEY));
                instruction = 0;
                return [4 /*yield*/, web3_js_1.PublicKey.findProgramAddress([sellerKeypair.publicKey.toBuffer(), Buffer.from("Movie 1")], // new TextEncoder().encode(movie.title)],
                    new web3_js_1.PublicKey(MOVIE_REVIEW_PROGRAM_ID))];
            case 1:
                pda = (_a.sent())[0];
                return [4 /*yield*/, web3_js_1.PublicKey.findProgramAddress([pda.toBuffer(), Buffer.from("comment")], // new TextEncoder().encode(movie.title)],
                    new web3_js_1.PublicKey(MOVIE_REVIEW_PROGRAM_ID))];
            case 2:
                pdaCounter = (_a.sent())[0];
                buffer = movie.serialize(toggle ? 0 : 1);
                initTokenSaleProgramIx = new web3_js_1.TransactionInstruction({
                    programId: new web3.PublicKey(MOVIE_REVIEW_PROGRAM_ID),
                    keys: [
                        (0, utils_1.createAccountInfo)(sellerKeypair.publicKey, true, false),
                        (0, utils_1.createAccountInfo)(pda, false, true),
                        (0, utils_1.createAccountInfo)(pdaCounter, false, true),
                        (0, utils_1.createAccountInfo)(web3_js_1.SYSVAR_RENT_PUBKEY, false, false),
                        (0, utils_1.createAccountInfo)(web3_js_1.SystemProgram.programId, false, false),
                    ],
                    data: buffer
                });
                console.log({
                    TOKEN_PROGRAM_ID: spl_token_1.TOKEN_PROGRAM_ID,
                    tokenMintAccountPubkey: String(tokenMintAccountPubkey),
                    sellerTokenAccountPubkey: String(sellerTokenAccountPubkey),
                    tempTokenAccountKeypair: String(tempTokenAccountKeypair.publicKey),
                    sellerKeypair: String(sellerKeypair.publicKey),
                    tokenSaleProgramAccountKeypair: String(tokenSaleProgramAccountKeypair.publicKey),
                    initTokenSaleProgramIx: initTokenSaleProgramIx
                });
                //make transaction with several instructions(ix)
                console.log("Send transaction...\n");
                tx = new web3_js_1.Transaction().add(createTempTokenAccountIx, initTempTokenAccountIx, transferTokenToTempTokenAccountIx, createTokenSaleProgramAccountIx, initTokenSaleProgramIx);
                return [4 /*yield*/, connection.sendTransaction(tx, [sellerKeypair, tempTokenAccountKeypair, tokenSaleProgramAccountKeypair], {
                        skipPreflight: false,
                        preflightCommitment: "confirmed"
                    })];
            case 3:
                _a.sent();
                //phase1 end
                //wait block update
                return [4 /*yield*/, new Promise(function (resolve) { return setTimeout(resolve, 5000); })];
            case 4:
                //phase1 end
                //wait block update
                _a.sent();
                return [4 /*yield*/, (0, utils_1.checkAccountInitialized)(connection, tokenSaleProgramAccountKeypair.publicKey)];
            case 5:
                tokenSaleProgramAccount = _a.sent();
                encodedTokenSaleProgramAccountData = tokenSaleProgramAccount.data;
                decodedTokenSaleProgramAccountData = account_1.TokenSaleAccountLayout.decode(encodedTokenSaleProgramAccountData);
                expectedTokenSaleProgramAccountData = {
                    isInitialized: 1,
                    sellerPubkey: sellerKeypair.publicKey,
                    tempTokenAccountPubkey: tempTokenAccountKeypair.publicKey,
                    swapSolAmount: swapSolAmount,
                    swapTokenAmount: swapTokenAmount
                };
                console.log("Current TokenSaleProgramAccountData");
                (0, utils_1.checkAccountDataIsValid)(decodedTokenSaleProgramAccountData, expectedTokenSaleProgramAccountData);
                console.table([
                    {
                        tokenSaleProgramAccountPubkey: tokenSaleProgramAccountKeypair.publicKey.toString()
                    },
                ]);
                console.log("\u2728TX successfully finished\u2728\n");
                //#phase2 end
                process.env.TOKEN_SALE_PROGRAM_ACCOUNT_PUBKEY =
                    tokenSaleProgramAccountKeypair.publicKey.toString();
                process.env.TEMP_TOKEN_ACCOUNT_PUBKEY =
                    tempTokenAccountKeypair.publicKey.toString();
                (0, utils_1.updateEnv)();
                return [2 /*return*/];
        }
    });
}); };
transaction();
//# sourceMappingURL=movies.js.map