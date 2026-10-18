# CICO — General Instructions for the AI Development Agent

## 1. Purpose and source of truth

Build **CICO — a simple Cash In/Cash Out web application** to help an operator record transactions, capture receipt information, apply fees, and review transaction history and reports. This document records the owner's approved requirements. Use it as the project brief and implementation guide.

Keep the experience simple and practical on both PC and mobile. The operator uses the main application. Customers generally transact outside the application; a remote sender may use a limited receipt-upload page.

## 2. Required collaboration process

The owner explicitly requires a gated conversation:

1. Receive the owner's next task.
2. Restate your understanding, expected behavior, and scope in plain language.
3. Ask focused questions about meaningful ambiguities. Distinguish approved requirements from suggestions.
4. Wait for the owner's confirmation or corrections before implementing that task.
5. Once confirmed, complete the agreed task and appropriate verification. Report the outcome and any limitations.
6. Wait for the next task; do not silently proceed to another phase.

Do not treat this document as permission to build the entire application immediately. Do not invent features or choose unresolved business rules without clarification. Routine implementation details may be handled within an approved task.

## 3. Approved features

### Transaction history

- Record and review cash-in and cash-out transactions.
- “Tracking/audit logs” means transaction history only. A separate log of who created, edited, or deleted records is outside the current scope.
- Show pending cash-outs for follow-up and clearly distinguish them from completed transactions.

### Reports

- Show incoming and outgoing transaction amounts over a selected period.
- Show revenue earned from transaction fees, separately from transaction principal.
- Only completed transactions count toward completed totals and earned fee revenue.
- Pending cash-outs do not contribute to these totals.
- Clarify the reporting perspective before implementation: physical cash and wallet funds move in opposite directions. Label totals clearly; never silently treat transaction principal as revenue or combine cash and wallet movement into a misleading total.

### Editable fee rules

- The user defines fees for transaction amount ranges.
- CICO automatically applies the matching rule when recording a transaction.
- The user can edit the ranges and fees when rates change.
- Updated rules apply to new transactions. Existing saved records retain their originally applied fee.
- Fees are paid separately for both cash-in and cash-out. Never deduct the fee from the requested principal.
- Confirm whether cash-in and cash-out share rules or have separate rules, and confirm range boundaries and fee format before implementing them.
- Do not invent default fee rates. Handle missing or overlapping rules explicitly rather than guessing a fee.

### Receipt scanning and editable auto-fill

- Allow the operator to upload a receipt image or take a photo using a supported device camera.
- Extract reference number, name, transaction amount, transaction date, and transaction time.
- Show the image alongside or within reach of an editable review form.
- The operator can correct missed or incorrect letters and numbers before saving.
- Always support manual entry, including when a receipt is unavailable or scanning fails.
- Keep reference numbers as text so leading zeroes and all digits are preserved.
- Receipt scanning assists data entry; it does not verify that funds arrived.
- Do not present simulated extraction as working OCR. Clearly identify any temporary demo implementation.

### Responsive UI/UX

- Support comfortable use on PC and mobile browsers.
- Adapt navigation, forms, transaction history, reports, and receipt review to smaller screens.
- Keep controls readable, touch-friendly, and keyboard accessible.
- Provide useful feedback for scanning, uploads, validation errors, and saving.

## 4. Approved standard transaction workflows

### Cash-in

1. Customer requests cash-in and provides the amount and destination wallet details.
2. Operator selects Cash-in and enters the amount in CICO.
3. CICO calculates the configured fee. Operator tells the customer the amount and separate fee.
4. Customer agrees and pays the principal plus the separate fee.
5. Operator transfers the full requested principal to the customer's wallet and confirms the transfer succeeded.
6. Operator uploads/photographs the receipt or enters the details manually.
7. Operator reviews and corrects the information.
8. Operator saves the completed transaction with its applied fee.
9. Transaction history and reports reflect the completed record.

### Cash-out with the same sender and receiver

1. Customer requests cash-out.
2. Operator selects Cash-out and enters the amount. CICO calculates the separate fee.
3. Operator explains the amount and fee; customer agrees.
4. Customer transfers the full requested principal to the operator's wallet.
5. Operator obtains the receipt through upload/photo or manually records the incoming transfer details.
6. Operator checks their actual wallet transaction history and matches the incoming transfer, including reference number and amount, with sender and timestamp as supporting details.
7. After confirming funds arrived, operator collects the separate fee and gives the customer the full requested cash amount.
8. Operator marks the transaction Completed and saves it.
9. History and reports update.

Example with a principal of PHP 1,000 and a fee of PHP 10:

| Type | Customer pays/sends | Customer receives |
| --- | --- | --- |
| Cash-in | PHP 1,000 principal plus PHP 10 separate fee | PHP 1,000 in their wallet |
| Cash-out | PHP 1,000 wallet transfer plus PHP 10 separate fee | PHP 1,000 cash |

These are explanatory amounts, not approved default fee rules.

## 5. Approved separate-sender cash-out workflow

Support a person who is physically present to receive cash while another person sends the funds remotely.

1. Receiver requests cash-out and identifies the sender.
2. Operator enters the amount and receiver's name; CICO calculates the separate fee.
3. Operator creates a **Pending** cash-out request.
4. If needed, CICO generates a short receipt-upload link and a QR code pointing to the same request.
5. Receiver shares the link or QR with the remote sender.
6. Sender transfers funds to the operator and uploads the receipt through the limited web page.
7. Uploaded receipt appears for the operator on the matching pending request. Extracted fields remain editable.
8. Operator records/checks both sender and receiver names and reviews receipt details.
9. Operator independently verifies the incoming funds in their actual wallet history.
10. CICO prevents reuse of an already-recorded transfer reference for another cash-out.
11. After verification, operator collects the separate fee and releases the full cash amount to the receiver.
12. Operator marks the transaction Completed. History and reports update.

Alternative paths:

- **Receipt shown in person:** operator photographs or uploads it directly.
- **No receipt available:** operator locates the incoming transfer in their wallet, verifies it, and enters its details manually.
- **Receipt uploaded but funds not verified:** request stays pending; upload alone never completes a transaction or authorizes payout.

### Public receipt-upload page boundaries

- Associate each link/QR with exactly one pending request.
- Allow receipt submission without granting access to the operator's application or transaction history.
- Display only the minimum request information needed for submission.
- Use an unguessable request token and validate uploads on the server.
- Do not include secret credentials or private transaction lists in URLs or QR codes.
- Decide link expiry, invalidation, repeat uploads, and completed-request behavior with the owner before implementation.
- Receipt submission must not automatically verify funds, mark completion, or count revenue.

## 6. Financial and data integrity rules

- The principal and separate fee are distinct stored amounts.
- Preserve the applied fee on each saved transaction; never recalculate historical fees from current rules.
- Use decimal-safe money storage and calculations, such as integer minor units or a suitable decimal database type.
- Store references as text. Enforce duplicate-transfer prevention in persistent storage, not only in the browser.
- Define the reference uniqueness scope based on supported wallet providers/accounts before implementing it. Do not block legitimate distinct transfers solely because unrelated providers reuse a reference format.
- Protect against double submission and concurrent attempts to complete/pay out the same request.
- Keep receipt-extracted data separate from the fact that the operator verified funds.
- Completed means the exchange is finished, the fee is collected, and cash has been released for cash-out.
- Do not assume an OCR service or wallet API can verify transfers. Wallet verification is manual in the current approved scope.
- Confirm business timezone and currency before implementation; Philippine peso and Asia/Manila are proposed defaults based on project context.

## 7. Separate Overview page — required deliverable

Include a dedicated informational page within the website, separate from transaction screens, that the owner can show to the operator. Make it responsive and understandable without technical knowledge.

Include:

1. **About CICO:** purpose, intended operator, and benefits.
2. **Features:** transaction history, reports, fee rules, receipt scanning/manual entry, and mobile/PC support.
3. **Workflows:** cash-in, standard cash-out, and cash-out with a separate sender and receiver.
4. **Operator guide:** transaction creation, separate fees, receipt review, manual entry, fund verification, pending/completed records, and reports.
5. **FAQs**, including:
   - Who uses CICO?
   - Does CICO transfer money, or record transactions performed through the wallet?
   - How are fees calculated and paid?
   - Do changed fees affect past records?
   - What if receipt scanning reads the details incorrectly?
   - What if there is no receipt?
   - Can someone else send money for the person collecting cash?
   - How do receipt-upload links and QR codes work?
   - Does an uploaded receipt prove payment arrived?
   - When should the operator release cash?
   - What happens if a reference has already been used?
   - What is the difference between pending and completed?
   - Which transactions count in reports?

Keep all explanations consistent with the implemented behavior. Do not advertise unfinished features as available. The Overview page's public/private visibility is not yet decided.

## 8. Implementation guidance

- Inspect the existing repository and its instructions before modifying code.
- No technology stack, database, OCR service, hosting provider, or visual theme has been approved in this brief. Propose a suitable approach and obtain confirmation before scaffolding.
- Organize the app around transaction entry, pending cash-outs, transaction history, reports, fee settings, the Overview page, and the limited public upload page. These are functional areas, not a mandated navigation design.
- Keep business logic for fee matching, completion, duplicate checking, and reporting consistent across screens and enforce critical rules on the server.
- Use persistent storage for a production implementation. Clearly label any mock data, local-only prototype, or incomplete backend.
- Keep receipt access restricted to the relevant operator/request and avoid exposing personal information in logs or public pages.
- Never request wallet passwords, PINs, or OTPs for this workflow.
- Make changes in manageable, confirmed steps. Explain how to run and verify each completed part.

## 9. Meaningful verification

When implementing the relevant areas, verify:

- Correct fee matching at range boundaries and clear handling of gaps/overlaps.
- Fee-rule edits leave existing transaction fees and reports unchanged.
- Fees remain separate from principal in both transaction types.
- Pending records do not inflate completed totals or fee revenue.
- Receipt errors can be corrected and manual entry works without an image.
- Leading zeroes in reference numbers survive scanning, editing, and saving.
- Receipt uploads attach to the intended pending request only.
- Uploading a receipt never auto-verifies funds or completes payout.
- Duplicate references and repeated/concurrent completion attempts cannot create a second payout record.
- Separate sender and receiver details are retained.
- Operator data is inaccessible from a public upload link.
- Core workflows and the Overview page work on desktop and mobile.

## 10. Decisions still requiring owner confirmation

Resolve these when relevant to the next task; do not ask every question at once:

- Technology stack, database, hosting, OCR provider, and visual style.
- Operator sign-in and whether there are multiple operators/accounts.
- Supported wallet providers and operator wallet accounts.
- Exact fee ranges, fee format, and shared versus separate cash-in/cash-out rules.
- Whether fees may change while a transaction is pending and how the agreed fee is retained.
- Exact incoming/outgoing report definitions and desired period controls.
- Receipt-link expiry and handling of repeat uploads or abandoned pending requests.
- Whether saved transactions may be edited, cancelled, or deleted and how reports should respond.
- Receiver identification/confirmation requirements for a separate-sender cash-out.
- Overview-page visibility.

Do not add customer accounts, automatic money transfers, wallet API integration, inventory, multi-branch management, profit/expense accounting, or other unrelated modules unless the owner requests and confirms them.

## 11. Suggested first response when this file is supplied

Briefly summarize the approved CICO scope, acknowledge the gated collaboration requirement, and ask which task the owner wants to start with. If a specific task was supplied with this file, restate that task and clarify only the decisions necessary to perform it. Wait for confirmation before implementation.
