const express = require("express");
const invoiceRouter = express.Router();

const { authCheck } = require("../middlewares/auth.middleware");
const InvoiceController = require("../controllers/invoice.controller");
const dtoValidate = require("../middlewares/validate.middleware");
const InvoiceDTO = require("../validation/invoice.dto");
const { checkSubscription } = require("../middlewares/subscription.middleware");

// All invoice routes are scoped under a shop
// Base: /api/invoice/shop/:shopId

invoiceRouter
  .route("/shop/:shopId")
  .get(authCheck, InvoiceController.listInvoices)
  .post(
    authCheck,
    checkSubscription,
    dtoValidate(InvoiceDTO.createInvoiceSchema),
    InvoiceController.createInvoice
  );

invoiceRouter
  .route("/shop/:shopId/stats")
  .get(authCheck, InvoiceController.invoiceStats);

invoiceRouter
  .route("/shop/:shopId/:invoiceId")
  .get(authCheck, InvoiceController.getInvoice)
  .put(
    authCheck,
    InvoiceController.updateInvoice
  )
  .patch(
    authCheck,
    dtoValidate(InvoiceDTO.updateInvoiceStatusSchema),
    InvoiceController.updateInvoiceStatus
  )
  .delete(authCheck, InvoiceController.deleteInvoice);

module.exports = invoiceRouter;
