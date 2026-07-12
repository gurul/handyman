/* Acme Invoices — shared data layer.
   Seeds localStorage on first load so tables are never empty.
   Exposes window.AcmeStore for the page scripts. Plain script, no modules. */
(function () {
  "use strict";

  var CUSTOMERS_KEY = "acme.customers";
  var INVOICES_KEY = "acme.invoices";
  var SETTINGS_KEY = "acme.settings";

  var DAY = 24 * 60 * 60 * 1000;

  function iso(offsetDays) {
    return new Date(Date.now() + offsetDays * DAY).toISOString().slice(0, 10);
  }

  function read(key) {
    try {
      var raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : null;
    } catch (e) {
      return null;
    }
  }

  function write(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
  }

  /* ---------- Seed data ---------- */

  var SEED_CUSTOMERS = [
    { id: "c1", name: "Maple & Co Roasters", email: "billing@mapleco.example" },
    { id: "c2", name: "Northwind Logistics", email: "accounts@northwind.example" },
    { id: "c3", name: "Bluebird Studios", email: "finance@bluebird.example" },
    { id: "c4", name: "Harbor Legal LLP", email: "ap@harborlegal.example" },
    { id: "c5", name: "Sundial Fitness", email: "pay@sundialfit.example" },
    { id: "c6", name: "Quartz Analytics", email: "invoices@quartz.example" }
  ];

  var SEED_INVOICES = [
    {
      id: "i1", number: "INV-1001", customerId: "c1", status: "paid",
      issueDate: iso(-42), dueDate: iso(-28), notes: "",
      items: [{ description: "Espresso machine servicing", qty: 2, price: 340 }]
    },
    {
      id: "i2", number: "INV-1002", customerId: "c2", status: "paid",
      issueDate: iso(-35), dueDate: iso(-21), notes: "PO #8841",
      items: [{ description: "Fleet route consulting", qty: 12, price: 150 }]
    },
    {
      id: "i3", number: "INV-1003", customerId: "c3", status: "overdue",
      issueDate: iso(-30), dueDate: iso(-9), notes: "Second reminder sent",
      items: [
        { description: "Brand identity package", qty: 1, price: 2400 },
        { description: "Social media templates", qty: 4, price: 120 }
      ]
    },
    {
      id: "i4", number: "INV-1004", customerId: "c4", status: "paid",
      issueDate: iso(-24), dueDate: iso(-10), notes: "",
      items: [{ description: "Contract review retainer", qty: 1, price: 1800 }]
    },
    {
      id: "i5", number: "INV-1005", customerId: "c5", status: "overdue",
      issueDate: iso(-21), dueDate: iso(-4), notes: "",
      items: [{ description: "Quarterly equipment lease", qty: 3, price: 420 }]
    },
    {
      id: "i6", number: "INV-1006", customerId: "c6", status: "outstanding",
      issueDate: iso(-12), dueDate: iso(9), notes: "Net 21",
      items: [
        { description: "Data pipeline setup", qty: 1, price: 3200 },
        { description: "Monthly dashboard hosting", qty: 2, price: 95 }
      ]
    },
    {
      id: "i7", number: "INV-1007", customerId: "c1", status: "paid",
      issueDate: iso(-8), dueDate: iso(6), notes: "Paid early",
      items: [{ description: "Grinder calibration visit", qty: 1, price: 260 }]
    },
    {
      id: "i8", number: "INV-1008", customerId: "c3", status: "outstanding",
      issueDate: iso(-3), dueDate: iso(18), notes: "",
      items: [{ description: "Website refresh — phase 1", qty: 1, price: 1450 }]
    }
  ];

  function seedIfEmpty() {
    if (!read(CUSTOMERS_KEY)) write(CUSTOMERS_KEY, SEED_CUSTOMERS);
    if (!read(INVOICES_KEY)) write(INVOICES_KEY, SEED_INVOICES);
  }

  seedIfEmpty();

  /* ---------- Helpers ---------- */

  function invoiceTotal(invoice) {
    return invoice.items.reduce(function (sum, item) {
      return sum + (Number(item.qty) || 0) * (Number(item.price) || 0);
    }, 0);
  }

  var moneyFmt = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD"
  });

  var dateFmt = new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric"
  });

  var STATUS_LABELS = {
    paid: "Paid",
    outstanding: "Outstanding",
    overdue: "Overdue"
  };

  window.AcmeStore = {
    getCustomers: function () {
      return read(CUSTOMERS_KEY) || [];
    },

    addCustomer: function (data) {
      var customers = this.getCustomers();
      var customer = {
        id: "c" + Date.now(),
        name: String(data.name || "").trim(),
        email: String(data.email || "").trim()
      };
      customers.push(customer);
      write(CUSTOMERS_KEY, customers);
      return customer;
    },

    getCustomerName: function (customerId) {
      var match = this.getCustomers().find(function (c) {
        return c.id === customerId;
      });
      return match ? match.name : "Unknown customer";
    },

    getInvoices: function () {
      return read(INVOICES_KEY) || [];
    },

    addInvoice: function (data) {
      var invoices = this.getInvoices();
      var invoice = {
        id: "i" + Date.now(),
        number: this.nextInvoiceNumber(),
        customerId: data.customerId,
        status: data.status || "outstanding",
        issueDate: new Date().toISOString().slice(0, 10),
        dueDate: data.dueDate,
        notes: String(data.notes || "").trim(),
        items: data.items
      };
      invoices.push(invoice);
      write(INVOICES_KEY, invoices);
      return invoice;
    },

    nextInvoiceNumber: function () {
      var max = this.getInvoices().reduce(function (acc, inv) {
        var n = parseInt(String(inv.number).replace("INV-", ""), 10);
        return isNaN(n) ? acc : Math.max(acc, n);
      }, 1000);
      return "INV-" + (max + 1);
    },

    getSettings: function () {
      return (
        read(SETTINGS_KEY) || {
          reminders: true,
          receipts: true,
          lateFees: false,
          companyName: "Acme Invoices Inc.",
          companyEmail: "hello@acme-invoices.example",
          companyAddress: "500 Market Street, San Francisco, CA",
          taxId: "US-84-2210934"
        }
      );
    },

    saveSettings: function (settings) {
      write(SETTINGS_KEY, settings);
    },

    invoiceTotal: invoiceTotal,

    money: function (value) {
      return moneyFmt.format(value);
    },

    date: function (isoDate) {
      return dateFmt.format(new Date(isoDate + "T00:00:00"));
    },

    statusLabel: function (status) {
      return STATUS_LABELS[status] || status;
    },

    esc: function (value) {
      return String(value).replace(/[&<>"']/g, function (ch) {
        return {
          "&": "&amp;",
          "<": "&lt;",
          ">": "&gt;",
          '"': "&quot;",
          "'": "&#39;"
        }[ch];
      });
    }
  };
})();
