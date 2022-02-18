
import { Clarinet, Tx, Chain, Account, types } from 'https://deno.land/x/clarinet@v0.14.0/index.ts';
import { assertEquals } from 'https://deno.land/std@0.90.0/testing/asserts.ts';

Clarinet.test({
    name: "Ensure that adding/removing charity works",
    async fn(chain: Chain, accounts: Map<string, Account>) {

        let deployer = accounts.get('deployer')!;
        let wallet1 = accounts.get("wallet_1")!;
        let wallet2 = accounts.get("wallet_2")!;


        let block = chain.mineBlock([
            Tx.contractCall("charity-board", "add-charity", [types.ascii("dog_shelter"), types.principal(wallet1.address)], deployer.address),
            Tx.contractCall("charity-board", "add-charity", [types.ascii("cat_shelter"), types.principal(wallet2.address)], wallet2.address),
        ]);

        assertEquals(block.receipts.length, 2);
        assertEquals(block.height, 2);
        block.receipts[0].result.expectOk().expectAscii("Charity added");
        block.receipts[1].result.expectOk().expectAscii("Charity added");

        let balance = chain.callReadOnlyFn('charity-board', 'get-balance-total', [], deployer.address);
        balance.result.expectOk().expectUint(0);

        let numberCharity = chain.callReadOnlyFn('charity-board', 'get-number-charity', [], deployer.address);
        numberCharity.result.expectOk().expectUint(2);

        block = chain.mineBlock([
            Tx.contractCall("charity-board", "remove-charity", [types.ascii("cat_shelter")], wallet2.address),
        ]);
        assertEquals(block.receipts.length, 1);
        assertEquals(block.height, 3);
        block.receipts[0].result.expectOk().expectAscii("Charity removed");

        numberCharity = chain.callReadOnlyFn('charity-board', 'get-number-charity', [], deployer.address);
        numberCharity.result.expectOk().expectUint(1);
    },
});

Clarinet.test({
    name: "Ensure that donate works",
    async fn(chain: Chain, accounts: Map<string, Account>) {

        let deployer = accounts.get('deployer')!;
        let wallet1 = accounts.get("wallet_1")!;
        let wallet2 = accounts.get("wallet_2")!;
        let wallet3 = accounts.get("wallet_3")!;

        let assetsMaps = chain.getAssetsMaps();
        const deployer_before = assetsMaps.assets["STX"][deployer.address];
        const balance1_before = assetsMaps.assets["STX"][wallet1.address];
        const balance2_before = assetsMaps.assets["STX"][wallet2.address];
        const balance3_before = assetsMaps.assets["STX"][wallet3.address];

        let block = chain.mineBlock([
            Tx.contractCall("charity-board", "add-charity", [types.ascii("dog_shelter"), types.principal(wallet1.address)], deployer.address),
            Tx.contractCall("charity-board", "add-charity", [types.ascii("cat_shelter"), types.principal(wallet2.address)], wallet2.address),
            Tx.contractCall("charity-board", "donate", [types.ascii("dog_shelter"), types.uint(300)], wallet3.address),
            Tx.contractCall("charity-board", "donate", [types.ascii("dog_shelter"), types.uint(100)], wallet2.address),
            Tx.contractCall("charity-board", "donate", [types.ascii("cat_shelter"), types.uint(1000)], wallet3.address),
        ]);


        assertEquals(block.receipts.length, 5);
        assertEquals(block.height, 2);
        block.receipts[2].result.expectOk().expectAscii("Donation successful! Thank you");
        block.receipts[3].result.expectOk().expectAscii("Donation successful! Thank you");
        block.receipts[4].result.expectOk().expectAscii("Donation successful! Thank you");

        let balance = chain.callReadOnlyFn('charity-board', 'get-balance-total', [], deployer.address);
        balance.result.expectOk().expectUint(300 + 100 + 1000);

        let balance_dog_shelter = chain.callReadOnlyFn('charity-board', 'get-balance-charity', [types.ascii("dog_shelter")], deployer.address);
        balance_dog_shelter.result.expectOk().expectSome().expectUint(300 + 100);
        let balance_cat_shelter = chain.callReadOnlyFn('charity-board', 'get-balance-charity', [types.ascii("cat_shelter")], deployer.address);
        balance_cat_shelter.result.expectOk().expectSome().expectUint(1000);

        assetsMaps = chain.getAssetsMaps();
        const deployer_after = assetsMaps.assets["STX"][deployer.address];
        const balance1_after = assetsMaps.assets["STX"][wallet1.address];
        const balance2_after = assetsMaps.assets["STX"][wallet2.address];
        const balance3_after = assetsMaps.assets["STX"][wallet3.address];
        assertEquals(deployer_after, deployer_before);
        assertEquals(balance1_after, balance1_before);
        assertEquals(balance2_after, balance2_before - 100);
        assertEquals(balance3_after, balance3_before - 1300);


    },
});


Clarinet.test({
    name: "Ensure that withdraw works",
    async fn(chain: Chain, accounts: Map<string, Account>) {

        let deployer = accounts.get('deployer')!;
        let wallet1 = accounts.get("wallet_1")!;
        let wallet2 = accounts.get("wallet_2")!;
        let wallet3 = accounts.get("wallet_3")!;

        let assetsMaps = chain.getAssetsMaps();
        const deployer_before = assetsMaps.assets["STX"][deployer.address];
        const balance1_before = assetsMaps.assets["STX"][wallet1.address];
        const balance2_before = assetsMaps.assets["STX"][wallet2.address];
        const balance3_before = assetsMaps.assets["STX"][wallet3.address];

        let block = chain.mineBlock([
            Tx.contractCall("charity-board", "add-charity", [types.ascii("dog_shelter"), types.principal(wallet1.address)], deployer.address),
            Tx.contractCall("charity-board", "add-charity", [types.ascii("cat_shelter"), types.principal(wallet2.address)], wallet2.address),
            Tx.contractCall("charity-board", "donate", [types.ascii("dog_shelter"), types.uint(300)], wallet3.address),
            Tx.contractCall("charity-board", "donate", [types.ascii("dog_shelter"), types.uint(100)], wallet2.address),
            Tx.contractCall("charity-board", "donate", [types.ascii("cat_shelter"), types.uint(1000)], wallet3.address),
            Tx.contractCall("charity-board", "withdraw", [types.ascii("cat_shelter")], deployer.address),
        ]);


        assertEquals(block.receipts.length, 6);
        assertEquals(block.height, 2);
        block.receipts[5].result.expectOk().expectAscii("Withdraw successful");

        let balance = chain.callReadOnlyFn('charity-board', 'get-balance-total', [], deployer.address);
        balance.result.expectOk().expectUint(300 + 100);
        let balance_dog_shelter = chain.callReadOnlyFn('charity-board', 'get-balance-charity', [types.ascii("dog_shelter")], deployer.address);
        balance_dog_shelter.result.expectOk().expectSome().expectUint(300 + 100);
        let balance_cat_shelter = chain.callReadOnlyFn('charity-board', 'get-balance-charity', [types.ascii("cat_shelter")], deployer.address);
        balance_cat_shelter.result.expectOk().expectSome().expectUint(0);

        assetsMaps = chain.getAssetsMaps();
        const deployer_after = assetsMaps.assets["STX"][deployer.address];
        const balance1_after = assetsMaps.assets["STX"][wallet1.address];
        const balance2_after = assetsMaps.assets["STX"][wallet2.address];
        const balance3_after = assetsMaps.assets["STX"][wallet3.address];
        assertEquals(deployer_after, deployer_before);
        assertEquals(balance1_after, balance1_before);
        assertEquals(balance2_after, balance2_before - 100 + 1000);
        assertEquals(balance3_after, balance3_before - 1300);

        block = chain.mineBlock([
            Tx.contractCall("charity-board", "withdraw", [types.ascii("dog_shelter")], wallet1.address),
        ]);
        assertEquals(block.receipts.length, 1);
        assertEquals(block.height, 3);
        block.receipts[0].result.expectOk().expectAscii("Withdraw successful");

        balance = chain.callReadOnlyFn('charity-board', 'get-balance-total', [], deployer.address);
        balance.result.expectOk().expectUint(0);
        balance_dog_shelter = chain.callReadOnlyFn('charity-board', 'get-balance-charity', [types.ascii("dog_shelter")], deployer.address);
        balance_dog_shelter.result.expectOk().expectSome().expectUint(0);
        balance_cat_shelter = chain.callReadOnlyFn('charity-board', 'get-balance-charity', [types.ascii("cat_shelter")], deployer.address);
        balance_cat_shelter.result.expectOk().expectSome().expectUint(0);

        assetsMaps = chain.getAssetsMaps();
        const balance1_end = assetsMaps.assets["STX"][wallet1.address];
        assertEquals(balance1_end, balance1_after + 400);

    },
});