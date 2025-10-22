# System Logout Testing

## Title
System Logout

## Description
Users must be able to log out securely from the system, with proper session termination, data cleanup, and navigation flow to ensure system security and user privacy.

## Test Case Section Purpose

The purpose of this test case section is to validate the functionality and reliability of the ARrange Application's system logout features. It evaluates the core components of the logout mechanism, which enables users to securely exit the system from any screen, properly terminate active sessions, and ensure complete data cleanup. The test cases also cover the Session Management workflow—ensuring the system accurately handles logout from different user roles (buyer/seller), clears sensitive data from local storage, and properly terminates active chat sessions and AR view sessions. Furthermore, the Logout Security module is tested to confirm that users can successfully log out even during network interruptions, multiple logout attempts are handled gracefully, and navigation flow is properly reset. All test cases were executed successfully and marked as Passed, confirming that the system's logout-related operations perform as expected and maintain system security and user privacy.

---

## System Logout Testing

| Test Case ID | Test Case Description | Test Steps | Expected Result | Actual Result | Passed/Failed |
|--------------|----------------------|------------|-----------------|---------------|---------------|
| **TC-LO-001** | User Logout from Buyer Dashboard | 1. Login as buyer<br>2. Navigate to buyer dashboard<br>3. Tap logout button<br>4. Confirm logout | User is logged out successfully and redirected to login screen. All session data is cleared. | User successfully logged out and redirected to login screen. Session data cleared from AsyncStorage. | **PASSED** |
| **TC-LO-002** | User Logout from Seller Dashboard | 1. Login as seller<br>2. Navigate to seller dashboard<br>3. Tap logout button<br>4. Confirm logout | User is logged out successfully and redirected to login screen. All session data is cleared. | User successfully logged out and redirected to login screen. Session data cleared from AsyncStorage. | **PASSED** |
| **TC-LO-003** | Logout from Chat Screen | 1. Login as user<br>2. Navigate to chat screen<br>3. Tap logout button<br>4. Confirm logout | User is logged out successfully and redirected to login screen. Chat session is terminated. | User successfully logged out and redirected to login screen. Chat session terminated properly. | **PASSED** |
| **TC-LO-004** | Logout from AR View Screen | 1. Login as user<br>2. Navigate to AR view screen<br>3. Tap logout button<br>4. Confirm logout | User is logged out successfully and redirected to login screen. AR session is terminated. | User successfully logged out and redirected to login screen. AR session terminated properly. | **PASSED** |
| **TC-LO-005** | Session Data Cleanup Verification | 1. Login as user<br>2. Perform various actions<br>3. Logout<br>4. Check AsyncStorage | All user data, tokens, and session information are removed from AsyncStorage after logout. | AsyncStorage cleared successfully. No user data remains in local storage. | **PASSED** |
| **TC-LO-006** | Logout with Active Chat Session | 1. Login as user<br>2. Start chat conversation<br>3. Logout while chat is active<br>4. Verify chat termination | User is logged out successfully. Chat session is properly terminated. Other users see user as offline. | User logged out successfully. Chat session terminated. Other users see user as offline. | **PASSED** |
| **TC-LO-007** | Logout with Pending Orders | 1. Login as user<br>2. Create pending order<br>3. Logout<br>4. Verify order status | User is logged out successfully. Order remains in system but user session is terminated. | User logged out successfully. Order remains in system with proper status. | **PASSED** |
| **TC-LO-008** | Multiple Logout Attempts | 1. Login as user<br>2. Logout successfully<br>3. Attempt to logout again<br>4. Verify system response | System handles multiple logout attempts gracefully. No errors occur. | System handled multiple logout attempts gracefully. No errors occurred. | **PASSED** |
| **TC-LO-009** | Logout with Network Issues | 1. Login as user<br>2. Disconnect network<br>3. Attempt logout<br>4. Verify local logout | User is logged out locally even without network connection. Session data is cleared locally. | User logged out locally successfully. Session data cleared from local storage. | **PASSED** |
| **TC-LO-010** | Logout Navigation Flow | 1. Login as user<br>2. Navigate through multiple screens<br>3. Logout from any screen<br>4. Verify navigation flow | User is redirected to login screen regardless of current screen. Navigation stack is cleared. | User redirected to login screen successfully. Navigation stack cleared properly. | **PASSED** |
