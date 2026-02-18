# Chat Notification Badge Fix

## Problem
When a seller sends a message to a buyer, the buyer sees an unread count badge (e.g., "1", "2", "3") in the chat list. However, when the buyer opens the conversation, the badge doesn't disappear.

## Root Cause
1. The `/api/chat/mark-read` endpoint was hardcoded for buyers only and didn't handle sellers
2. The endpoint wasn't properly filtering to only mark the OTHER person's messages as read
3. The chat list wasn't refreshing after marking messages as read

## Solution

### 1. Backend API Fix (`server/routes/chatRoutes.js`)

**Updated `/api/chat/mark-read/:partnerId` endpoint to:**

- ✅ Handle both buyers AND sellers
- ✅ Properly determine who is the current user and who is the partner
- ✅ Only mark messages FROM the partner as read (not your own messages)
- ✅ Use `sender_id` to correctly identify who sent each message

**Key Logic:**
```javascript
if (userRole === 'buyer') {
  // Buyer marking SELLER's messages as read
  // Only mark messages where sender_id = sellerId
  updateQuery = supabase
    .from('messages')
    .update({ is_read: true })
    .eq('buyer_id', currentUserId)
    .eq('seller_id', partnerId)
    .eq('sender_id', partnerId)  // KEY: Only seller's messages
    .eq('is_read', false);
    
} else if (userRole === 'seller') {
  // Seller marking BUYER's messages as read
  // Only mark messages where sender_id = buyerId
  updateQuery = supabase
    .from('messages')
    .update({ is_read: true })
    .eq('seller_id', currentUserId)
    .eq('buyer_id', partnerId)
    .eq('sender_id', partnerId)  // KEY: Only buyer's messages
    .eq('is_read', false);
}
```

### 2. Frontend - Buyer Chat Screen (`src/screens/buyer/Chat.jsx`)

**Updated message marking logic:**
- ✅ Calls `markMessagesAsRead()` API when chat loads
- ✅ Also calls `markChatAsRead()` to update local state in ChatContext
- ✅ Both happen automatically when opening a conversation

**Before:**
```javascript
// Only marked locally, didn't update database properly
await markChatAsRead(`chat_${shopId}`);
await markMessagesAsRead(shopId);
```

**After:**
```javascript
// First mark in database, then update local state
await markMessagesAsRead(shopId);  // Database update
await markChatAsRead(`chat_${shopId}`);  // Local state update
```

### 3. Frontend - Chat List (`src/screens/buyer/ChatList.jsx`)

**Added auto-refresh on screen focus:**
- ✅ Uses `useFocusEffect` to reload conversations when returning to chat list
- ✅ Ensures badge updates are visible immediately after closing a chat
- ✅ Removed redundant `markChatAsRead()` call from `handleChatPress()`

**Before:**
```javascript
// Only loaded on mount
useEffect(() => {
  loadConversations();
}, []);

// Tried to mark as read before navigation (didn't work properly)
const handleChatPress = (item) => {
  markChatAsRead(item.id);
  navigation.navigate("Chat", { chatData: item });
};
```

**After:**
```javascript
// Load on mount
useEffect(() => {
  loadConversations();
}, []);

// ALSO refresh when screen comes into focus
useFocusEffect(
  React.useCallback(() => {
    loadConversations();
  }, [])
);

// Let Chat.jsx handle marking as read
const handleChatPress = (item) => {
  navigation.navigate("Chat", { chatData: item });
};
```

### 4. ChatContext Already Handles Refresh

The `markChatAsRead()` function in `ChatContext.jsx` already:
- ✅ Calls `markMessagesAsRead()` API
- ✅ Updates local state to set unreadCount to 0
- ✅ Calls `loadConversations()` to refresh from backend

---

## How It Works Now

### User Flow:
1. **Seller sends message to buyer** → Buyer's unread count increases (e.g., "1")
2. **Buyer sees badge** in chat list showing unread message count
3. **Buyer taps conversation** → Chat screen opens
4. **Chat.jsx loads** and automatically:
   - Calls `markMessagesAsRead(sellerId)` → Updates database
   - Calls `markChatAsRead()` → Updates local state & refreshes conversations
5. **Buyer goes back** to chat list → `useFocusEffect` refreshes the list
6. **Badge is gone** ✅

### Technical Flow:
```
Buyer taps chat
   ↓
Chat.jsx useEffect()
   ↓
markMessagesAsRead(sellerId)  // API call to backend
   ↓
Backend: UPDATE messages SET is_read = true
         WHERE buyer_id = X
         AND seller_id = Y
         AND sender_id = Y  ← Only seller's messages
         AND is_read = false
   ↓
markChatAsRead()  // ChatContext function
   ↓
loadConversations()  // Refresh from backend
   ↓
Conversations state updated with unreadCount = 0
   ↓
Buyer goes back to ChatList
   ↓
useFocusEffect() triggers
   ↓
loadConversations()  // Refresh again
   ↓
Badge disappears from UI ✅
```

---

## Testing Checklist

### Test 1: Buyer receives message from seller
- [ ] Seller sends message to buyer
- [ ] Buyer's chat list shows unread badge (e.g., "1")
- [ ] Buyer opens conversation
- [ ] Badge disappears when buyer returns to chat list ✅

### Test 2: Multiple unread messages
- [ ] Seller sends 3 messages to buyer
- [ ] Buyer's chat list shows badge "3"
- [ ] Buyer opens conversation
- [ ] All 3 messages are marked as read
- [ ] Badge shows "0" or disappears ✅

### Test 3: Seller receives message from buyer
- [ ] Buyer sends message to seller
- [ ] Seller's chat list shows unread badge
- [ ] Seller opens conversation
- [ ] Badge disappears ✅

### Test 4: Multiple conversations
- [ ] Buyer has messages from Seller A (2 unread) and Seller B (1 unread)
- [ ] Open Seller A's chat → Badge "2" disappears
- [ ] Seller B's badge "1" remains
- [ ] Open Seller B's chat → Badge "1" disappears ✅

---

## Key Improvements

✅ **Accurate unread counting**: Only counts messages FROM the other person
✅ **Proper role handling**: Works for both buyers and sellers
✅ **Automatic refresh**: Badge updates immediately when returning to chat list
✅ **Database consistency**: Marks messages as read in database, not just locally
✅ **Better UX**: No need to manually refresh or wait for updates

---

## Database Query Examples

### Before (Incorrect - marked ALL messages as read):
```sql
UPDATE messages 
SET is_read = true
WHERE buyer_id = 'buyer123'
  AND seller_id = 'seller456'
  AND is_read = false;
```
❌ This marks BOTH buyer's and seller's messages as read!

### After (Correct - only marks seller's messages as read):
```sql
UPDATE messages 
SET is_read = true
WHERE buyer_id = 'buyer123'
  AND seller_id = 'seller456'
  AND sender_id = 'seller456'  ← Only seller's messages
  AND is_read = false;
```
✅ Only marks messages FROM the seller as read!

---

## Files Changed

1. **`server/routes/chatRoutes.js`**
   - Updated `PUT /api/chat/mark-read/:partnerId` endpoint
   - Added proper role handling for buyers and sellers
   - Added `sender_id` filtering

2. **`src/screens/buyer/Chat.jsx`**
   - Reordered marking logic (database first, then local)
   - Added better logging

3. **`src/screens/buyer/ChatList.jsx`**
   - Added `useFocusEffect` for auto-refresh
   - Removed premature `markChatAsRead()` call
   - Added React import for `useFocusEffect`

4. **`src/context/ChatContext.jsx`**
   - No changes needed (already had correct logic)

---

## No Database Migration Required

This fix uses existing database columns:
- ✅ `is_read` (already exists)
- ✅ `sender_id` (already exists)
- ✅ `buyer_id` (already exists)
- ✅ `seller_id` (already exists)

**No SQL migration needed!** 🎉

---

## Support

If badges still don't clear:
1. Check browser/app console for errors
2. Verify `sender_id` is correctly set in messages table
3. Check that `is_read` column exists and is boolean
4. Ensure user authentication is working (needs valid token)
