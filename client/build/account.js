"use strict";
exports.__esModule = true;
exports.TokenSaleAccountLayout = void 0;
//@ts-expect-error missing types
var BufferLayout = require("buffer-layout");
exports.TokenSaleAccountLayout = BufferLayout.struct([
    BufferLayout.u8("isInitialized"),
    BufferLayout.blob(32, "sellerPubkey"),
    BufferLayout.blob(32, "idoTokenAccountPubkey"),
    BufferLayout.blob(8, "totalSaleToken"),
    BufferLayout.blob(8, "price"),
    BufferLayout.blob(8, "startTime"),
    BufferLayout.blob(8, "endTime"), //8byte
]);
//# sourceMappingURL=account.js.map