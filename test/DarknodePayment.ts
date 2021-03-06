import BN from "bn.js";

import { config } from "../migrations/networks";
import {
    CycleChangerInstance, DarknodePaymentInstance, DarknodePaymentStoreInstance,
    DarknodeRegistryInstance, ERC20Instance, RenTokenInstance,
} from "../types/truffle-contracts";
import {
    ETHEREUM_TOKEN_ADDRESS, increaseTime, MINIMUM_BOND, NULL, PUBK, waitForEpoch,
} from "./helper/testUtils";

const CycleChanger = artifacts.require("CycleChanger");
const RenToken = artifacts.require("RenToken");
const ERC20 = artifacts.require("PaymentToken");
const DarknodePaymentStore = artifacts.require("DarknodePaymentStore");
const DarknodePayment = artifacts.require("DarknodePayment");
const DarknodeRegistry = artifacts.require("DarknodeRegistry");
const SelfDestructingToken = artifacts.require("SelfDestructingToken");

const { DARKNODE_PAYMENT_CYCLE_DURATION_SECONDS } = config;

const hour = 60 * 60;
const day = 24 * hour;

contract("DarknodePayment", (accounts: string[]) => {

    let store: DarknodePaymentStoreInstance;
    let dai: ERC20Instance;
    let erc20Token: ERC20Instance;
    let dnr: DarknodeRegistryInstance;
    let dnp: DarknodePaymentInstance;
    let ren: RenTokenInstance;
    let cc: CycleChangerInstance;

    const owner = accounts[0];
    const darknode1 = accounts[1];
    const darknode2 = accounts[2];
    const darknode3 = accounts[3];
    const darknode4 = accounts[4];
    const darknode5 = accounts[5];
    const darknode6 = accounts[6];

    before(async () => {
        ren = await RenToken.deployed();
        dai = await ERC20.new();
        erc20Token = await ERC20.new();
        dnr = await DarknodeRegistry.deployed();
        store = await DarknodePaymentStore.deployed();
        dnp = await DarknodePayment.deployed();

        cc = await CycleChanger.new(dnp.address);

        // [ACTION] Register
        // Don't register a darknode under account[0]
        for (let i = 1; i < accounts.length; i++) {
            await ren.transfer(accounts[i], MINIMUM_BOND);
            await ren.approve(dnr.address, MINIMUM_BOND, { from: accounts[i] });
            // Register the darknodes under the account address
            await dnr.register(accounts[i], PUBK(i), { from: accounts[i] });
        }

        await waitForEpoch(dnr);
        await waitForEpoch(dnr);

        new BN(await store.darknodeWhitelistLength()).should.bignumber.equal(new BN(0));
    });

    afterEach(async () => {
        await waitForCycle();
    });

    describe("Token registration", async () => {

        const tokenCount = async () => {
            let i = 0;
            while (true) {
                try {
                    await dnp.registeredTokens(i);
                    i++;
                } catch (error) {
                    break;
                }
            }
            return i;
        };

        const printTokens = async () => {
            console.log(`Registered tokens: [`);
            let i = 0;
            while (true) {
                try {
                    const token = await dnp.registeredTokens(i);
                    console.log(`    ${token}, (${await dnp.registeredTokenIndex(token)})`);
                    i++;
                } catch (error) {
                    break;
                }
            }
            console.log(`]`);
        };

        const checkTokenIndexes = async () => {
            let i = 0;
            while (true) {
                try {
                    const token = await dnp.registeredTokens(i);
                    (await dnp.registeredTokenIndex(token)).should.bignumber.equal(i + 1);
                    i++;
                } catch (error) {
                    if (error.toString().match("invalid opcode")) {
                        break;
                    }
                    await printTokens();
                    throw error;
                }
            }
        };

        it("cannot register token if not owner", async () => {
            await dnp.registerToken(dai.address, { from: accounts[1] }).should.be.rejected;
        });

        it("can register tokens", async () => {
            const lengthBefore = await tokenCount();

            await dnp.registerToken(dai.address);
            await dnp.registerToken(dai.address).should.be.rejectedWith(/token already pending registration/);
            await dnp.registerToken(erc20Token.address);
            // complete token registration
            await waitForCycle();
            (await dnp.registeredTokens(lengthBefore)).should.equal(dai.address);
            (await dnp.registeredTokenIndex(dai.address)).should.bignumber.equal(new BN(lengthBefore + 1));
            await dnp.registerToken(ETHEREUM_TOKEN_ADDRESS);
            // complete token registration
            await waitForCycle();
            (await dnp.registeredTokens(lengthBefore + 2)).should.equal(ETHEREUM_TOKEN_ADDRESS);
            (await dnp.registeredTokenIndex(ETHEREUM_TOKEN_ADDRESS)).should.bignumber.equal(lengthBefore + 3);
            await checkTokenIndexes();
        });

        it("can deregister a destroyed token", async () => {
            // Claim so that the darknode share count isn't 0.
            await dnp.claim(darknode6);
            const sdt = await SelfDestructingToken.new();
            await dnp.registerToken(sdt.address);
            await waitForCycle();
            await sdt.destruct();
            await dnp.deregisterToken(sdt.address);
            await waitForCycle();
            await dnp.blacklist(darknode6);
        });

        it("cannot register already registered tokens", async () => {
            await dnp.registerToken(dai.address).should.be.rejectedWith(/token already registered/);
        });

        it("cannot deregister token if not owner", async () => {
            await dnp.deregisterToken(ETHEREUM_TOKEN_ADDRESS, { from: accounts[1] }).should.be.rejected;
        });

        it("can deregister tokens", async () => {
            await dnp.deregisterToken(ETHEREUM_TOKEN_ADDRESS);
            await dnp.deregisterToken(ETHEREUM_TOKEN_ADDRESS).should.be.rejectedWith(/token not registered/);
            await dnp.deregisterToken(erc20Token.address);
            // check token deregistration
            (await dnp.registeredTokenIndex(ETHEREUM_TOKEN_ADDRESS)).should.bignumber.equal(0);
            (await dnp.registeredTokenIndex(erc20Token.address)).should.bignumber.equal(0);
            await checkTokenIndexes();
        });

        it("cannot deregister unregistered tokens", async () => {
            await dnp.deregisterToken(ETHEREUM_TOKEN_ADDRESS).should.be.rejectedWith(/token not registered/);
        });

        it("properly sets index", async () => {
            const token1 = await ERC20.new();
            const token2 = await ERC20.new();
            const token3 = await ERC20.new();
            const one = token1.address;
            const two = token2.address;
            const three = token3.address;

            await checkTokenIndexes();
            await dnp.registerToken(one);
            await dnp.registerToken(two);
            await dnp.registerToken(three);
            await waitForCycle();
            await checkTokenIndexes();

            // const expected = await dnp.registeredTokenIndex(one);
            await dnp.deregisterToken(one);
            await waitForCycle();
            await checkTokenIndexes();
            // (await dnp.registeredTokenIndex(two)).should.bignumber.equal(expected);
            await dnp.deregisterToken(two);
            await dnp.deregisterToken(three);
            await checkTokenIndexes();
            await waitForCycle();
            await checkTokenIndexes();
        });
    });

    describe("Token deposits", async () => {

        it("can deposit ETH using deposit()", async () => {
            // deposit using deposit() function
            const previousReward = new BN(await dnp.currentCycleRewardPool(ETHEREUM_TOKEN_ADDRESS));
            const oldETHBalance = new BN(await store.totalBalance(ETHEREUM_TOKEN_ADDRESS));
            const amount = new BN("1000000000");
            // make sure we have enough balance
            const ownerBalance = new BN(await web3.eth.getBalance(owner));
            ownerBalance.gte(amount).should.be.true;
            await dnp.deposit(amount, ETHEREUM_TOKEN_ADDRESS, { value: amount.toString(), from: accounts[0] });
            new BN(await store.totalBalance(ETHEREUM_TOKEN_ADDRESS)).should.bignumber.equal(oldETHBalance.add(amount));
            // We should have increased the reward pool
            (new BN(await dnp.currentCycleRewardPool(ETHEREUM_TOKEN_ADDRESS)))
                .should.bignumber.equal(previousReward.add(amount));
        });

        it("can deposit ETH via direct payment to DarknodePayment contract", async () => {
            // deposit using direct deposit to dnp
            const previousReward = new BN(await dnp.currentCycleRewardPool(ETHEREUM_TOKEN_ADDRESS));
            const oldETHBalance = new BN(await store.totalBalance(ETHEREUM_TOKEN_ADDRESS));
            const amount = new BN("1000000000");
            // make sure we have enough balance
            const ownerBalance = new BN(await web3.eth.getBalance(owner));
            ownerBalance.gte(amount).should.be.true;
            await web3.eth.sendTransaction({ to: dnp.address, from: owner, value: amount.toString() });
            new BN(await store.totalBalance(ETHEREUM_TOKEN_ADDRESS)).should.bignumber.equal(oldETHBalance.add(amount));
            // We should have increased the reward pool
            (new BN(await dnp.currentCycleRewardPool(ETHEREUM_TOKEN_ADDRESS)))
                .should.bignumber.equal(previousReward.add(amount));
        });

        it("can deposit ETH via direct payment to DarknodePaymentStore contract", async () => {
            // deposit using direct deposit to store
            const previousReward = new BN(await dnp.currentCycleRewardPool(ETHEREUM_TOKEN_ADDRESS));
            const oldETHBalance = new BN(await store.totalBalance(ETHEREUM_TOKEN_ADDRESS));
            const amount = new BN("1000000000");
            await web3.eth.sendTransaction({ to: store.address, from: owner, value: amount.toString() });
            new BN(await store.totalBalance(ETHEREUM_TOKEN_ADDRESS)).should.bignumber.equal(oldETHBalance.add(amount));
            // We should have increased the reward pool
            (new BN(await dnp.currentCycleRewardPool(ETHEREUM_TOKEN_ADDRESS)))
                .should.bignumber.equal(previousReward.add(amount));
        });

        it("cannot deposit ERC20 with ETH attached", async () => {
            const amount = new BN("100000000000000000");
            await dnp.deposit(amount, dai.address, { value: "1", from: accounts[0] })
                .should.be.rejectedWith(/unexpected ether transfer/);
        });
    });

    describe("Claiming rewards", async () => {
        it("cannot tick if not registered", async () => {
            await dnp.claim(accounts[0]).should.be.rejectedWith(/darknode is not registered/);
        });

        it("cannot withdraw if there is no balance", async () => {
            await dnp.withdraw(darknode1, dai.address).should.be.rejectedWith(/nothing to withdraw/);
        });

        it("can whitelist darknodes", async () => {
            await waitForCycle();
            const whitelistLength = await store.darknodeWhitelistLength();
            await store.isWhitelisted(darknode1).should.eventually.be.false;
            await dnp.claim(darknode1);
            // Attempts to whitelist again during the same cycle should do nothing
            await dnp.claim(darknode1).should.be.rejectedWith(/cannot claim for this cycle/);
            await store.isWhitelisted(darknode1).should.eventually.be.true;
            await waitForCycle();
            new BN(await store.darknodeWhitelistLength())
                .should.bignumber.equal(new BN(whitelistLength).add(new BN(1)));
        });

        it("can be paid DAI from a payee", async () => {
            // darknode1 is whitelisted and can participate in rewards
            const previousBalance = new BN(await dnp.currentCycleRewardPool(dai.address));
            const amount = new BN("100000000000000000");
            await depositDai(amount);

            // We should have increased the reward pool
            (new BN(await dnp.currentCycleRewardPool(dai.address))).should.bignumber.equal(previousBalance.add(amount));

            // We should have zero claimed balance before ticking
            (new BN(await dnp.darknodeBalances(darknode1, dai.address))).should.bignumber.equal(new BN(0));

            // We don't need to claim since we weren't allocated rewards last cycle
            // But claim shouldn't revert
            await dnp.claim(darknode1);
            await waitForCycle();

            // We should be the only one who participated last cycle
            (new BN(await dnp.shareCount())).should.bignumber.equal(1);
            // We should be allocated all the rewards
            (new BN(await dnp.unclaimedRewards(dai.address))).should.bignumber.equal(amount);
            (new BN(await dnp.previousCycleRewardShare(dai.address))).should.bignumber.equal(amount);

            // Claim the rewards for last cycle
            await dnp.claim(darknode1);
            await waitForCycle();
            // There should be nothing left in the reward pool
            (new BN(await dnp.currentCycleRewardPool(dai.address))).should.bignumber.equal(new BN(0));
            const darknode1Balance = new BN(await dnp.darknodeBalances(darknode1, dai.address));
            darknode1Balance.should.bignumber.equal(amount);

            // store.darknodeBalances should return the same as dnp.darknodeBalances
            (await store.darknodeBalances(darknode1, dai.address))
                .should.bignumber.equal(darknode1Balance);
        });

        it("can be paid ETH from a payee", async () => {
            // register ETH
            await dnp.registerToken(ETHEREUM_TOKEN_ADDRESS);
            await waitForCycle();

            const previousReward = new BN(await dnp.currentCycleRewardPool(ETHEREUM_TOKEN_ADDRESS));
            const oldETHBalance = new BN(await store.totalBalance(ETHEREUM_TOKEN_ADDRESS));
            const amount = new BN("1000000000");
            await dnp.deposit(amount, ETHEREUM_TOKEN_ADDRESS).should.be.rejectedWith(/mismatched deposit value/);
            await dnp.deposit(amount, ETHEREUM_TOKEN_ADDRESS, { value: amount.toString(), from: accounts[0] });
            new BN(await store.totalBalance(ETHEREUM_TOKEN_ADDRESS)).should.bignumber.equal(oldETHBalance.add(amount));
            // We should have increased the reward pool
            const newReward = new BN(await dnp.currentCycleRewardPool(ETHEREUM_TOKEN_ADDRESS));
            newReward.should.bignumber.equal(previousReward.add(amount));

            // We should have zero claimed balance before ticking
            (new BN(await dnp.darknodeBalances(darknode1, ETHEREUM_TOKEN_ADDRESS))).should.bignumber.equal(new BN(0));

            // We don't need to claim since we weren't allocated rewards last cycle
            // But claim shouldn't revert
            await dnp.claim(darknode1);
            await waitForCycle();

            // We should be the only one who participated last cycle
            (new BN(await dnp.shareCount())).should.bignumber.equal(1);
            // We should be allocated all the rewards
            (new BN(await dnp.unclaimedRewards(ETHEREUM_TOKEN_ADDRESS))).should.bignumber.equal(newReward);
            (new BN(await dnp.previousCycleRewardShare(ETHEREUM_TOKEN_ADDRESS))).should.bignumber.equal(newReward);

            // Claim the rewards for last cycle
            await dnp.claim(darknode1);
            await waitForCycle();
            // There should be nothing left in the reward pool
            (new BN(await dnp.currentCycleRewardPool(ETHEREUM_TOKEN_ADDRESS))).should.bignumber.equal(new BN(0));
            const earnedRewards = new BN(await dnp.darknodeBalances(darknode1, ETHEREUM_TOKEN_ADDRESS));
            earnedRewards.should.bignumber.equal(newReward);

            const oldBalance = new BN(await web3.eth.getBalance(darknode1));
            await dnp.withdraw(darknode1, ETHEREUM_TOKEN_ADDRESS);

            // Our balances should have increased
            const newBalance = new BN(await web3.eth.getBalance(darknode1));
            newBalance.should.bignumber.equal(oldBalance.add(earnedRewards));

            // We should have nothing left to withdraw
            const postWithdrawRewards = new BN(await dnp.darknodeBalances(darknode1, ETHEREUM_TOKEN_ADDRESS));
            postWithdrawRewards.should.bignumber.equal(new BN(0));

            // Deregister ETH
            await dnp.deregisterToken(ETHEREUM_TOKEN_ADDRESS);
            await waitForCycle();
            (await dnp.registeredTokenIndex(ETHEREUM_TOKEN_ADDRESS)).should.bignumber.equal(0);
        });

        it("can pay out DAI when darknodes withdraw", async () => {
            const darknode1Balance = new BN(await dnp.darknodeBalances(darknode1, dai.address));
            darknode1Balance.gt(new BN(0)).should.be.true;
            await withdraw(darknode1);
        });

        it("cannot call tick twice in the same cycle", async () => {
            await dnp.claim(darknode1);
            await dnp.claim(darknode1).should.be.rejectedWith(/reward already claimed/);
        });

        it("can tick again after a cycle has passed", async () => {
            await dnp.claim(darknode1);
            await waitForCycle();
            await dnp.claim(darknode1);
        });

        it("should evenly split reward pool between ticked darknodes", async () => {
            const numDarknodes = 3;

            // Start from number 2 to avoid previous balances
            const startDarknode = 2;

            // Whitelist
            await multiTick(startDarknode, numDarknodes);
            // Change the epoch
            await waitForCycle();

            const rewards = new BN("300000000000000000");
            await depositDai(rewards);

            // Participate in rewards
            await multiTick(startDarknode, numDarknodes);
            // Change the epoch
            await waitForCycle();

            // Claim rewards for past epoch
            await multiTick(startDarknode, numDarknodes);

            for (let i = startDarknode; i < startDarknode + numDarknodes; i++) {
                (new BN(await dnp.darknodeBalances(accounts[i], dai.address)))
                    .should.bignumber.equal(rewards.div(new BN(await dnp.shareCount())));
            }

            // Withdraw for each darknode
            await multiWithdraw(startDarknode, numDarknodes);

            // claim rewards for darknode1
            await tick(darknode1);
        });

        it("can call withdrawMultiple", async () => {
            // Deposit DAI and ETH
            const rewards = new BN("300000000000000000");
            await depositDai(rewards);
            await dnp.registerToken(ETHEREUM_TOKEN_ADDRESS);
            await dnp.deposit(rewards, ETHEREUM_TOKEN_ADDRESS, { value: rewards.toString(), from: accounts[0] });

            // Participate in rewards
            await tick(darknode1);
            // Change the epoch
            await waitForCycle();

            // Claim rewards for past epoch
            await tick(darknode1);

            await waitForCycle();

            // Claim rewards for past epoch
            await tick(darknode1);

            // Withdraw for each darknode
            await dnp.withdrawMultiple(darknode1, [dai.address, ETHEREUM_TOKEN_ADDRESS]);
        });

        it("cannot withdraw if a darknode owner is invalid", async () => {
            await dnp.withdraw(NULL, dai.address).should.eventually.be.rejectedWith(/invalid darknode owner/);
            // accounts[0] is not a registered darknode
            await dnp.withdraw(accounts[0], dai.address).should.eventually.be.rejectedWith(/invalid darknode owner/);
        });

        it("cannot withdraw more than once in a cycle", async () => {
            const numDarknodes = 4;
            new BN(await dnp.shareCount()).should.bignumber.equal(numDarknodes);

            const rewards = new BN("300000000000000000");
            await depositDai(rewards);
            await multiTick(1, numDarknodes);
            // Change the epoch
            await waitForCycle();

            // Claim rewards for past cycle
            await multiTick(1, numDarknodes);

            // First withdraw should pass
            await withdraw(darknode1);

            // Rest should fail
            await dnp.withdraw(darknode1, dai.address).should.be.rejectedWith(/nothing to withdraw/);
            await dnp.withdraw(darknode1, dai.address).should.be.rejectedWith(/nothing to withdraw/);
        });

        it("cannot tick if it is blacklisted", async () => {
            // Should succeed if not blacklisted
            await tick(darknode2);

            await dnp.blacklist(darknode2);

            // Change the epoch
            await waitForCycle();

            // Tick should fail
            await tick(darknode2).should.be.rejectedWith(/darknode is blacklisted/);
        });

        it("can still withdraw allocated rewards when blacklisted", async () => {
            // Change the epoch
            await waitForCycle();
            // Change the epoch
            await waitForCycle();
            // Add rewards into the next cycle's pool
            (await store.isWhitelisted(darknode3)).should.be.true;
            const previousBalances = (new BN(await dnp.darknodeBalances(darknode3, dai.address)));

            const rewards = new BN("300000000000000000");
            await depositDai(rewards);
            // Change the epoch
            await waitForCycle();

            // Claim the rewards for the pool
            await tick(darknode3);

            const rewardSplit = new BN(await dnp.shareCount());

            // Claim rewards for past cycle
            await dnp.blacklist(darknode3);

            const newBalances = (new BN(await dnp.darknodeBalances(darknode3, dai.address)));
            newBalances.should.bignumber.equal(previousBalances.add(rewards.div(rewardSplit)));

            withdraw(darknode3);
        });

    });

    describe("Black/whitelisting of Darknodes", async () => {

        it("should revert if unauthorized to call blacklist", async () => {
            await store.isBlacklisted(darknode1).should.eventually.be.false;
            await dnp.blacklist(darknode1, { from: accounts[2] }).should.be.rejectedWith(/not Blacklister/);
            await store.isBlacklisted(darknode1).should.eventually.be.false;
        });

        it("should disallow unauthorized updates to blacklister address", async () => {
            await dnp.updateBlacklister(accounts[2], { from: accounts[2] }).should.be.rejected;
        });

        it("can update the blacklister address", async () => {
            await store.isBlacklisted(darknode4).should.eventually.be.false;
            await dnp.updateBlacklister(accounts[2]).should.be.not.rejectedWith(/invalid contract address/);
            await waitForCycle();
            await dnp.blacklist(darknode4, { from: accounts[2] });
            await store.isBlacklisted(darknode4).should.eventually.be.true;
            await dnp.updateBlacklister(owner).should.be.not.rejectedWith(/invalid contract address/);
            await waitForCycle();
        });

        it("cannot update the blacklister address to an invalid address", async () => {
            await dnp.updateBlacklister(NULL).should.be.rejectedWith(/invalid contract address/);
        });

        it("cannot blacklist invalid addresses", async () => {
            const invalidAddress = NULL;
            await store.isBlacklisted(invalidAddress).should.eventually.be.false;
            await dnp.blacklist(invalidAddress).should.be.rejectedWith(/darknode is not registered/);
            await store.isBlacklisted(owner).should.eventually.be.false;
            await dnp.blacklist(owner).should.be.rejectedWith(/darknode is not registered/);
        });

        it("should reject white/blacklist attempts from non-store contract", async () => {
            await store.isBlacklisted(darknode1).should.eventually.be.false;
            await dnp.blacklist(darknode1, { from: darknode1 }).should.be.rejectedWith(/not Blacklister/);
            await store.isBlacklisted(darknode1).should.eventually.be.false;
            await store.isWhitelisted(darknode5).should.eventually.be.false;
            await store.whitelist(darknode5, { from: darknode1 }).should.be.rejected;
            await store.isWhitelisted(darknode5).should.eventually.be.false;
        });

        it("can blacklist darknodes", async () => {
            await store.isBlacklisted(darknode5).should.eventually.be.false;
            await dnp.blacklist(darknode5);
            await store.isBlacklisted(darknode5).should.eventually.be.true;
        });

        it("cannot blacklist already blacklisted darknodes", async () => {
            await store.isBlacklisted(darknode5).should.eventually.be.true;
            await dnp.blacklist(darknode5).should.be.rejectedWith(/darknode already blacklisted/);
            await store.isBlacklisted(darknode5).should.eventually.be.true;
        });

        it("cannot whitelist blacklisted darknodes", async () => {
            await store.isBlacklisted(darknode5).should.eventually.be.true;
            await dnp.blacklist(darknode5).should.be.rejectedWith(/darknode already blacklisted/);
            await dnp.claim(darknode5).should.be.rejectedWith(/darknode is blacklisted/);
        });

    });

    describe("Changing cycles", async () => {

        it("cannot change cycle if insufficient time has passed", async () => {
            await waitForCycle(DARKNODE_PAYMENT_CYCLE_DURATION_SECONDS / 4)
                .should.eventually.be.rejectedWith(/cannot cycle yet: too early/);
        });

        it("should disallow unauthorized changes to cycle duration", async () => {
            await dnp.updateCycleDuration(4, { from: accounts[3] }).should.eventually.be.rejected;
        });

        it("can change cycle duration", async () => {
            // Set the duration to 3 days
            await changeCycleDuration(3 * day);
        });

        it("should error when block number has not changed", async () => {
            // Set the duration to 0 days
            await changeCycleDuration(0);
            await cc.changeCycle().should.eventually.be.rejectedWith(/no new block/);
            // Reset the duration back to normal
            await changeCycleDuration(DARKNODE_PAYMENT_CYCLE_DURATION_SECONDS);
        });

    });

    describe("Transferring ownership", async () => {
        it("should disallow unauthorized transferring of ownership", async () => {
            await dnp.transferStoreOwnership(accounts[1], { from: accounts[1] }).should.eventually.be.rejected;
            await dnp.claimStoreOwnership({ from: accounts[1] }).should.eventually.be.rejected;
        });

        it("can transfer ownership of the darknode payment store", async () => {
            // [ACTION] Initiate ownership transfer to wrong account
            await dnp.transferStoreOwnership(accounts[1]);

            // [ACTION] Can correct ownership transfer
            await dnp.transferStoreOwnership(owner);

            // [CHECK] Owner should still be dnp
            (await store.owner()).should.equal(dnp.address);

            // [ACTION] Claim ownership
            await store.claimOwnership();

            // [CHECK] Owner should now be main account
            (await store.owner()).should.equal(owner);

            // [RESET] Initiate ownership transfer back to dnp
            await store.transferOwnership(dnp.address);

            // [CHECK] Owner should still be main account
            (await store.owner()).should.equal(owner);

            // [RESET] Claim ownership
            await dnp.claimStoreOwnership();

            // [CHECK] Owner should now be the dnp
            (await store.owner()).should.equal(dnp.address);
        });
    });

    describe("DarknodePaymentStore negative tests", async () => {
        // Transfer the ownership to owner
        before(async () => {
            // [ACTION] Can correct ownership transfer
            await dnp.transferStoreOwnership(owner);
            // [ACTION] Claim ownership
            await store.claimOwnership();
            // [CHECK] Owner should now be main account
            (await store.owner()).should.equal(owner);
        });

        it("cannot whitelist blacklisted darknodes", async () => {
            await store.isBlacklisted(darknode5).should.eventually.be.true;
            await store.whitelist(darknode5).should.eventually.be.rejectedWith(/darknode is blacklisted/);
        });

        it("cannot whitelist already whitelisted darknodes", async () => {
            await store.isWhitelisted(darknode1).should.eventually.be.true;
            await store.whitelist(darknode1).should.eventually.be.rejectedWith(/darknode already whitelisted/);
        });

        it("cannot increment balances by an invalid amounts", async () => {
            await store.incrementDarknodeBalance(darknode1, dai.address, 0)
                .should.eventually.be.rejectedWith(/invalid amount/);
            const invalidAmount = new BN(await store.availableBalance(dai.address)).add(new BN(1));
            await store.incrementDarknodeBalance(darknode1, dai.address, invalidAmount)
                .should.eventually.be.rejectedWith(/insufficient contract balance/);
        });

        it("cannot transfer more than is in the balance", async () => {
            const invalidAmount = new BN(await dnp.darknodeBalances(darknode1, dai.address)).add(new BN(1));
            await store.transfer(darknode1, dai.address, invalidAmount, darknode1)
                .should.eventually.be.rejectedWith(/insufficient darknode balance/);
        });

        it("cannot call functions from non-owner", async () => {
            await store.blacklist(darknode1, { from: accounts[2] }).should.eventually.be.rejected;
            await store.whitelist(darknode1, { from: accounts[2] }).should.eventually.be.rejected;
            await store.incrementDarknodeBalance(darknode1, dai.address, new BN(0), { from: accounts[2] })
                .should.eventually.be.rejected;
            await store.transfer(darknode1, dai.address, new BN(0), darknode1, { from: accounts[2] })
                .should.eventually.be.rejected;
            await store.transferOwnership(dnp.address, { from: accounts[2] }).should.eventually.be.rejected;
        });

        // Transfer the ownership back to DNP
        after(async () => {
            // [RESET] Initiate ownership transfer back to dnp
            await store.transferOwnership(dnp.address);
            // [RESET] Claim ownership
            await dnp.claimStoreOwnership();
            // [CHECK] Owner should now be the dnp
            (await store.owner()).should.equal(dnp.address);
        });
    });

    const tick = async (address: string) => {
        return dnp.claim(address);
    };

    const multiTick = async (start = 1, numberOfDarknodes = 1) => {
        for (let i = start; i < start + numberOfDarknodes; i++) {
            await tick(accounts[i]);
        }
    };

    const withdraw = async (address: string) => {
        // Our claimed amount should be positive
        const earnedDAIRewards = new BN(await dnp.darknodeBalances(address, dai.address));
        earnedDAIRewards.gt(new BN(0)).should.be.true;

        const oldDAIBalance = new BN(await dai.balanceOf(address));

        await dnp.withdraw(address, dai.address);

        // Our balances should have increased
        const newDAIBalance = new BN(await dai.balanceOf(address));
        newDAIBalance.should.bignumber.equal(oldDAIBalance.add(earnedDAIRewards));

        // We should have nothing left to withdraw
        const postWithdrawRewards = new BN(await dnp.darknodeBalances(address, dai.address));
        postWithdrawRewards.should.bignumber.equal(new BN(0));
    };

    const multiWithdraw = async (start = 1, numberOfDarknodes = 1) => {
        for (let i = start; i < start + numberOfDarknodes; i++) {
            await withdraw(accounts[i]);
        }
    };

    const depositDai = async (amount: number | BN | string) => {
        const amountBN = new BN(amount);
        const previousBalance = new BN(await dnp.currentCycleRewardPool(dai.address));
        // Approve the contract to use DAI
        await dai.approve(dnp.address, amountBN);
        await dnp.deposit(amountBN, dai.address);
        // We should expect the DAI balance to have increased by what we deposited
        (await dnp.currentCycleRewardPool(dai.address)).should.bignumber.equal(previousBalance.add(amountBN));
    };

    const changeCycleDuration = async (timeInSeconds: number) => {
        const currentCycleDurationInSeconds = new BN(await dnp.cycleDuration()).toNumber();

        await dnp.updateCycleDuration(timeInSeconds);
        (await dnp.cycleDuration()).should.bignumber.equal(timeInSeconds);

        // put into effect the new cycle duration
        await increaseTime(currentCycleDurationInSeconds);
        await dnp.changeCycle();
        if (timeInSeconds === 0) {
            await dnp.changeCycle();
            return;
        }

        await dnp.changeCycle().should.eventually.be.rejectedWith(/cannot cycle yet: too early/);

        if (timeInSeconds < currentCycleDurationInSeconds) {
            await increaseTime(timeInSeconds);
            await dnp.changeCycle();
        } else {
            await increaseTime(currentCycleDurationInSeconds);
            await dnp.changeCycle().should.eventually.be.rejectedWith(null, /cannot cycle yet: too early/);
            await increaseTime(timeInSeconds - currentCycleDurationInSeconds);
            await dnp.changeCycle();
        }
    };

    const waitForCycle = async (seconds?: number) => {
        const timeout = new BN(await dnp.cycleTimeout());
        const now = new BN(await cc.time());
        if (seconds === undefined) {
            // seconds = (new BN(await dnp.cycleDuration()).toNumber());
            seconds = Math.max(1, (timeout).sub(now).toNumber());
        }
        await increaseTime(seconds);
        await dnp.changeCycle();
    };
});
