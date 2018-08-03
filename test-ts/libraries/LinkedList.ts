const linkedListTest = artifacts.require("LinkedListTest.sol");

import { ID, NULL } from "../helper/testUtils";

contract("LinkedList", function () {

    let linkedList;

    const [NODE1, NODE2, NODE3, NODE4, NOT_NODE1, NOT_NODE2] =
        [ID("1"), ID("2"), ID("3"), ID("4"), ID("NOT1"), ID("NOT2")];

    before(async function () {
        linkedList = await linkedListTest.new();
    });

    it("can append", async function () {
        await linkedList.append(NODE1);
        (await linkedList.isInList.call(NODE1)).should.equal(true);
    });

    it("can prepend", async () => {
        await linkedList.prepend(NODE2);
        (await linkedList.previous.call(NODE1))
            .should.equal(NODE2);
    });

    it("can swap", async () => {
        await linkedList.swap(NODE1, NODE2);
        (await linkedList.previous.call(NODE2)).should.equal(NODE1);
    });

    it("can insertAfter", async () => {
        await linkedList.insertAfter(NODE2, NODE4);
        (await linkedList.next.call(NODE2)).should.equal(NODE4);
    });

    it("can insertBefore", async () => {
        await linkedList.insertBefore(NODE4, NODE3);
        (await linkedList.previous.call(NODE4)).should.equal(NODE3);
    });

    it("can remove", async () => {
        await linkedList.remove(NODE4);
        (await linkedList.isInList.call(NODE4)).should.equal(false);
    });

    it("can get previous node of the given node", async () => {
        (await linkedList.previous.call(NODE2)).should.equal(NODE1);
    });

    it("can get following node of the given node", async () => {
        (await linkedList.next.call(NODE1)).should.equal(NODE2);
    });

    it("can get the last node of the given list", async () => {
        (await linkedList.end.call()).should.equal(NODE3);
    });

    it("can get the first node of the given list", async () => {
        (await linkedList.begin.call()).should.equal(NODE1);
    });

    it("handle removing NULL", async () => {
        await linkedList.insertBefore(NODE1, NULL).should.not.be.rejected;
        await linkedList.remove(NULL).should.not.be.rejected;
    });

    it("should not add the same value more than once", async () => {
        await linkedList.append(NODE1).should.be.rejectedWith(null, /already in list/);
    });

    it("should not remove a node not in the list", async () => {
        await linkedList.remove(NOT_NODE1).should.be.rejectedWith(null, /not in list/);
    });

    it("should not insert after a node not in the list", async () => {
        await linkedList.insertAfter(NOT_NODE1, NOT_NODE2).should.be.rejectedWith(null, /not in list/);
    });

    it("should not insert before a node not in the list", async () => {
        await linkedList.insertBefore(NOT_NODE1, NOT_NODE2).should.be.rejectedWith(null, /not in list/);
    });

    it("should not insert a node aldready in the list", async () => {
        await linkedList.insertAfter(NODE2, NODE3).should.be.rejectedWith(null, /already in list/);
    });

    it("should not insert a node already in the list", async () => {
        await linkedList.insertBefore(NODE3, NODE2).should.be.rejectedWith(null, /already in list/);
    });

    it("should not prepend a value that aldready exists", async () => {
        await linkedList.prepend(NODE2).should.be.rejectedWith(null, /already in list/);
    });

    it("should not swap a node not in the list, and a node in the list", async () => {
        await linkedList.swap(NOT_NODE1, NODE2).should.be.rejectedWith(null, /not in list/);
    });

    it("should not swap a node in the list, and a node not in the list", async () => {
        await linkedList.swap(NODE2, NOT_NODE1).should.be.rejectedWith(null, /not in list/);
    });

    it("should not swap two nodes that are not in the list", async () => {
        await linkedList.swap(NOT_NODE1, NOT_NODE2).should.be.rejectedWith(null, /not in list/);
    });

    it("should not get previous node of the node if it is not in the list", async () => {
        // NOTE: The revert reason isn't available for .call
        await linkedList.previous.call(NOT_NODE1).should.be.rejectedWith(null, /revert/); // not in list
    });

    it("should not get following node of the given node if it is not in the list", async () => {
        // NOTE: The revert reason isn't available for .call
        await linkedList.next.call(NOT_NODE1).should.be.rejectedWith(null, /revert/); // not in list
    });

});
