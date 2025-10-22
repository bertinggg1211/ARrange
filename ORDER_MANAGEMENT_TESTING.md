# Order Management Testing

## Title
Order Management

## Description
System must handle order processing and status updates with proper order tracking, payment processing, and order history management to ensure transparent and efficient order fulfillment.

## Test Case Section Purpose

The purpose of this test case section is to validate the functionality and reliability of the ARrange Application's order management system features. It evaluates the core components of the order processing mechanism, which enables users to create orders, track order status, process payments, and manage order history. The test cases also cover the Order Workflow—ensuring the system accurately handles order creation from cart, processes payments securely, updates order status in real-time, and provides comprehensive order tracking. Furthermore, the Order Management module is tested to confirm that both buyers and sellers can successfully manage orders, receive proper notifications, and maintain order history with accurate status updates. All test cases were executed successfully and marked as Passed, confirming that the system's order management operations perform as expected and provide reliable order processing.

---

## Order Management Testing

| Test Case ID | Test Case Description | Test Steps | Expected Result | Actual Result | Passed/Failed |
|--------------|----------------------|------------|-----------------|---------------|---------------|
| **TC-OR-001** | Order Creation from Cart | 1. Add products to cart<br>2. Proceed to checkout<br>3. Fill order details<br>4. Confirm order | Order is created successfully with unique order ID. Order status is "Pending". | Order created successfully with unique order ID. Order status set to "Pending". | **PASSED** |
| **TC-OR-002** | Order Status Updates | 1. Create order<br>2. Update order status<br>3. Verify status change<br>4. Check notifications | Order status updates are reflected immediately. Both buyer and seller receive notifications. | Order status updated immediately. Both parties received notifications. | **PASSED** |
| **TC-OR-003** | Buyer Order Tracking | 1. Login as buyer<br>2. View order history<br>3. Check order status<br>4. Track order progress | Buyer can view all orders with current status. Order tracking information is accurate. | Buyer viewed all orders with current status. Order tracking information accurate. | **PASSED** |
| **TC-OR-004** | Seller Order Management | 1. Login as seller<br>2. View incoming orders<br>3. Update order status<br>4. Process orders | Seller can view and manage all incoming orders. Status updates are processed correctly. | Seller viewed and managed all incoming orders. Status updates processed correctly. | **PASSED** |
| **TC-OR-005** | Order with Multiple Products | 1. Add multiple products to cart<br>2. Create single order<br>3. Verify order details<br>4. Check product list | Order contains all selected products. Product details are accurate and complete. | Order contained all selected products. Product details accurate and complete. | **PASSED** |
| **TC-OR-006** | Order Payment Processing | 1. Create order<br>2. Process payment<br>3. Verify payment status<br>4. Update order status | Payment is processed successfully. Order status updates to "Paid". Payment confirmation is sent. | Payment processed successfully. Order status updated to "Paid". Payment confirmation sent. | **PASSED** |
| **TC-OR-007** | Order Cancellation | 1. Create order<br>2. Cancel order before payment<br>3. Verify cancellation<br>4. Check refund process | Order is cancelled successfully. Refund is processed if payment was made. Order status is "Cancelled". | Order cancelled successfully. Refund processed. Order status set to "Cancelled". | **PASSED** |
| **TC-OR-008** | Order Fulfillment Process | 1. Seller receives order<br>2. Update status to "Processing"<br>3. Update status to "Shipped"<br>4. Update status to "Delivered" | Order fulfillment workflow is followed correctly. Status updates are sequential and logical. | Order fulfillment workflow followed correctly. Status updates sequential and logical. | **PASSED** |
| **TC-OR-009** | Order History and Filtering | 1. View order history<br>2. Filter by status<br>3. Filter by date range<br>4. Search specific orders | Order history displays correctly. Filtering and search functions work properly. | Order history displayed correctly. Filtering and search functions working properly. | **PASSED** |
| **TC-OR-010** | Order Notifications | 1. Create order<br>2. Update order status<br>3. Verify notifications<br>4. Check notification content | Order notifications are sent to relevant users. Notification content is accurate and timely. | Order notifications sent to relevant users. Notification content accurate and timely. | **PASSED** |
