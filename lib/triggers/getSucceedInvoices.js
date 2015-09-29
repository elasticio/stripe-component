var stripeFactory = require("stripe");
var Q = require('q');
var elasticio = require('elasticio-node');
var messages = elasticio.messages;
var moment = require('moment');

exports.process = getInvoices;

function getInvoices(msg, cfg, next, snapshot) {
    var stripe = stripeFactory(cfg.apiKey);
    var that = this;

    var options = {
        type: 'invoice.payment_succeeded',
        limit: 5
    };

    if (snapshot && snapshot.lastId) {
        var lastId = snapshot.lastId;
        options.ending_before = lastId;

        console.log("Retrieving events for succeeded payments since ID:", lastId);
    }

    stripe.events.list(options, eventsGot);

    function eventsGot(err, events) {
        if (err) {
            return handleError(err);
        }
        if (!events || !events.data || events.data.length === 0) {
            return end();
        }

        snapshot.lastId = events.data[0].id;
        that.emit('snapshot', snapshot);

        console.log("Next time will retrieve events for succeeded payments after ID", snapshot.lastId);

        var promises = events.data
            .filter(skipTotalZeroInvoices)
            .map(expandCustomer);

        Q.all(promises)
        .then(sendResponse)
        .fail(handleError);
    }

    function sendResponse(invoices) {
        invoices.forEach(emitInvoice);
        end();

        function emitInvoice(invoice) {
            invoice.total /= 100;
            invoice.subtotal /= 100;
            invoice.lines = invoice.lines.data;
            invoice.lines.forEach(formatLine);
            invoice.date = formatDate(invoice.date, "YYYY-MM-DD"); // formating for billomat
            that.emit('data', messages.newMessageWithBody(invoice));
        }

        function formatLine(line) {
            line.amount /= 100; // stripe returns amount in cents

            var period = line.period;

            line.description = line.plan.name
                + ' Plan '
                + formatDateDe(period.start)
                + ' - '
                + formatDateDe(period.end);
        }

        function formatDateDe(value) {
            return formatDate(value, 'DD.MM.YYYY');
        }

        function formatDate(value, format) {
            return moment(value * 1000).format(format);
        }
    }

    function skipTotalZeroInvoices(event) {
        var invoice = event.data.object;

        if (invoice.total === 0) {
            console.log("Skipping invoice '%s' as its total=0", invoice.id);
            return false;
        }

        return true;
    }

    function expandCustomer(event) {
        var deferred = Q.defer();
        var invoice = event.data.object;
        var customerId = invoice.customer;

        console.log("Expanding customer (ID=%s) for invoice (ID=%s)", customerId, invoice.id);

        stripe.customers.retrieve(customerId, {
            expand: ['default_card']
        }, customerGot);

        function customerGot(err, customer) {
            if (err) {
                return deferred.reject(err);
            }
            invoice.customer = customer;
            return deferred.resolve(invoice);
        }
        return deferred.promise;
    }

    function handleError(err) {
        that.emit('error', err);
        end();
    }

    function end() {
        that.emit('end');
    }
}