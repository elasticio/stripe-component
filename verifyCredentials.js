var request = require('request');
var stripeFactory = require("stripe");
var path = 'users/myself';

module.exports = verify;

function verify(credentials, cb) {
    if (!credentials || !credentials.apiKey) {
        return cb(null, {verified: false});
    }

    var stripe = stripeFactory(credentials.apiKey);

    stripe.accounts.retrieve(null, onResponse);

    function onResponse(err, data) {
        if (!err && data && data.object) {
           return cb(null, {verified: true});
        }
        return cb(err, {verified: false});
    }
}
