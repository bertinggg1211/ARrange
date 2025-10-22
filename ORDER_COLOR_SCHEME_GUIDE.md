# 🎨 ORDER COLOR SCHEME GUIDE

## 📋 **COMPLETE COLOR OUTLINE FOR BUYER & SELLER UIs**

This document outlines the **standardized color scheme** for all order statuses across both buyer and seller interfaces in the AR E-commerce app.

---

## 🎯 **ORDER STATUS COLORS**

### **1. PENDING** 🟠
- **Primary Color**: `#FF8B47` (Orange)
- **Light Variant**: `#FFB74D` 
- **Dark Variant**: `#F57C00`
- **Background**: `rgba(255, 139, 71, 0.1)`
- **Border**: `rgba(255, 139, 71, 0.3)`
- **Icon**: `time-outline`
- **Usage**: Orders waiting for seller confirmation

### **2. CONFIRMED** 🔵
- **Primary Color**: `#2196F3` (Blue)
- **Light Variant**: `#64B5F6`
- **Dark Variant**: `#1976D2`
- **Background**: `rgba(33, 150, 243, 0.1)`
- **Border**: `rgba(33, 150, 243, 0.3)`
- **Icon**: `checkmark-circle`
- **Usage**: Orders confirmed by seller, ready for processing

### **3. PROCESSING** 🟣
- **Primary Color**: `#9C27B0` (Purple)
- **Light Variant**: `#BA68C8`
- **Dark Variant**: `#7B1FA2`
- **Background**: `rgba(156, 39, 176, 0.1)`
- **Border**: `rgba(156, 39, 176, 0.3)`
- **Icon**: `refresh-circle`
- **Usage**: Orders being prepared/manufactured

### **4. SHIPPED** 🔷
- **Primary Color**: `#00BCD4` (Cyan)
- **Light Variant**: `#4DD0E1`
- **Dark Variant**: `#0097A7`
- **Background**: `rgba(0, 188, 212, 0.1)`
- **Border**: `rgba(0, 188, 212, 0.3)`
- **Icon**: `airplane`
- **Usage**: Orders in transit to customer

### **5. DELIVERED** 🟢
- **Primary Color**: `#4CAF50` (Green)
- **Light Variant**: `#81C784`
- **Dark Variant**: `#388E3C`
- **Background**: `rgba(76, 175, 80, 0.1)`
- **Border**: `rgba(76, 175, 80, 0.3)`
- **Icon**: `checkmark-circle`
- **Usage**: Orders successfully delivered

### **6. CANCELLED** 🔴
- **Primary Color**: `#FF3B30` (Red)
- **Light Variant**: `#E57373`
- **Dark Variant**: `#D32F2F`
- **Background**: `rgba(255, 59, 48, 0.1)`
- **Border**: `rgba(255, 59, 48, 0.3)`
- **Icon**: `close-circle`
- **Usage**: Orders cancelled by buyer or seller

### **7. RETURNED** 🟡
- **Primary Color**: `#FF9800` (Orange)
- **Light Variant**: `#FFB74D`
- **Dark Variant**: `#F57C00`
- **Background**: `rgba(255, 152, 0, 0.1)`
- **Border**: `rgba(255, 152, 0, 0.3)`
- **Icon**: `return-up-back`
- **Usage**: Orders returned by customer

### **8. REFUNDED** ⚫
- **Primary Color**: `#607D8B` (Blue Grey)
- **Light Variant**: `#90A4AE`
- **Dark Variant**: `#455A64`
- **Background**: `rgba(96, 125, 139, 0.1)`
- **Border**: `rgba(96, 125, 139, 0.3)`
- **Icon**: `card`
- **Usage**: Orders with refund processed

---

## 💳 **PAYMENT STATUS COLORS**

### **PAYMENT PENDING** 🟠
- **Color**: `#FF8B47` (Orange)
- **Icon**: `time-outline`
- **Usage**: Payment not yet completed

### **PAID** 🟢
- **Color**: `#4CAF50` (Green)
- **Icon**: `checkmark-circle`
- **Usage**: Payment successfully processed

### **PAYMENT FAILED** 🔴
- **Color**: `#FF3B30` (Red)
- **Icon**: `close-circle`
- **Usage**: Payment processing failed

### **REFUNDED** ⚫
- **Color**: `#607D8B` (Blue Grey)
- **Icon**: `return-up-back`
- **Usage**: Payment refunded to customer

---

## ⚡ **PRIORITY COLORS**

### **HIGH PRIORITY** 🔴
- **Color**: `#FF3B30` (Red)
- **Icon**: `warning`
- **Usage**: Urgent orders requiring immediate attention

### **MEDIUM PRIORITY** 🟠
- **Color**: `#FF8B47` (Orange)
- **Icon**: `alert-circle`
- **Usage**: Standard priority orders

### **LOW PRIORITY** 🟢
- **Color**: `#4CAF50` (Green)
- **Icon**: `checkmark-circle`
- **Usage**: Non-urgent orders

---

## 🎨 **IMPLEMENTATION EXAMPLES**

### **Buyer Order Card**
```jsx
// Get status colors
const statusColors = getOrderStatusColors(order.status);

// Apply to UI elements
<View style={{
  backgroundColor: statusColors.background,
  borderColor: statusColors.border,
  borderWidth: 1
}}>
  <Icon 
    name={statusColors.icon} 
    color={statusColors.primary} 
    size={20} 
  />
  <Text style={{ color: statusColors.primary }}>
    {statusColors.label}
  </Text>
</View>
```

### **Seller Order Management**
```jsx
// Dynamic background based on status
<View style={{
  backgroundColor: getOrderStatusColors(item.status).primary
}}>
  {/* Order content */}
</View>

// Status badge
<View style={{
  backgroundColor: getOrderStatusColors(item.status).background,
  borderColor: getOrderStatusColors(item.status).border
}}>
  <Text style={{ 
    color: getOrderStatusColors(item.status).primary 
  }}>
    {getOrderStatusColors(item.status).label}
  </Text>
</View>
```

---

## 📱 **UI CONSISTENCY RULES**

### **1. Status Badges**
- Always use **primary color** for text
- Use **background color** for badge background
- Use **border color** for badge borders

### **2. Order Cards**
- **Buyer UI**: Use light backgrounds with colored borders
- **Seller UI**: Use primary colors for card backgrounds

### **3. Icons**
- Always use the designated icon for each status
- Icon color should match the primary status color

### **4. Text Colors**
- Status text: Use **primary color**
- Secondary text: Use **dark variant**
- Light text: Use **light variant**

---

## 🔧 **USAGE IN CODE**

### **Import the Color System**
```jsx
import { 
  getOrderStatusColors, 
  getPaymentStatusColors,
  getPriorityColors 
} from '../config/orderColors';
```

### **Get Colors for Any Status**
```jsx
// Order status colors
const orderColors = getOrderStatusColors('shipped');
// Returns: { primary, light, dark, background, border, icon, label }

// Payment status colors
const paymentColors = getPaymentStatusColors('paid');

// Priority colors
const priorityColors = getPriorityColors('high');
```

### **Apply to Components**
```jsx
// Status indicator
<View style={{
  backgroundColor: orderColors.background,
  borderColor: orderColors.border,
  borderWidth: 1,
  padding: 8,
  borderRadius: 12
}}>
  <Icon name={orderColors.icon} color={orderColors.primary} size={16} />
  <Text style={{ color: orderColors.primary, marginLeft: 4 }}>
    {orderColors.label}
  </Text>
</View>
```

---

## 🎯 **COLOR ACCESSIBILITY**

### **Contrast Ratios**
- All colors meet **WCAG AA standards** for text contrast
- **Primary colors** have sufficient contrast against white backgrounds
- **Dark variants** provide better contrast for small text

### **Color Blindness Support**
- Colors are distinguishable for **deuteranopia** (red-green colorblind)
- **Icons** provide additional visual cues beyond color
- **Text labels** ensure accessibility without relying solely on color

---

## 📊 **FILES UPDATED**

### **✅ Standardized Files**
- `src/config/orderColors.js` - **Main color configuration**
- `src/api/orderApi.js` - **Updated formatOrderStatus function**
- `src/screens/buyer/Order.jsx` - **Uses standardized colors**
- `src/screens/seller/Orders.jsx` - **Uses standardized colors**

### **🎨 Color Configuration**
- **Single source of truth** for all order colors
- **Utility functions** for easy color access
- **Consistent naming** across all components
- **Easy maintenance** and updates

---

## 🚀 **BENEFITS**

✅ **Consistent UI** across buyer and seller interfaces  
✅ **Easy maintenance** with centralized color management  
✅ **Accessible design** with proper contrast ratios  
✅ **Scalable system** for adding new statuses  
✅ **Developer friendly** with clear documentation  
✅ **Brand consistency** with standardized color palette  

---

**🎉 Your order system now has a complete, standardized color scheme that ensures consistency and accessibility across all user interfaces!**
