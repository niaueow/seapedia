SEAPEDIA is a growing e-commerce platform that connects sellers, buyers, and delivery drivers in one marketplace experience. What started as a simple online store has quickly become a larger business ecosystem with multiple stakeholders, different financial flows, and increasingly complex order operations.

To support this growth, SEAPEDIA needs a fullstack application that is not only visually usable, but also able to handle real marketplace workflows. The client may be implemented as either a web app or a mobile app. However, the backend is expected to be API-based and capable of supporting all required business flows.

Your task is to build SEAPEDIA progressively. Each level introduces a new layer of the system, starting from the public marketplace interface and moving toward authentication, seller tools, buyer checkout, discounts, delivery operations, admin monitoring, and overdue handling. Higher levels assume that the previous levels have already been implemented and integrated properly.

## 

## **Level Overview**

1\. Level 1: Welcome to SEAPEDIA\! Public Marketplace, Authentication, and Reviews (20 pts)

2\. Level 2: Building the Seller Experience (15 pts)

3\. Level 3: Buyer Wallet, Cart, and Checkout (20 pts)

4\. Level 4: Discounts and Seller Order Processing (15 pts)

5\. Level 5: Delivery and Driver Workflow (10 pts)

6\. Level 6: Admin Monitoring and Overdue Handling (10 pts)

7\. Level 7: Security Hardening and Finalization (10 pts)

The core challenge is worth 100 points. Additional bonus points may be awarded for interface quality and deployment described at the end of this document.

## **Level Assessment Rule**

Participants may stop at any level. A submission claiming Level N will be assessed based on the requirements from Level 1 through Level N only. Features introduced in higher levels are not required to demonstrate lower-level completion. If a higher-level concept is mentioned earlier, a placeholder, seed data, or documented setup is acceptable until the relevant level is reached. 

Bonus points are only eligible for submissions that have completed at least Level 1\. UI and deployment bonuses are assessed separately from the core level requirements and cannot be used to compensate for missing requirements in the claimed core level.

## **Core Business Rules**

Before starting the challenge, please read the following business rules carefully. These rules apply across multiple levels and should be reflected consistently in both the frontend and backend. The goal is not only to create separate screens or endpoints, but also to make sure every role experiences the marketplace according to the correct rules.

● SEAPEDIA has four account roles: Admin, Seller, Buyer, and Driver.

● For non-admin accounts, one username may own more than one role at the same time.

● If a user has multiple non-admin roles, the user must choose an active role for the current session after logging in.

● Authorization must follow the active role, not merely the full list of roles owned by the user.

● Guests without an account may browse product catalogs, product details, and public application reviews, but cannot checkout or access private dashboards.

● Guests or logged-in users may submit public reviews about the website or application experience without needing to checkout or complete a transaction.

● Sellers must have a unique store name.

● Buyers must have a cart, wallet balance, delivery address, and checkout flow.

● Checkout must calculate subtotal, discount, delivery fee, PPN 12%, and final total.

● The discount system must support both Vouchers and Promos.

● Delivery methods must include Instant, Next Day, and Regular.

● Every order must store status history with timestamps.

● Sellers must process an order before a Driver can take the delivery job.

● Drivers must be able to find jobs, take jobs, and confirm completed jobs.

● The system must support auto refund or auto return for overdue orders based on delivery method.

● The system must include a way to simulate the next day, either through a scheduler, cron, worker, command, or manual Admin trigger.

● Public user-generated content, including application reviews and comments, must be handled safely so that malicious input does not execute on the page.

## **Main Order Lifecycle**

The main order lifecycle must be visible and consistent across the application. Additional internal statuses are allowed if needed, but the following main statuses must not disappear from the user-facing flow:

● Sedang Dikemas

● Menunggu Pengirim

● Sedang Dikirim

● Pesanan Selesai

● Dikembalikan

## **Cart Behavior Rule**

Because SEAPEDIA is a multi-seller marketplace, the cart and checkout behavior must follow a single-store checkout rule. One cart may only contain products from one store. This rule must be explained in the UI, implemented consistently in the backend, and documented in the README.

● Single-store checkout: one cart may only contain products from one store. If the buyer tries to add a product from another store, the system must prevent it or clearly ask the buyer to clear the cart first.

# 

# 

# **Level 1: Welcome to SEAPEDIA\! Public Marketplace, Authentication, and Reviews (Total 20 pts)**

Welcome to the SEAPEDIA development team\! The marketplace is preparing for its first public launch, and your first responsibility is to create a foundation that can already explain the product, support basic accounts, and show the difference between roles. At this stage, the application does not need to process real transactions yet, but it should already feel like a real multi-role marketplace that is ready to grow.

Unlike a simple online store, SEAPEDIA will eventually be used by Buyers, Sellers, Drivers, and Admins. Because of that, authentication and role awareness are introduced from the first level. Visitors should still be able to browse products as guests, but registered users should be able to enter the system and understand which role they are currently using.

## **Create the Public Marketplace Interface (4 pts)**

Your task is to build the first public-facing pages of SEAPEDIA. These pages should make the application feel like a real e-commerce platform, even if some product data is still static or dummy at this level.

**Requirements:**

● Create a landing page or home page for SEAPEDIA.

● Create a product listing page that can be accessed by guests.

● Create a read-only product detail page.

● Create a login page and a register page.

● Use dummy product data if the product backend is not integrated yet.

**Business Rules:**

● Guests may browse products and product details only.

● Guests must not be shown private dashboard actions such as checkout, product management, or delivery job management.

● The public interface should clearly communicate that SEAPEDIA is a marketplace, not only a single-store catalog.

## **Implement Basic Authentication and Role Awareness (8 pts)**

Your task is to implement the first working authentication flow and introduce the multi-role concept. A normal login system is not enough for SEAPEDIA because one non-admin username may act as a Buyer in one session, a Seller in another session, and a Driver in a different session. The system must therefore know not only who the user is, but also which role is currently active.

**Requirements:**

● Implement user registration.

● Implement user login and logout.

● Store passwords securely using password hashing.

● Use a token, JWT, or session-based mechanism to authenticate requests.

● Create a data model that supports Admin, Seller, Buyer, and Driver roles.

● Allow one non-admin username to own more than one role at the same time.

● Return the list of roles owned by the logged-in user.

● Provide a way to choose the active role after login or during the session.

● Show a role selection page or modal if a user has more than one non-admin role.

● Protect private routes and API endpoints based on the active role.

● Provide an endpoint or payload that returns the currently logged-in user profile.

● Create a profile or dashboard summary page that shows the roles owned by the user and the active role currently being used.

● Create an entry point or placeholder for balance or financial summaries across roles owned by the same username. Real wallet balance, Seller income, and Driver earnings will be introduced in later levels.

**Role Information:**

● Buyer: a user who can manage wallet balance, delivery address, cart, checkout, and order history in later levels.

● Seller: a user who can create a store, manage products, process incoming orders, and view seller income in later levels.

● Driver: a user who can find delivery jobs, take jobs, complete jobs, and view delivery earnings in later levels.

● Admin: a privileged user who can monitor the marketplace, manage discount resources, trigger operational actions, and access admin-only pages. Admin setup may be handled through seed data or documented setup instructions.

**Business Rules:**

● A user with multiple non-admin roles must not be redirected to a private dashboard before choosing an active role.

● Authorization must be based on the active role, not only on the list of all roles owned by the username.

● The active role must be clearly visible in the UI.

● Admin behavior may be handled separately from non-admin multi-role behavior, but it must be documented clearly.

## **Add Public Application Reviews (4 pts)**

Before users start buying products, SEAPEDIA also wants to collect early feedback about the website or application itself. This review feature is different from a product review or transaction review. A visitor should be able to leave a rating and comment about the application experience without needing to checkout, pay, or complete an order.

**Requirements:**

● Create a public review or testimonial section on the landing page or another public page.

● Create a form that allows users to submit a review about the SEAPEDIA application or website experience.

● The review form must include reviewer name, rating from 1 to 5, and comment text.

● Display submitted reviews in a review list, testimonial section, carousel, or similar component.

● Allow the review feature to be used without requiring checkout or transaction history.

● At this level, the review may be stored in frontend state, local storage, or a backend resource, as long as the behavior is clear and can be demonstrated.

**Business Rules:**

● Application reviews are about the website or application experience, not specific products or orders.

● Guests may submit application reviews unless your implementation explicitly requires login and explains the reason.

● Displayed comments should be rendered as normal text and should not break the page layout. Formal XSS prevention is assessed in Level 7\.

## **Build Reusable UI Foundations (4 pts)**

Since future levels will add many screens, your application should already have reusable components and organized navigation. This will help the project stay maintainable as the challenge becomes more complex.

**Requirements:**

● Create reusable components such as Button, Input, Card, Navbar or Top Bar, and Footer or Bottom Navigation.

● Prepare a routing structure that can support public pages and private dashboard pages.

● Create dashboard shells or placeholders for Admin, Seller, Buyer, and Driver.

● Make the navigation responsive for desktop and mobile layouts.

● Show a clear difference between guest navigation and logged-in navigation.

**Deliverables:**

● A navigable public UI for SEAPEDIA.

● Working login, registration, logout, and role selection flow.

● Role-aware dashboard entry points.

● Public application review form and review display.

● Reusable UI components and a clean routing structure ready for future levels.

After finishing this level, SEAPEDIA should already feel like a marketplace that can be used by different types of users. Guests can explore the public experience, early visitors can leave application reviews, and registered users can enter the system with a clear role context.

# 

# **Level 2: Building the Seller Experience (Total 15 pts)**

With authentication and role awareness in place, SEAPEDIA can now support its first major marketplace actor: the Seller. Sellers are responsible for creating their store identity and managing products that will appear in the public catalog. At this level, your goal is to make the Seller experience functional while keeping the public marketplace available to guests.

## **Create Seller Store Management (5 pts)**

Your task is to allow Sellers to create and manage their store profile. A store is the public identity of a Seller inside SEAPEDIA, so it must be unique and clearly displayed to buyers.

**Requirements:**

● Create a data model or resource for Seller stores.

● Provide a form for Sellers to create or update their store profile.

● Include a store name field.

● Validate and show an error if the store name is already used.

● Create a public store summary endpoint or display block.

**Business Rules:**

● Store names must be unique.

● A Seller may only manage their own store.

● The uniqueness rule must be enforced either through database constraints, backend validation, or both.

## **Implement Product Management for Sellers (6 pts)**

After creating a store, Sellers need tools to manage the products they want to sell. The product management flow should be connected to the backend and must prevent Sellers from modifying products that do not belong to them.

**Requirements:**

● Create product data with fields such as product name, description, price, stock, and store owner.

● Create Seller endpoints and UI for creating products.

● Create Seller endpoints and UI for updating products.

● Create Seller endpoints and UI for deleting products.

● Create a Seller dashboard page that lists products owned by the logged-in Seller.

**Business Rules:**

● A Seller may only create products under their own store.

● A Seller may only update or delete products that belong to them.

● Product stock must be stored because it will be used during checkout in later levels.

## 

## **Connect Products to the Public Catalog (4 pts)**

The public catalog should now stop relying only on dummy data. Buyers and guests should be able to see products from real Sellers, including information about the store that sells each product.

**Requirements:**

● Create a public endpoint for listing products.

● Create a public endpoint for viewing product details.

● Display store information in the product listing or product detail page.

● Create a store detail page or at least a store information block inside product details.

**Business Rules:**

● Guests may view the catalog and product details without logging in.

● Guests must not be able to create, update, delete, or checkout products.

**Deliverables:**

● A functional Seller dashboard.

● Integrated product CRUD for Sellers.

● A public product catalog using backend data.

● A complete demo flow for guest browsing, login, role selection, store creation, and product management.

After this level, SEAPEDIA should have a real seller-side foundation. Guests can browse products, Sellers can manage their stores and products, and the marketplace is ready for buyer-side transaction features.

# 

# **Level 3: Buyer Wallet, Cart, and Checkout (Total 20 pts)**

SEAPEDIA is now ready to support the Buyer experience. Buyers need more than a product catalog: they need a wallet, delivery address, cart, shipping method, and checkout process. This level introduces the first real transaction flow in the application, so the frontend and backend must work together carefully.

## **Build Buyer Wallet and Address Management (5 pts)**

Your task is to create the buyer-side resources that are needed before checkout can happen. The top-up flow may be a dummy simulation, but the wallet balance and transaction history must be stored and reflected correctly.

**Requirements:**

● Create a Buyer wallet or balance resource.

● Create a dummy top-up flow for Buyers.

● Store and display wallet transaction history.

● Create delivery address management for Buyers.

● Display the Buyer balance and top-up history in the Buyer dashboard.

**Business Rules:**

● Only users with the active Buyer role may access Buyer wallet and address features.

● The Buyer wallet must be usable by the checkout flow.

## **Implement Cart Management (5 pts)**

Your task is to build a cart system that allows Buyers to prepare products before checkout. Since SEAPEDIA is a multi-seller platform, your cart must follow the single-store checkout rule.

**Requirements:**

● Allow Buyers to add products to cart.

● Allow Buyers to update product quantities.

● Allow Buyers to remove products from cart.

● Create a cart summary endpoint and cart summary UI.

● Implement single-store checkout: one cart can only contain products from one store.

**Business Rules:**

● The cart must reject products from a different store or clearly handle the conflict before adding them.

● The single-store checkout behavior must be visible in the UI and documented in the README.

## **Create Checkout and Basic Orders (10 pts)**

Your task is to implement the first working checkout flow. This is where products become orders, the Buyer wallet is charged, stock is reduced, tax is calculated, and order history begins.

**Requirements:**

● Create a checkout or create order endpoint.

● Support delivery methods: Instant, Next Day, and Regular.

● Calculate subtotal, delivery fee, PPN 12%, and final total.

● Display the checkout summary in the UI before confirmation.

● Create an order based on the single-store checkout behavior.

● Reduce product stock safely after a successful checkout.

● Create order history and order detail views for Buyers.

● Create an incoming order list for Sellers.

● Store order status history with timestamps.

**Business Rules:**

● Buyers cannot checkout if their wallet balance is insufficient.

● Delivery fee must be different depending on the selected delivery method.

● PPN must be shown as 12% in the checkout summary. If your tax base differs, explain it clearly in the README.

● After successful checkout, the initial order status must be Sedang Dikemas.

● Stock reduction must not allow negative stock.

**Deliverables:**

● A working flow from Buyer top-up to cart to checkout.

● Buyer order history and order detail pages.

● Seller incoming order list.

● Backend APIs for wallet, address, cart, checkout, tax calculation, and basic order history.

After this level, SEAPEDIA should be able to process a complete basic purchase. The order does not need discounts or delivery drivers yet, but Buyers should already be able to pay using their wallet and see the order appear in the system.

# 

# **Level 4: Discounts and Seller Order Processing (Total 15 pts)**

The basic checkout flow is working, but SEAPEDIA now wants to improve the transaction experience. Buyers expect discount codes, Sellers need a clear way to process incoming orders, and both sides need reports that summarize their spending or income. This level strengthens the transaction layer before the delivery workflow begins.

## **Implement Voucher and Promo Discounts (6 pts)**

Your task is to add a discount system that supports both Vouchers and Promos. These two discount types must be distinguishable in the system, even if you decide to make their calculation rules simple.

At this level, Voucher and Promo codes may be prepared through seed data, API documentation, or a minimal Admin-only setup flow. A complete Admin management UI is not required until Level 6\.

**Requirements:**

● Create a Voucher resource.

● Create a Promo resource.

● Provide Admin endpoints to generate vouchers and promos.

● Provide endpoints to list and view details of vouchers and promos.

● Vouchers must have an expiry date and remaining usage.

● Promos must have an expiry date.

● Allow checkout to receive a discount code.

● Validate the discount code during checkout.

● Show the discount effect in the checkout summary.

● Keep subtotal, discount, delivery fee, PPN 12%, and final total visible in the checkout summary.

**Business Rules:**

● Expired Vouchers or Promos cannot be used.

● Vouchers with no remaining usage cannot be used.

● You may decide whether Voucher and Promo can be combined, but the rule must be clear and consistent.

● Voucher and Promo must be clearly distinguished in the validation result or checkout summary.

● The position of discount calculation relative to PPN 12% must be consistent and documented.

## **Allow Sellers to Process Orders (4 pts)**

After checkout, orders start in Sedang Dikemas. Before a Driver can take the job, the Seller must first process the order. This level adds the Seller-side action that moves an order forward in the lifecycle.

**Requirements:**

● Create a Seller action to process an incoming order.

● Move the order status from Sedang Dikemas to Menunggu Pengirim after the Seller processes it.

● Store the status change in the order status history with a timestamp.

● Show the order timeline or status tracker on both Buyer and Seller pages.

**Business Rules:**

● Only the Seller who owns the order may process it.

● An order cannot become available to Drivers before the Seller processes it.

● The main order statuses must remain visible in the UI.

## **Add Buyer and Seller Reports (5 pts)**

To make the system more useful, Buyers and Sellers should be able to understand their transaction history. These reports do not need to be overly complex, but they must summarize the financial result of completed or relevant transactions.

**Requirements:**

● Create a Buyer spending report or expense summary.

● Create a Seller income report or revenue summary.

● Show Buyer order history, order detail, and status history with timestamps.

● Show Seller incoming orders, processed orders, and income summary.

● Make sure discount, delivery fee, PPN 12%, and final total are visible in transaction details.

**Deliverables:**

● Checkout flow with Voucher or Promo support.

● Seller order processing flow from Sedang Dikemas to Menunggu Pengirim.

● Buyer and Seller transaction reports.

● Visible order status timeline with timestamps.

After completing this level, SEAPEDIA should support a stronger commercial flow. Buyers can use discounts, Sellers can prepare orders for delivery, and both sides can monitor their transaction results.

# 

# **Level 5: Delivery and Driver Workflow (Total 10 pts)**

SEAPEDIA has reached the point where orders need to move beyond the Seller. Once an order is ready, a Driver should be able to find it, take the job, deliver it, and confirm that the job is complete. This level focuses on the delivery flow and the Driver dashboard.

## **Create Delivery Jobs for Drivers (4 pts)**

Your task is to expose eligible delivery jobs to Drivers. A job should only become available after the Seller has processed the order and the order status has become Menunggu Pengirim.

**Requirements:**

● Create a delivery or delivery job resource.

● Create a Driver endpoint and UI to find available jobs.

● Create a Driver endpoint and UI to view job details.

● Only show jobs that are ready to be taken by Drivers.

**Business Rules:**

● Drivers may only take jobs with status Menunggu Pengirim.

● Drivers must not see or take orders that are still Sedang Dikemas.

● A delivery job must be connected to a specific order.

## **Implement Take Job and Delivery Completion (4 pts)**

After finding a job, a Driver should be able to take it and update the delivery progress. The system must prevent two Drivers from taking the same order at the same time.

**Requirements:**

● Create a take job action for Drivers.

● Move the order status to Sedang Dikirim when a Driver takes the job.

● Create a confirm completed action for Drivers.

● Move the order status to Pesanan Selesai when the job is completed.

● Store every status change with a timestamp.

● Allow Buyers and Sellers to track delivery status.

**Business Rules:**

● One order may only have one active Driver.

● A Driver cannot take a job that has already been taken by another Driver.

● The order status must move through a valid lifecycle.

● Buyer and Seller tracking must show delivery progress clearly.

## **Show Driver Earnings and Job History (2 pts)**

Drivers need to understand their completed work and earnings. You may define a simple earning rule, but it must be clear and consistently applied.

**Requirements:**

● Create a Driver dashboard that displays active job, job history, and earnings.

● Define how Driver earning is calculated from delivery fee or another documented rule.

● Show the earning result for completed jobs.

**Deliverables:**

● A working Driver dashboard.

● Find job, take job, and confirm completed job flow.

● Delivery tracking for Buyers and Sellers.

● Driver job history and earning summary.

After this level, SEAPEDIA should support an end-to-end order flow from Buyer checkout to Seller processing and Driver delivery completion. The marketplace is now operational across its three main non-admin roles.

# 

# **Level 6: Admin Monitoring and Overdue Handling (Total 10 pts)**

SEAPEDIA is now running across Buyers, Sellers, and Drivers. The next step is to give Admins enough visibility and control to monitor the system. Admins must be able to observe marketplace activity, manage discount resources, and trigger or verify overdue handling.

## **Build Admin Monitoring Dashboard (3 pts)**

Your task is to create an Admin dashboard that gives a broad view of the marketplace. The dashboard does not need to be a complex analytics product, but it must provide meaningful monitoring pages or summaries.

**Requirements:**

● Show monitoring data for users.

● Show monitoring data for stores.

● Show monitoring data for products.

● Show monitoring data for orders.

● Show monitoring data for vouchers and promos.

● Show monitoring data for delivery jobs.

● Show monitoring data for overdue orders.

**Business Rules:**

● Admin pages must only be accessible by users with the Admin role.

● Monitoring data should be useful enough to support a demo of the whole system.

## **Complete Voucher and Promo Management UI (2 pts)**

Earlier levels required discount resources and Admin endpoints. At this level, the Admin experience must be completed so that discount resources can be managed and demonstrated clearly from the interface.

**Requirements:**

● Create Admin UI to generate vouchers.

● Create Admin UI to generate promos.

● Create Admin UI to view voucher list and voucher detail.

● Create Admin UI to view promo list and promo detail.

● Show expiry date and usage-related information where relevant.

## **Implement Overdue Auto Return or Refund (5 pts)**

Real delivery systems must handle orders that are not completed on time. SEAPEDIA must support an overdue mechanism that can return or refund problematic orders based on the selected delivery method. The mechanism may be implemented using a scheduler, cron, worker, command, or a manual Admin trigger.

**Requirements:**

● Define delivery SLA rules for Instant, Next Day, and Regular.

● Implement auto refund or auto return for overdue orders.

● Move overdue orders to a clear final status, at minimum Dikembalikan.

● Apply the required financial and stock changes when an overdue order is refunded or returned. 

● Store the overdue-related status change with a timestamp.

● Show overdue, auto-return, or auto-refund results in the UI.

● Provide a way to simulate the next day or move the system time forward for demo purposes.

**Business Rules:**

● Overdue handling must consider the selected delivery method.

● Overdue handling must be verifiable through the UI, API response, or status history.

● Refund is only applied to orders that have already been successfully checked out and paid by the Buyer.

● When an eligible overdue order is refunded, the refunded amount must be returned to the Buyer wallet and recorded in the wallet transaction history.

● Refunded or returned orders must not be counted as Seller income. If Seller income has already been recorded, the system must create a reversal transaction or clearly adjust the Seller income report.

● Product stock must be restored based on the quantity of refunded or returned order items, unless a different stock handling rule is clearly documented.

● The system must prevent double refund, double income reversal, or double stock restoration for the same order. 

● The system must not silently change orders without leaving a visible trace.

● The final result of overdue handling must be clearly reflected in the order status.

**Deliverables:**

● A functional Admin dashboard.

● Voucher and Promo management UI.

● Overdue auto return or auto refund flow that can be demonstrated.

● A complete Admin demo for marketplace monitoring and time simulation.

After this level, Admins should be able to monitor the marketplace, manage discount tools, and verify operational cases such as overdue orders. The system should now be demonstrable from marketplace activity to administrative supervision.

# 

# **Level 7: Security Hardening and Finalization (Total 10 pts)**

SEAPEDIA already contains authentication, transactions, public comments, multi-role dashboards, and admin actions. Because the application now handles many sensitive flows, the final core level focuses on security hardening and project readiness. SQL Injection and XSS prevention are considered minimum expectations here, not advanced extras.

## **Secure Inputs, Queries, and Public Comments (4 pts)**

Your task is to ensure that user input cannot easily break the application or attack other users. This is especially important because SEAPEDIA has public application reviews, forms, checkout inputs, and admin-managed resources.

**Requirements:**

● Prevent SQL Injection by using parameterized queries, ORM-safe query APIs, or another clearly safe database access method.

● Prevent XSS by escaping or sanitizing user-generated content before rendering it, including application review comments.

● Validate required fields before saving data, including email, phone number, rating, quantity, price, stock, and discount values.

● Reject invalid or dangerous input with clear error messages.

● Ensure public review comments cannot execute scripts or break the page layout.

**Suggested Security Test Cases:**

● Input a script tag into the application review comment field and confirm it is displayed safely or rejected.

● Input SQL-like payloads into login, search, review, and checkout-related forms and confirm they do not affect database structure or query behavior.

## **Harden Session and Role-Based Access Control (3 pts)**

Authentication was introduced in Level 1, but the final system must make sure sessions and role permissions remain correct across all major flows. The frontend may help guide users, but the backend must still enforce the real authorization rules.

**Requirements:**

● Ensure logout invalidates or clears the active session or token correctly.

● Ensure protected endpoints cannot be accessed by changing frontend routes manually.

● Ensure active role is verified server-side for Seller, Buyer, Driver, and Admin actions.

● Prevent users from accessing or modifying resources owned by other users, such as another Seller product, another Buyer order, or another Driver job.

● Use reasonable token or session expiration behavior and document it.

**Business Rules:**

● The backend must not trust role information only because it appears in the UI.

● A user who owns multiple roles may only perform actions allowed by the currently active role.

● Admin-only endpoints and pages must not be accessible by non-admin users.

## **Prepare Final Documentation and Demo Data (3 pts)**

Because this is a fullstack challenge with many roles, your final project must be easy to run and easy to assess. The evaluator should not need to guess how to create accounts, trigger flows, or test the business rules.

**Requirements:**

● Provide API documentation using Swagger/OpenAPI, Postman, or another clear format.

● Provide seed data or demo accounts for Admin, Seller, Buyer, and Driver.

● Document the single-store checkout behavior.

● Document the discount combination rule and PPN 12% calculation rule.

● Document the Driver earning rule.

● Document the overdue SLA and how to simulate time.

● Document the security measures implemented for SQL Injection, XSS, input validation, session behavior, and role-based access control.

● Provide a short testing guide for the end-to-end demo flow.

**Deliverables:**

● Security hardening for public forms, authentication, authorization, and database access.

● Final API documentation and demo accounts.

● A complete end-to-end SEAPEDIA demo across all roles.

● A short security testing note or checklist.

Congratulations\! After finishing this level, you have built a complete multi-role e-commerce system with public reviews, authentication, store management, cart and checkout, discounts, seller processing, delivery jobs, admin monitoring, overdue handling, and baseline security hardening. SEAPEDIA is now ready to be demonstrated as a full marketplace application.

# 

# **Final Demo Checklist**

For the final assessment, the project should be demonstrable as one integrated system rather than separate frontend and backend fragments. The following checklist summarizes the expected end-to-end flows.

## **Guest, Review, and Authentication Flow**

● Guest can browse the product catalog and product details.

● Guest or logged-in user can submit an application review with rating and comment without checkout or transaction history.

● Submitted application reviews are displayed safely on the public interface.

● User can register and login.

● Multi-role user can choose an active role.

● Private dashboards are protected based on the active role.

## **Seller Flow**

● Seller can create a store with a unique store name.

● Seller can create, update, and delete products.

● Seller products appear in the public catalog.

● Seller can process incoming orders from Sedang Dikemas to Menunggu Pengirim.

## **Buyer Flow**

● Buyer can top up balance using dummy top-up.

● Buyer can manage delivery address and cart.

● Buyer can checkout using a delivery method and optional Voucher or Promo.

● Checkout summary shows subtotal, discount, delivery fee, PPN 12%, and final total.

● Buyer can view order history, order detail, and status timeline.

## **Driver Flow**

● Driver can find available jobs.

● Driver can take an available job.

● Driver can confirm a completed job.

● Driver can view job history and earnings.

## **Admin, Overdue, and Security Flow**

● Admin can monitor users, stores, products, orders, discounts, deliveries, and overdue orders.

● Admin can generate and view Voucher and Promo data.

● The system can simulate the next day or an equivalent time progression.

● At least one auto return or auto refund scenario can be demonstrated successfully.

● SQL Injection and XSS test cases can be demonstrated as safely handled.

● Role-based access control works from the backend, not only from the frontend UI.

# **Assessment Components**

1\. Completeness of the criteria in each level.

2\. Correctness of the business rules and role-based behavior.

3\. Clean code and maintainable project structure.

4\. Clean backend API design and clear separation of concerns.

5\. Responsive layout and usable interface across common screen sizes.

6\. Security correctness for authentication, input handling, and access control.

7\. Clear README and API documentation.

8\. Quality of the end-to-end demo flow.

# **Additional Bonus Points (Total 25 pts)**

1\. Good, creative, and intuitive UI (10 pts)

2\. Deployment (15 pts): You have the freedom to choose any deployment method you prefer. Make sure the deployed application can be accessed and tested by the evaluator.

# **Delivery** 

1. **Works on Any Machine**: Make sure your project can run on any machine, not just yours\!  
2. **Repository Hosting**: Push your project to a repository hosting service, such as GitHub or GitLab. Make sure your project visibility is set to public for access and review.  
3. **README**: Include a detailed README in your project root explaining how to set up and run your application, also include any environment variables that are needed to run the application. If you implemented an admin functionality and require special setup, please include instructions in your README on how to create an admin account.  
4. **API Documentation**: Include Swagger/OpenAPI, Postman collection, or another clear API documentation format.   
5. **Security Notes**: Briefly explain how your project handles SQL Injection, XSS, input validation, session behavior, and role-based access control.  
6. **Git Commit History:** Please commit step by step as you progress through your project. Do not squash all your changes into a single commit. We want to see your development process and progress through your commit history.  
7. **Deployment Link (Optional)**: If your application has been deployed, provide a public deployment URL. The deployment link, deployment environment information, and any relevant usage notes should also be documented in the README for easier access and review.  
8. **Errors in program assessment due to unclear instructions are beyond our responsibility**.

# **Additional Notes**

● Feel free to use any kind of website or mobile framework. There are no limitations on what technologies you use to build your application.

● The backend should be API-based and able to support the required business flows.

● Be creative with your application. The requirements act as a blueprint, but your implementation choices should still be clear, consistent, and well documented.

# **Example References**

You may look at modern marketplace and e-commerce applications for UI inspiration, such as Tokopedia, Shopee, Lazada, Amazon, or other platforms with multi-role transaction flows. These examples are for inspiration only; your implementation should still follow the SEAPEDIA requirements in this document.

# 

**Contact Person**  
**David Mesakh (Dave)**  
*WhatsApp	:* **085156248172**  
*ID Line	: **dream4dave***

**Nurul Fikriyati Bena (Bena)**  
*WhatsApp	:* **082283541425**  
*ID Line	: **nurulbena***

