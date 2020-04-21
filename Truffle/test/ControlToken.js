let ControlToken = artifacts.require("./ControlToken.sol");

contract('ControlToken', async function (accounts) {
    let tokenInstance;

    // Deploy a new contract before each test
    beforeEach(async () => {
        tokenInstance = await ControlToken.new({from: accounts[0]});
    });

    it('initializes the contract with the correct values', async function () {
        await tokenInstance.name()
            .then(function (name) {
                assert.equal(name, 'ControlToken', 'Name is correct');
                return tokenInstance.symbol();
            }).then(function (symbol) {
                assert.equal(symbol, 'CONT', 'Symbol is correct');
            });
    });

    it('Get Token and reset work as they should', async function () {
        await tokenInstance.getTokens({from: accounts[1]}).catch(function (err) {
            assert.equal(err, null, "Account should be able to get tokens")
        });

        let b = await tokenInstance.balanceOf(accounts[1]);
        await assert.equal(b.toNumber(), 200, "Should get 200 Tokens");

        await tokenInstance.getTokens({from: accounts[1]}).catch(function (err) {
            assert.notEqual(err, null, "Trying to get Tokens twice is not allowed")
        });
        await tokenInstance.reset({from: accounts[1]}).catch(function (err) {
            assert.notEqual(err, null, "Non-admin shouldn't be allowed to reset")
        });
        await tokenInstance.reset({from: accounts[0]}).catch(function (err) {
            assert.equal(err, null, "Admin should be allowed to reset")
        });

        assert.equal(await tokenInstance.today(), 1, "Day should be 1 later after reset");
        await tokenInstance.getTokens({from: accounts[1]}).catch(function (err) {
            assert.equal(err, null, "Account should be able to get tokens after reset")
        });

        b = await tokenInstance.balanceOf(accounts[1]);
        await assert.equal(b.toNumber(), 400, "Should get another 200 Tokens equaling 400");

    });

    it('Buy hours works as it should', async function () {

        await tokenInstance.reset({from: accounts[0]});
        await tokenInstance.getTokens({from: accounts[2]}).catch(function (err) {
            assert.equal(err, null, "Account should be able to get tokens")
        });

        let normalB = await tokenInstance.balanceOf(accounts[2]);
        let adminB = await tokenInstance.balanceOf(accounts[0]);
        await assert.equal(normalB.toNumber(), 200, "Should get 200 Tokens");

        await tokenInstance.buyHours(200, "someOTP", {from: accounts[2]});

        let normalBNew = await tokenInstance.balanceOf(accounts[2]);
        let adminBNew = await tokenInstance.balanceOf(accounts[0]);

        await assert.equal(normalBNew.toNumber(), normalB.toNumber() - 200,
            "Should have spent 200 Tokens");
        await assert.equal(adminBNew.toNumber(), adminB.toNumber() + 200,
            "Admin should get 200 Tokens");

        await tokenInstance.buyHours(200, {from: accounts[2]}).catch(function (err) {
            assert.notEqual(err, null,
                "Account should not be able to spend more tokens than it has")
        });
    });


    it('Events are fired correctly', async function () {
        await tokenInstance.reset({from: accounts[0]});
        await tokenInstance.getTokens({from: accounts[2]}).catch(function (err) {
            assert.equal(err, null, "Account should be able to get tokens")
        });

        await tokenInstance.getPastEvents("Mint", {fromBlock: "latest"}).then(function (events) {
            assert.equal(events.length, 1, "Exactly one mint event should be fired")
            assert.equal(events[0].returnValues._value, 200, "Value should be correct in fired event")
            assert.equal(events[0].returnValues._receiver, accounts[2], "Receiver should be correct in fired event")
        })

        await tokenInstance.buyHours(200, "someOTP", {from: accounts[2]});

        await tokenInstance.getPastEvents("Unlock", {fromBlock: "latest"}).then(function (events) {
            assert.equal(events.length, 1, "Exactly one unlock event should be fired")
            assert.equal(events[0].returnValues._otp, "someOTP", "Otp should be printed in event")
            assert.equal(events[0].returnValues._value, 200, "Value should be correct in fired event")
            assert.equal(events[0].returnValues._from, accounts[2], "Sender should be correct")
        })
    });

});
