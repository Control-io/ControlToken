let ControlToken = artifacts.require("./ControlToken.sol");

contract('ControlToken', async function (accounts) {
    let tokenInstance;

    it('initializes the contract with the correct values', function () {
        return ControlToken.deployed().then(function (instance) {
            tokenInstance = instance;
            return tokenInstance.name();
        }).then(function (name) {
            assert.equal(name, 'ControlToken', 'Name is correct');
            return tokenInstance.symbol();
        }).then(function (symbol) {
            assert.equal(symbol, 'CONT', 'Symbol is correct');
        });
    });

    it('allocates the initial supply upon deployment', function () {
        return ControlToken.deployed().then(function (instance) {
            tokenInstance = instance;
            return tokenInstance.totalSupply();
        }).then(function (totalSupply) {
            assert.equal(totalSupply.toNumber(), 1000000, 'sets the total supply to 1,000,000');
            return tokenInstance.balanceOf(accounts[0]);
        }).then(function (adminBalance) {
            assert.equal(adminBalance.toNumber(), 1000000, 'it allocates the initial supply to the admin account');
        });
    });

    it('Get Token and reset work as they should', function () {
        return ControlToken.deployed().then(async function (instance) {
            let i = instance;
            await i.getTokens({from: accounts[1]}).catch(function (err) {
                assert.equal(err, null, "Account should be able to get tokens")
            });

            let b = await i.balanceOf(accounts[1]);
            await assert.equal(b.toNumber(), 48, "Should get 48 Tokens");

            await i.getTokens({from: accounts[1]}).catch(function (err) {
                assert.notEqual(err, null, "Trying to get Tokens twice is not allowed")
            });
            await i.reset({from: accounts[1]}).catch(function (err) {
                assert.notEqual(err, null, "Non-admin shouldn't be allowed to reset")
            });
            await i.reset({from: accounts[0]}).catch(function (err) {
                assert.equal(err, null, "Admin should be allowed to reset")
            });

            assert.equal(await i.today(),1, "Day should be 1 later after reset");
            await i.getTokens({from: accounts[1]}).catch(function (err) {
                assert.equal(err, null, "Account should be able to get tokens after reset")
            });

            b = await i.balanceOf(accounts[1]);
            await assert.equal(b.toNumber(), 96, "Should get another 48 Tokens");

        });
    });

    it('Buy hours works as it should', function () {
        return ControlToken.deployed().then(async function (instance) {
            let i = instance;

            await i.reset({from: accounts[0]});
            await i.getTokens({from: accounts[2]}).catch(function (err) {
                assert.equal(err, null, "Account should be able to get tokens")
            });

            let normalB = await i.balanceOf(accounts[2]);
            let adminB = await i.balanceOf(accounts[0]);
            await assert.equal(normalB.toNumber(), 48, "Should get 48 Tokens");

            await i.buyHours(48, {from: accounts[2]});

            let normalBNew = await i.balanceOf(accounts[2]);
            let adminBNew = await i.balanceOf(accounts[0]);

            await assert.equal(normalBNew.toNumber(), normalB.toNumber() - 48,
                "Should have spent 48 Tokens");
            await assert.equal(adminBNew.toNumber(), adminB.toNumber() + 48,
                "Admin should get 48 Tokens");

            await i.buyHours(48, {from: accounts[2]}).catch(function (err) {
                assert.notEqual(err, null,
                    "Account should not be able to spend more tokens than it has")
            });
        });
    });
});
