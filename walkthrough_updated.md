# Project Update: Invoice Management & Branding Evolved

I have completed a major series of enhancements for **Invoice Managerium**, focusing on robust invoice workflows, enriched product details, and customized branding.

## 1. Professional Invoice Management
We've moved beyond simple invoice creation to a full-lifecycle management system.

*   **Interactive History**: The Invoice History tab now features a clickable list. Tapping any invoice opens an interactive preview modal.
*   **Soft Delete**: Implemented a "Soft Delete" system. Invoices are no longer permanently lost; they are marked with an `is_deleted` flag. They disappear from the UI and stats but remain securely archived in the database.
*   **Status Tracking**: Added a new `printed` status. Invoices are automatically updated when printed, and the History UI reflects this with distinct color-coding.
*   **Unified Actions**: The preview modal in the History tab now includes dedicated **Delete** and **Print** buttons, matching the "Create Invoice" workflow.

## 2. Product Variant Integration
To support more complex inventory, the system now natively handles product variants.

*   **Search & Selection**: Variants (e.g., Size, Color) are now displayed directly in the search dropdown with a clear separator.
*   **Cart Visualization**: Added bold, red-styled variant labels in the selected products list for clear identification.
*   **Persistence**: Variant details are now permanently baked into the invoice line items, ensuring historical records are accurate even if products change later.

## 3. Branding & Customization
Transformed the app's identity and improved the professional feel.

*   **Custom App Name**: Migrated the application title to be environment-driven using `VITE_APP_NAME` in the `.env` file.
*   **Native Logo Support**: Replaced the generic icon in the header with your professional brand asset located at `/invoice_logo.png`.
*   **Receipt Customization**: Added support for custom "Notes" which appear elegantly on the receipt just above the footer.

---

### Technical Summary
- **Backend-API**: Updated `Invoice` model and `InvoiceController` to support `is_deleted` filtering and status updates. Added `authedDelete` helper for secure API interactions.
- **Frontend-UI**: Enriched `TabCreateInvoice`, `TabInvoiceHistory`, and `Dashboard` components with variant rendering and dynamic branding logic.
- **Persistence**: Invoices are now linked to customers in a dedicated `Customer` table for future CRM features.

> [!TIP]
> Your dashboard is now ready for production-level invoicing with a professional look and feel!