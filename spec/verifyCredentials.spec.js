describe('verify credentials', function () {
    var nock = require('nock');
    var verify = require('../verifyCredentials');
    var cb;
    var clientData = {
        "id": "acct_",
        "email": "ko@gmail.com",
        "statement_descriptor": null,
        "display_name": null,
        "timezone": "Etc/UTC",
        "details_submitted": false,
        "charges_enabled": false,
        "transfers_enabled": false,
        "currencies_supported": ["usd"],
        "default_currency": "usd",
        "country": "US",
        "object": "account",
        "business_name": null,
        "business_url": null,
        "support_phone": null,
        "business_logo": null,
        "managed": false
    };
    var credentials = { apiKey: 'key' };

    beforeEach(function() {
        cb = jasmine.createSpy('cb');
    });

    it('should verify case', function () {
        nock('https://api.stripe.com:443')
            .get('/v1/account')
            .reply(200, clientData);

        runs(function() {
            verify(credentials, cb);
        });

        waitsFor(function() {
            return cb.calls.length === 1;
        });

        runs(function() {
            var calls = cb.calls;

            expect(calls[0].args[1]).toEqual({ verified : true });
        });
    });

    it('should not verify case', function () {
        nock('https://api.stripe.com:443')
            .get('/v1/account')
            .reply(404);

        runs(function() {
            verify(credentials, cb);
        });

        waitsFor(function() {
            return cb.calls.length === 1;
        });

        runs(function() {
            var calls = cb.calls;

            expect(calls[0].args[1]).toEqual({ verified : false });
        });
    });
});