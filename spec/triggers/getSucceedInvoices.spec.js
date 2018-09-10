describe('stripe get succeed invoices', function () {
    var allInvoicesInJSON = require('../data/all_invoices_in.json');
    var hasTotalZeroInvoicesJSON = require('../data/has_total_zero_invoices.json');
    var elasticio = require('elasticio-node');
    var messages = elasticio.messages;
    var nock = require('nock');
    var processTrigger = require('../../lib/triggers/getSucceedInvoices.js');
    var msg = messages.newMessageWithBody({});
    var cfg = {
        apiKey: 'sampleKey'
    };

    var self;

    beforeEach(function() {
        self = jasmine.createSpyObj('self',['emit']);
    });

    it('should process invoices', function () {
        nock('https://api.stripe.com:443')
            .get('/v1/events', 'type=invoice.payment_succeeded&limit=5')
            .reply(200, allInvoicesInJSON)
            .get('/v1/customers/1')
            .reply(200, {metadata: {vat_id: 1}})
            .get('/v1/customers/2')
            .reply(200, {metadata: {vat_id: 2}})
            .get('/v1/customers/3')
            .reply(200, {metadata: {vat_id: 3}});
        
        runs(function(){
            processTrigger.process.call(self, msg, cfg, {});
        });

        waitsFor(function(){
            return self.emit.calls.length === 5;
        });

        runs(function(){
            var calls = self.emit.calls;

            expect(calls[0].args[1]).toEqual({lastId : 'evt_15FOhn2eZvKYlo2CdTvYQvKO'});

            var invoice1 = calls[1].args[1].body;
            var invoice2 = calls[2].args[1].body;
            var invoice3 = calls[3].args[1].body;

            expect(calls.length).toEqual(5);
            expect(invoice1.lines[0].amount).toEqual(1.5);
            expect(invoice1.tax_percent).toEqual(19);
            expect(invoice1.customer.metadata.vat_id).toEqual(1);
            expect(invoice1.total).toEqual(1.5);

            expect(invoice2.lines[0].amount).toEqual(5.6);
            expect(invoice2.tax_percent).toEqual(14);
            expect(invoice2.customer.metadata.vat_id).toEqual(2);
            expect(invoice2.total).toEqual(5.6);

            expect(invoice3.lines[0].amount).toEqual(0.27);
            expect(invoice3.tax_percent).toEqual(29);
            expect(invoice3.customer.metadata.vat_id).toEqual(3);
            expect(invoice3.total).toEqual(0.27);

            expect(calls[4].args[0]).toEqual('end');
        });
    });

    it('should process invoices since last ID', function () {
        nock('https://api.stripe.com:443')
            .get('/v1/events', 'type=invoice.payment_succeeded&limit=5&ending_before=evt_15Sl432licPf0ryOISZdYpxx')
            .reply(200, allInvoicesInJSON)
            .get('/v1/customers/1')
            .reply(200, {metadata: {vat_id: 1}})
            .get('/v1/customers/2')
            .reply(200, {metadata: {vat_id: 2}})
            .get('/v1/customers/3')
            .reply(200, {metadata: {vat_id: 3}});

        runs(function(){
            processTrigger.process.call(self, msg, cfg, {
                lastId : 'evt_15Sl432licPf0ryOISZdYpxx'
            });
        });

        waitsFor(function(){
            return self.emit.calls.length === 5;
        });

        runs(function(){
            var calls = self.emit.calls;

            expect(calls[0].args[1]).toEqual({lastId : 'evt_15FOhn2eZvKYlo2CdTvYQvKO'});

            var invoice1 = calls[1].args[1].body;
            var invoice2 = calls[2].args[1].body;
            var invoice3 = calls[3].args[1].body;

            expect(calls.length).toEqual(5);
            expect(invoice1.lines[0].amount).toEqual(1.5);
            expect(invoice1.tax_percent).toEqual(19);
            expect(invoice1.customer.metadata.vat_id).toEqual(1);
            expect(invoice1.total).toEqual(1.5);

            expect(invoice2.lines[0].amount).toEqual(5.6);
            expect(invoice2.tax_percent).toEqual(14);
            expect(invoice2.customer.metadata.vat_id).toEqual(2);
            expect(invoice2.total).toEqual(5.6);

            expect(invoice3.lines[0].amount).toEqual(0.27);
            expect(invoice3.tax_percent).toEqual(29);
            expect(invoice3.customer.metadata.vat_id).toEqual(3);
            expect(invoice3.total).toEqual(0.27);

            expect(calls[4].args[0]).toEqual('end');
        });
    });

    it('should filter out total=0 invoices', function () {
        nock('https://api.stripe.com:443')
            .get('/v1/events', 'type=invoice.payment_succeeded&limit=5')
            .reply(200, hasTotalZeroInvoicesJSON)
            .get('/v1/customers/1')
            .reply(200, {metadata: {vat_id: 1}})
            .get('/v1/customers/2')
            .reply(200, {metadata: {vat_id: 2}})
            .get('/v1/customers/3')
            .reply(200, {metadata: {vat_id: 3}});

        runs(function(){
            processTrigger.process.call(self, msg, cfg, {});
        });

        waitsFor(function(){
            return self.emit.calls.length === 3;
        });

        runs(function(){
            var calls = self.emit.calls;

            expect(calls[0].args[1]).toEqual({lastId : 'evt_15FOhn2eZvKYlo2CdTvYQvKO'});

            var invoice1 = calls[1].args[1].body;

            expect(calls.length).toEqual(3);
            expect(invoice1.lines[0].amount).toEqual(1.5);
            expect(invoice1.tax_percent).toEqual(19);
            expect(invoice1.total).toEqual(1.5);
            expect(invoice1.id).toEqual('in_15FNjx2eZvKYlo2Ct5RQ9GNR');

            expect(calls[2].args[0]).toEqual('end');
        });
    });

    it('should emit errors on request error', function () {
        nock('https://api.stripe.com:443')
            .get('/v1/events', "type=invoice.payment_succeeded&limit=5")
            .reply(401, { "error": {
                    "msg": "Resource not found.",
                    "statusCode": 401
                }
            });
        runs(function(){
            processTrigger.process.call(self, msg, cfg, {});
        });

        waitsFor(function(){
            return self.emit.calls.length === 2;
        });

        runs(function(){
            var calls = self.emit.calls;
            expect(calls.length).toEqual(2);
            expect(calls[0].args[0]).toEqual('error');
            expect(calls[0].args[1].raw).toEqual({"msg":"Resource not found.","statusCode":401,"headers":{"content-type":"application/json"}, "requestId":undefined});
            expect(calls[1].args).toEqual(['end']);
        });
    });
});