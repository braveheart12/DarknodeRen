const RenExTokens = artifacts.require("RenExTokens");
const RenExBalances = artifacts.require("RenExBalances");
const RenExSettlement = artifacts.require("RenExSettlement");
const RewardVault = artifacts.require("RewardVault");
const RenLedger = artifacts.require("RenLedger");
const RepublicToken = artifacts.require("RepublicToken");
const DarknodeRegistry = artifacts.require("DarknodeRegistry");
const BitcoinMock = artifacts.require("BitcoinMock");
const DGXMock = artifacts.require("DGXMock");

// Two big number libraries are used - BigNumber decimal support
// while BN has better bitwise operations
const BigNumber = require("bignumber.js");
const BN = require('bn.js');

const chai = require("chai");
chai.use(require("chai-as-promised"));
chai.should();

contract.only("RenExSettlement", function (accounts) {

    const buyer = accounts[0];
    const seller = accounts[1];
    const darknode = accounts[2];
    let tokenAddresses, renLedger, renExSettlement, renExBalances;

    before(async function () {
        [tokenAddresses, renLedger, renExSettlement, renExBalances] = await setup(darknode);
    });

    it("order 1", async () => {

        const sell = parseOutput(`
        Function: submitOrder(bytes32 _id, uint8 _orderType, uint8 _parity, uint64 _expiry, uint64 _tokens, uint16 _priceC, uint16 _priceQ, uint16 _volumeC, uint16 _volumeQ, uint16 _minimumVolumeC, uint16 _minimumVolumeQ, uint256 _nonceHash)

MethodID: 0x177d19c3
[0]:  e83bb7dea518a6603f141a120f6e1a83f6655158931fcea63f67084ac1bba181
[1]:  0000000000000000000000000000000000000000000000000000000000000001
[2]:  0000000000000000000000000000000000000000000000000000000000000001
[3]:  000000000000000000000000000000000000000000000000000000005a758820
[4]:  0000000000000000000000000000000000000000000000000000000100010000
[5]:  0000000000000000000000000000000000000000000000000000000000000001
[6]:  0000000000000000000000000000000000000000000000000000000000000002
[7]:  0000000000000000000000000000000000000000000000000000000000000001
[8]:  0000000000000000000000000000000000000000000000000000000000000003
[9]:  0000000000000000000000000000000000000000000000000000000000000001
[10]: 0000000000000000000000000000000000000000000000000000000000000003
[11]: fda940ba5250d10bd3c701ef3e627a7b0bd0fd5143c45a35981f247fa1db3812
        `);

        const buy = parseOutput(`
        Function: submitOrder(bytes32 _id, uint8 _orderType, uint8 _parity, uint64 _expiry, uint64 _tokens, uint16 _priceC, uint16 _priceQ, uint16 _volumeC, uint16 _volumeQ, uint16 _minimumVolumeC, uint16 _minimumVolumeQ, uint256 _nonceHash)

MethodID: 0x177d19c3
[0]:  a2cd3f1d4e22af998905cebc124a202b7fa388eff22a20e71206b3e9a5f261d8
[1]:  0000000000000000000000000000000000000000000000000000000000000001
[2]:  0000000000000000000000000000000000000000000000000000000000000000
[3]:  000000000000000000000000000000000000000000000000000000005a758820
[4]:  0000000000000000000000000000000000000000000000000000000100010000
[5]:  0000000000000000000000000000000000000000000000000000000000000001
[6]:  0000000000000000000000000000000000000000000000000000000000000002
[7]:  0000000000000000000000000000000000000000000000000000000000000001
[8]:  0000000000000000000000000000000000000000000000000000000000000003
[9]:  0000000000000000000000000000000000000000000000000000000000000001
[10]: 0000000000000000000000000000000000000000000000000000000000000003
[11]: fda940ba5250d10bd3c701ef3e627a7b0bd0fd5143c45a35981f247fa1db3812
`)

        await submitMatch(buy, sell, buyer, seller, darknode, renExSettlement, renExBalances, tokenAddresses, renLedger);
    })



    it("order 2", async () => {

        const sell = parseOutput(`
        Function: submitOrder(bytes32 _id, uint8 _orderType, uint8 _parity, uint64 _expiry, uint64 _tokens, uint16 _priceC, uint16 _priceQ, uint16 _volumeC, uint16 _volumeQ, uint16 _minimumVolumeC, uint16 _minimumVolumeQ, uint256 _nonceHash)

MethodID: 0x177d19c3
[0]:  d4689a4c1fa40e8bb713dbcde5c9ebf7a9ddecef45ae6e9dcb94924499a6451f
[1]:  0000000000000000000000000000000000000000000000000000000000000001
[2]:  0000000000000000000000000000000000000000000000000000000000000001
[3]:  000000000000000000000000000000000000000000000000000000005b1b2867
[4]:  0000000000000000000000000000000000000000000000000000000100000100
[5]:  000000000000000000000000000000000000000000000000000000000000014f
[6]:  0000000000000000000000000000000000000000000000000000000000000022
[7]:  0000000000000000000000000000000000000000000000000000000000000005
[8]:  000000000000000000000000000000000000000000000000000000000000000e
[9]:  0000000000000000000000000000000000000000000000000000000000000008
[10]: 0000000000000000000000000000000000000000000000000000000000000008
[11]: 0000000000000000000000000000000000000000000000000000000000000000
        `);

        const buy = parseOutput(`
        Function: submitOrder(bytes32 _id, uint8 _orderType, uint8 _parity, uint64 _expiry, uint64 _tokens, uint16 _priceC, uint16 _priceQ, uint16 _volumeC, uint16 _volumeQ, uint16 _minimumVolumeC, uint16 _minimumVolumeQ, uint256 _nonceHash)

MethodID: 0x177d19c3
[0]:  eb83a73990d7fbcbe2a95df9d53a9d0fd1705cdc27ff7b8f8908aba04e5f5a63
[1]:  0000000000000000000000000000000000000000000000000000000000000001
[2]:  0000000000000000000000000000000000000000000000000000000000000000
[3]:  000000000000000000000000000000000000000000000000000000005b1b3144
[4]:  0000000000000000000000000000000000000000000000000000000100000100
[5]:  000000000000000000000000000000000000000000000000000000000000014f
[6]:  0000000000000000000000000000000000000000000000000000000000000022
[7]:  0000000000000000000000000000000000000000000000000000000000000005
[8]:  000000000000000000000000000000000000000000000000000000000000000c
[9]:  0000000000000000000000000000000000000000000000000000000000000008
[10]: 0000000000000000000000000000000000000000000000000000000000000008
[11]: 0000000000000000000000000000000000000000000000000000000000000000
`)

        await submitMatch(buy, sell, buyer, seller, darknode, renExSettlement, renExBalances, tokenAddresses, renLedger);
    })


    it("order 3", async () => {
        const tokens = market(DGX, REN);
        const buy = { tokens, price: 1, volume: 2 /* DGX */ };
        const sell = { tokens, price: 0.95, volume: 1 /* REN */ };

        (await submitMatch(buy, sell, buyer, seller, darknode, renExSettlement, renExBalances, tokenAddresses, renLedger))
            .should.eql([0.975, 0.975 /* DGX */, 1 /* REN */])
    })

    it("order 4", async () => {
        const tokens = market(DGX, REN);
        const buy = { tokens, price: 1, volume: 1 /* DGX */ };
        const sell = { tokens, price: 0.95, volume: 2 /* REN */ };

        (await submitMatch(buy, sell, buyer, seller, darknode, renExSettlement, renExBalances, tokenAddresses, renLedger))
            .should.eql([0.975, 1 /* DGX */, 1.0256410256410258 /* REN */]);
    })

    it("order 5", async () => {
        const tokens = market(DGX, REN);
        const buy = { tokens, price: 0.5, volume: 1 /* DGX */ };
        const sell = { tokens, price: 0.5, volume: 2 /* REN */ };

        (await submitMatch(buy, sell, buyer, seller, darknode, renExSettlement, renExBalances, tokenAddresses, renLedger))
            .should.eql([0.5, 1 /* DGX */, 2 /* REN */])
    })

    it("order 6", async () => {
        const tokens = market(DGX, REN);
        const buy = { tokens, price: 1, volume: 1 /* DGX */ };
        // More precise than the number of decimals DGX has
        const sell = { tokens, price: 0.0000000001, volume: 2 /* REN */ };

        (await submitMatch(buy, sell, buyer, seller, darknode, renExSettlement, renExBalances, tokenAddresses, renLedger))
            .should.eql([0.5, 1 /* DGX */, 1.9999999998 /* REN */])
    })

    it("order 7", async () => {
        const tokens = market(DGX, REN);
        const buy = { tokens, priceC: 1999, priceQ: 40, volume: 2 /* DGX */ };
        const sell = { tokens, priceC: 1999, priceQ: 40, volume: 1 /* REN */ };

        (await submitMatch(buy, sell, buyer, seller, darknode, renExSettlement, renExBalances, tokenAddresses, renLedger))
            .should.eql([999.5, 2 /* DGX */, 0.002001000500250125 /* REN */])
    })
});













const BTC = 0x0;
const ETH = 0x1;
const DGX = 0x100;
const REN = 0x10000;
const OrderParity = {
    BUY: 0,
    SELL: 1,
};
let prefix = web3.toHex("Republic Protocol: open: ");
const symbols = {
    [BTC]: "BTC",
    [ETH]: "ETH",
    [DGX]: "DGX",
    [REN]: "REN",
}

const market = (low, high) => {
    return new BN(low).mul(new BN(2).pow(new BN(32))).add(new BN(high));
}





function parseOutput(scraped) {
    return {
        orderID: '0x' + getLine(scraped, 0).toArrayLike(Buffer, "be", 32).toString('hex'),
        parity: getLine(scraped, 2).toNumber(),
        expiry: getLine(scraped, 3).toNumber(),
        tokens: getLine(scraped, 4),
        priceC: getLine(scraped, 5).toNumber(),
        priceQ: getLine(scraped, 6).toNumber(),
        volumeC: getLine(scraped, 7).toNumber(),
        volumeQ: getLine(scraped, 8).toNumber(),
        minimumVolumeC: getLine(scraped, 9).toNumber(),
        minimumVolumeQ: getLine(scraped, 10).toNumber(),
        nonceHash: '0x' + getLine(scraped, 11).toArrayLike(Buffer, "be", 32).toString('hex'),
    }
}
function getLine(scraped, lineno) {
    const re = new RegExp("\\n\\[" + lineno + "\\]:\\s*([0-9a-f]*)");
    return new BN(scraped.match(re)[1], 16);
}




async function submitMatch(buy, sell, buyer, seller, darknode, renExSettlement, renExBalances, tokenAddresses, renLedger) {

    (sell.parity === undefined || sell.parity !== buy.parity).should.be.true;
    if (buy.parity === 1) {
        sell, buy = buy, sell;
    }

    for (const order of [buy, sell]) {
        if (order.price !== undefined) {
            price = priceToTuple(order.price);
            order.priceC = price.c, order.priceQ = price.q;
        } else {
            order.price = tupleToPrice({ c: order.priceC, q: order.priceQ });
        }
        if (order.volume !== undefined) {
            volume = volumeToTuple(order.volume);
            order.volumeC = volume.c, order.volumeQ = volume.q;
        } else {
            order.volume = tupleToVolume({ c: order.volumeC, q: order.volumeQ }).toNumber();
        }

        if (order.minimumVolumeC === undefined || order.minimumVolumeQ === undefined) {
            if (order.minimumVolume !== undefined) {
                minimumVolume = volumeToTuple(order.minimumVolume);
                order.minimumVolumeC = minimumVolume.c, order.minimumVolumeQ = minimumVolume.q;
            } else {
                minimumVolume = volumeToTuple(order.volume);
                order.minimumVolumeC = minimumVolume.c, order.minimumVolumeQ = minimumVolume.q;
            }
        }

        if (order.nonceHash === undefined) {
            if (order.nonce === undefined) {
                order.nonce = randomNonce();
            }
            order.nonceHash = web3.sha3(order.nonce, { encoding: 'hex' });
        }
    }

    new BN(buy.tokens).eq(new BN(sell.tokens)).should.be.true;
    const tokens = new BN(buy.tokens);

    const lowToken = new BN(tokens.toArrayLike(Buffer, "be", 8).slice(0, 4)).toNumber();
    const highToken = new BN(tokens.toArrayLike(Buffer, "be", 8).slice(4, 8)).toNumber();

    const lowTokenInstance = tokenAddresses[lowToken];
    const highTokenInstance = tokenAddresses[highToken];

    buy.expiry = buy.expiry || 1641026487;
    buy.type = 1;
    buy.parity = OrderParity.BUY;
    buy.tokens = `0x${tokens.toString('hex')}`;
    if (buy.orderID !== undefined) {
        buy.orderID.should.equal(getOrderID(buy));
    } else {
        buy.orderID = getOrderID(buy);
    }
    console.log(`Buy orderID: ${buy.orderID}`);
    let buyHash = await web3.sha3(prefix + buy.orderID.slice(2), { encoding: 'hex' });
    buy.signature = await web3.eth.sign(buyer, buyHash);


    sell.type = 1; // type
    sell.parity = OrderParity.SELL; // parity
    sell.expiry = sell.expiry || 1641026487; // FIXME: expiry
    sell.tokens = `0x${tokens.toString('hex')}`; // tokens
    if (sell.orderID !== undefined) {
        sell.orderID.should.equal(getOrderID(sell));
    } else {
        sell.orderID = getOrderID(sell);
    }
    console.log(`Sell orderID: ${sell.orderID}`);
    let sellHash = await web3.sha3(prefix + sell.orderID.slice(2), { encoding: 'hex' });
    const sellSignature = await web3.eth.sign(seller, sellHash);

    const highDecimals = (await highTokenInstance.decimals()).toNumber();
    const lowDecimals = (await lowTokenInstance.decimals()).toNumber();

    // Approve and deposit
    const highDeposit = sell.volume * (10 ** highDecimals);
    const lowDeposit = buy.volume * (10 ** lowDecimals);

    if (lowToken !== ETH) {
        await lowTokenInstance.transfer(buyer, lowDeposit);
        await lowTokenInstance.approve(renExBalances.address, lowDeposit, { from: buyer });
        await renExBalances.deposit(lowTokenInstance.address, lowDeposit, { from: buyer });
    } else {
        await renExBalances.deposit(lowTokenInstance.address, lowDeposit, { from: buyer, value: lowDeposit });
    }

    if (highToken !== ETH) {
        await highTokenInstance.transfer(seller, highDeposit);
        await highTokenInstance.approve(renExBalances.address, highDeposit, { from: seller });
        await renExBalances.deposit(highTokenInstance.address, highDeposit, { from: seller });
    } else {
        await renExBalances.deposit(highTokenInstance.address, highDeposit, { from: seller, value: highDeposit });
    }


    await renLedger.openBuyOrder(buy.signature, buy.orderID, renExSettlement.address, { from: buyer });

    await renLedger.openSellOrder(sellSignature, sell.orderID, renExSettlement.address, { from: seller });

    (await renLedger.orderTrader(buy.orderID)).should.equal(buyer);
    (await renLedger.orderTrader(sell.orderID)).should.equal(seller);

    await renLedger.confirmOrder(buy.orderID, [sell.orderID], { from: darknode });

    await renExSettlement.submitOrder(buy.type, buy.parity, buy.expiry, buy.tokens, buy.priceC, buy.priceQ, buy.volumeC, buy.volumeQ, buy.minimumVolumeC, buy.minimumVolumeQ, buy.nonceHash);
    await renExSettlement.submitOrder(sell.type, sell.parity, sell.expiry, sell.tokens, sell.priceC, sell.priceQ, sell.volumeC, sell.volumeQ, sell.minimumVolumeC, sell.minimumVolumeQ, sell.nonceHash);

    console.log(`BUYER: price: ${buy.price} ${symbols[lowToken]}/${symbols[highToken]}, offering ${buy.volume} ${symbols[lowToken]}`)
    console.log(`SELLR: price: ${sell.price} ${symbols[lowToken]}/${symbols[highToken]}, offering ${sell.volume} ${symbols[highToken]}`)

    const buyerLowBefore = await renExBalances.traderBalances(buyer, lowTokenInstance.address);
    const buyerHighBefore = await renExBalances.traderBalances(buyer, highTokenInstance.address);
    const sellerLowBefore = await renExBalances.traderBalances(seller, lowTokenInstance.address);
    const sellerHighBefore = await renExBalances.traderBalances(seller, highTokenInstance.address);

    console.log('Submitting matched');
    await renExSettlement.submitMatch(buy.orderID, sell.orderID);
    console.log('Match submitted');

    const matchID = web3.sha3(buy.orderID + sell.orderID.slice(2), { encoding: 'hex' });
    const match = await renExSettlement.matches(matchID);
    const priceMatched = match[0];
    const lowMatched = new BigNumber(match[1]);
    const highMatched = new BigNumber(match[2]);

    console.log(`MATCH: price: ${priceMatched.toNumber() / 10 ** lowDecimals} ${symbols[lowToken]}/${symbols[highToken]}, ${lowMatched.toNumber() / 10 ** lowDecimals} ${symbols[lowToken]} for ${highMatched.toNumber() / 10 ** highDecimals} ${symbols[highToken]}`)

    const buyerLowAfter = await renExBalances.traderBalances(buyer, lowTokenInstance.address);
    const buyerHighAfter = await renExBalances.traderBalances(buyer, highTokenInstance.address);
    const sellerLowAfter = await renExBalances.traderBalances(seller, lowTokenInstance.address);
    const sellerHighAfter = await renExBalances.traderBalances(seller, highTokenInstance.address);

    const buyerLowDiff = buyerLowBefore.sub(buyerLowAfter);
    const sellerLowDiff = sellerLowAfter.sub(sellerLowBefore);
    const lowFees = buyerLowDiff.sub(sellerLowDiff);

    const buyerHighDiff = buyerHighBefore.sub(buyerHighAfter);
    const sellerHighDiff = sellerHighAfter.sub(sellerHighBefore);
    const highFees = buyerHighDiff.sub(sellerHighDiff);

    const expectedLowFees = lowMatched
        .multipliedBy(2)
        .dividedBy(1000)
        .integerValue(BigNumber.ROUND_CEIL);
    const expectedHighFees = highMatched
        .multipliedBy(2)
        .dividedBy(1000)
        .integerValue(BigNumber.ROUND_CEIL);

    lowFees.toFixed().should.equal(expectedLowFees.toFixed());
    highFees.toFixed().should.equal(expectedHighFees.toFixed());

    return [
        priceMatched.toNumber() / 10 ** lowDecimals,
        lowMatched.toNumber() / 10 ** lowDecimals,
        highMatched.toNumber() / 10 ** highDecimals,
    ];
}

async function setup(darknode) {
    const tokenAddresses = {
        [BTC]: await BitcoinMock.new(),
        [ETH]: { address: "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE", decimals: () => new BigNumber(18), approve: () => null },
        [DGX]: await DGXMock.new(),
        [REN]: await RepublicToken.new(),
    };

    const dnr = await DarknodeRegistry.new(
        tokenAddresses[REN].address,
        0,
        1,
        0
    );
    const renLedger = await RenLedger.new(0, tokenAddresses[REN].address, dnr.address);
    const rewardVault = await RewardVault.new(dnr.address);
    const renExBalances = await RenExBalances.new(rewardVault.address);
    const renExTokens = await RenExTokens.new();
    const renExSettlement = await RenExSettlement.new(renLedger.address, renExTokens.address, renExBalances.address);
    await renExBalances.setRenExSettlementContract(renExSettlement.address);

    await renExTokens.registerToken(ETH, tokenAddresses[ETH].address, 18);
    await renExTokens.registerToken(BTC, tokenAddresses[BTC].address, (await tokenAddresses[BTC].decimals()).toNumber());
    await renExTokens.registerToken(DGX, tokenAddresses[DGX].address, (await tokenAddresses[DGX].decimals()).toNumber());
    await renExTokens.registerToken(REN, tokenAddresses[REN].address, (await tokenAddresses[REN].decimals()).toNumber());

    // Register darknode
    await dnr.register(darknode, "", 0, { from: darknode });
    await dnr.epoch();

    return [tokenAddresses, renLedger, renExSettlement, renExBalances];
}


const PRIME = new BN('17012364981921935471');
function randomNonce() {
    let nonce = PRIME;
    while (nonce.gte(PRIME)) {
        nonce = new BN(Math.floor(Math.random() * 10000000));
    }
    return nonce.toString('hex');
}



function getOrderID(order) {
    const bytes = Buffer.concat([
        new BN(order.type).toArrayLike(Buffer, "be", 1),
        new BN(order.parity).toArrayLike(Buffer, "be", 1),
        new BN(1).toArrayLike(Buffer, "be", 4), // RENEX
        new BN(order.expiry).toArrayLike(Buffer, "be", 8),
        new BN(order.tokens.slice(2), 'hex').toArrayLike(Buffer, "be", 8),
        new BN(order.priceC).toArrayLike(Buffer, "be", 8),
        new BN(order.priceQ).toArrayLike(Buffer, "be", 8),
        new BN(order.volumeC).toArrayLike(Buffer, "be", 8),
        new BN(order.volumeQ).toArrayLike(Buffer, "be", 8),
        new BN(order.minimumVolumeC).toArrayLike(Buffer, "be", 8),
        new BN(order.minimumVolumeQ).toArrayLike(Buffer, "be", 8),
        new Buffer(order.nonceHash.slice(2), 'hex'),
    ]);
    return web3.sha3('0x' + bytes.toString('hex'), { encoding: 'hex' });
}






/**
 * Calculate price tuple from a decimal string
 * 
 * https://github.com/republicprotocol/republic-go/blob/smpc/docs/orders-and-order-fragments.md
 * 
 */
function priceToTuple(priceI) {
    const price = new BigNumber(priceI);
    const shift = 10 ** 12;
    const exponentOffset = 26;
    const step = 0.005;
    const tuple = floatToTuple(shift, exponentOffset, step, price, 1999);
    console.assert(0 <= tuple.c && tuple.c <= 1999, `Expected c (${tuple.c}) to be in [1,1999] in priceToTuple(${price})`);
    console.assert(0 <= tuple.q && tuple.q <= 52, `Expected c (${tuple.c}) to be in [0,52] in priceToTuple(${price})`);
    return tuple;
}

const getPriceStep = (price) => {
    return getStep(price, 0.005);
}

const tupleToPrice = (t) => {
    const e = new BigNumber(10).pow(t.q - 26 - 12 - 3);
    return new BigNumber(t.c).times(5).times(e);
}

const normalizePrice = (p) => {
    return tupleToPrice(priceToTuple(p));
}


function volumeToTuple(volumeI) {
    const volume = new BigNumber(volumeI);
    const shift = 10 ** 12;
    const exponentOffset = 0;
    const step = 0.2;
    const tuple = floatToTuple(shift, exponentOffset, step, volume, 49);
    console.assert(0 <= tuple.c && tuple.c <= 49, `Expected c (${tuple.c}) to be in [1,49] in volumeToTuple(${volume})`);
    console.assert(0 <= tuple.q && tuple.q <= 52, `Expected c (${tuple.c}) to be in [0,52] in volumeToTuple(${volume})`);
    return tuple;
}


const getVolumeStep = (volume) => {
    return getStep(volume, 0.2);
}

const tupleToVolume = (t) => {
    const e = new BigNumber(10).pow(t.q - 12);
    return new BigNumber(t.c).times(0.2).times(e);
}

const normalizeVolume = (v) => {
    return tupleToVolume(volumeToTuple(v));
}


function floatToTuple(shift, exponentOffset, step, value, max) {
    const shifted = value.times(shift);

    const digits = -Math.floor(Math.log10(step)) + 1;
    const stepInt = step * 10 ** (digits - 1);

    // CALCULATE tuple
    let [c, exp] = significantDigits(shifted.toNumber(), digits, false);
    c = (c - (c % stepInt)) / step;

    // Simplify again if possible - e.g. [1910,32] becomes [191,33]
    let expAdd;
    [c, expAdd] = significantDigits(c, digits, false);
    exp += expAdd;

    // TODO: Fixme
    while (c > max) {
        c /= 10;
        exp++;
    }

    const q = exponentOffset + exp;

    return { c, q };
}


function significantDigits(n, digits, simplify = false) {
    if (n === 0) {
        return [0, 0];
    }
    let exp = Math.floor(Math.log10(n)) - (digits - 1);
    let c = Math.floor((n) / (10 ** exp));

    if (simplify) {
        while (c % 10 === 0 && c !== 0) {
            c = c / 10;
            exp++;
        }
    }

    return [c, exp];
}

