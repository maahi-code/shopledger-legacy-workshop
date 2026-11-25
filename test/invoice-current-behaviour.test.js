'use strict';

var test = require('node:test');
var assert = require('node:assert/strict');
var pricing = require('../lib/pricing');
var invoice = require('../lib/invoice');

test('invoice figures match the totals charged to the customer', function () {
  var items = [{ id: 1, name: 'Rice', sku: 'RICE', hsn: '1006', price: 640, qty: 1 }];
  var billed = pricing.computeTotals(items, '');
  var invoiceFigures = invoice.computeInvoiceFigures({
    items: items,
    coupon: '',
    subtotal: billed.subtotal,
    discount: billed.discount,
    tax: billed.tax,
    total: billed.total
  });

  assert.equal(invoiceFigures.subtotal, billed.subtotal);
  assert.equal(invoiceFigures.tax, billed.tax);
  assert.equal(invoiceFigures.total, billed.total);
  assert.equal(invoiceFigures.rows[0].gstPercent, 5);
});

test('CURRENT BEHAVIOUR: invoice applies the billed HSN GST rate', function () {
  var items = [{ id: 1, name: 'Rice', sku: 'RICE', hsn: '1006', price: 100, qty: 1 }];
  var billed = pricing.computeTotals(items, '');
  var invoiceFigures = invoice.computeInvoiceFigures({ items: items });

  assert.equal(billed.tax, 5);
  assert.equal(billed.total, 105);
  assert.equal(invoiceFigures.rows[0].gstPercent, 5);
  assert.equal(invoiceFigures.tax, 5);
  assert.equal(invoiceFigures.total, 105);
});

test('CURRENT BEHAVIOUR: invoice applies the same coupon discount and tax as order pricing', function () {
  var items = [{ id: 1, name: 'Staples', hsn: '1006', price: 1000, qty: 1 }];
  var billed = pricing.computeTotals(items, 'SAVE10');
  var invoiceFigures = invoice.computeInvoiceFigures({
    items: items,
    coupon: 'SAVE10'
  });

  assert.equal(billed.discount, 100);
  assert.equal(billed.tax, 45);
  assert.equal(billed.total, 945);
  assert.equal(invoiceFigures.discount, billed.discount);
  assert.equal(invoiceFigures.tax, billed.tax);
  assert.equal(invoiceFigures.total, billed.total);
});

test('CURRENT BEHAVIOUR: invoice GST line amounts follow order pricing line rounding', function () {
  var items = [
    { id: 1, name: 'A', hsn: '1006', price: 0.15, qty: 1 },
    { id: 2, name: 'B', hsn: '1006', price: 0.15, qty: 1 }
  ];
  var billed = pricing.computeTotals(items, '');
  var invoiceFigures = invoice.computeInvoiceFigures({ items: items, coupon: '' });

  assert.equal(billed.tax, 0.02);
  assert.equal(invoiceFigures.tax, billed.tax);
  assert.deepEqual(invoiceFigures.rows.map(function (row) { return row.lineTax; }), [0.01, 0.01]);
});

test('CURRENT BEHAVIOUR: invoice CGST and SGST match the billed tax split', function () {
  var figures = invoice.computeInvoiceFigures({
    items: [{ name: 'Odd tax', price: 0.05, qty: 1, gstRate: 10 }]
  });

  assert.equal(figures.tax, 0.01);
  assert.equal(figures.cgst, 0.01);
  assert.equal(figures.sgst, 0);
});
