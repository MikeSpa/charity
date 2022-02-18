
import { Clarinet, Tx, Chain, Account, types } from 'https://deno.land/x/clarinet@v0.14.0/index.ts';
import { assertEquals } from 'https://deno.land/std@0.90.0/testing/asserts.ts';

Clarinet.test({
    name: "Ensure that adding/removing charity works",
    async fn(chain: Chain, accounts: Map<string, Account>) {

        let deployer = accounts.get('deployer')!;
        let wallet1 = accounts.get("wallet_1")!;
        let wallet2 = accounts.get("wallet_2")!;
        let wallet3 = accounts.get("wallet_3")!;

        let assetsMaps = chain.getAssetsMaps();
        const balance1 = assetsMaps.assets["STX"][wallet1.address];
        const balance2 = assetsMaps.assets["STX"][wallet2.address];
        const balance3 = assetsMaps.assets["STX"][wallet3.address];

        let block = chain.mineBlock([
            Tx.contractCall("charity-board", "add-charity", [types.ascii("dog_shelter"), types.principal(wallet1.address)], deployer.address),
            Tx.contractCall("charity-board", "add-charity", [types.ascii("cat_shelter"), types.principal(wallet2.address)], wallet2.address),
            // Tx.contractCall("charity-board", "donate", ["dog_shelter", types.uint(300)], wallet_3.address),
            // Tx.contractCall("charity-board", "donate", ["dog_shelter", types.uint(300)], wallet_2.address),
            // Tx.contractCall("charity-board", "withdraw", ["dog_shelter"], wallet1.address),
            // Tx.contractCall("charity-board", "get-balance-total", [], wallet1.address),
        ]);



        assertEquals(block.receipts.length, 2);
        assertEquals(block.height, 2);

        let balance = chain.callReadOnlyFn('charity-board', 'get-balance-total', [], deployer.address);
        balance.result.expectOk().expectUint(0);

        let numberCharity = chain.callReadOnlyFn('charity-board', 'get-number-charity', [], deployer.address);
        numberCharity.result.expectOk().expectUint(2);
        // block.receipts[0].result.expectOk().expectUtf8("Charity added");
        // block.receipts[4].result.expectOk().expectUint(0);
        // const balance1_now = assetsMaps.assets["STX"][wallet1.address];
        // assertEquals(balance1_now, balance1 + 300 + 300);

        block = chain.mineBlock([
            Tx.contractCall("charity-board", "remove-charity", [types.ascii("cat_shelter")], wallet2.address),
        ]);
        assertEquals(block.receipts.length, 1);
        assertEquals(block.height, 3);

        numberCharity = chain.callReadOnlyFn('charity-board', 'get-number-charity', [], deployer.address);
        numberCharity.result.expectOk().expectUint(1);
    },
});
