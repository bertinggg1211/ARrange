// =============================================
// ORDER STATUS COLOR SCHEME
// Standardized colors for buyer and seller UIs
// =============================================

export const ORDER_STATUS_COLORS = {
  // Primary status colors
  PENDING: {
    primary: '#FF8B47',      // Orange - Waiting for action
    light: '#FFB74D',        // Light orange for backgrounds
    dark: '#F57C00',         // Dark orange for text
    background: 'rgba(255, 139, 71, 0.1)',  // Light background
    border: 'rgba(255, 139, 71, 0.3)',      // Border color
    icon: 'time-outline',
    label: 'Pending'
  },
  
  CONFIRMED: {
    primary: '#2196F3',      // Blue - Confirmed and ready
    light: '#64B5F6',        // Light blue for backgrounds  
    dark: '#1976D2',         // Dark blue for text
    background: 'rgba(33, 150, 243, 0.1)',
    border: 'rgba(33, 150, 243, 0.3)',
    icon: 'checkmark-circle',
    label: 'Confirmed'
  },
  
  PROCESSING: {
    primary: '#9C27B0',      // Purple - Being processed
    light: '#BA68C8',        // Light purple for backgrounds
    dark: '#7B1FA2',         // Dark purple for text
    background: 'rgba(156, 39, 176, 0.1)',
    border: 'rgba(156, 39, 176, 0.3)',
    icon: 'refresh-circle',
    label: 'Processing'
  },
  
  SHIPPED: {
    primary: '#00BCD4',      // Cyan - In transit
    light: '#4DD0E1',        // Light cyan for backgrounds
    dark: '#0097A7',         // Dark cyan for text
    background: 'rgba(0, 188, 212, 0.1)',
    border: 'rgba(0, 188, 212, 0.3)',
    icon: 'airplane',
    label: 'Shipped'
  },
  
  DELIVERED: {
    primary: '#4CAF50',      // Green - Successfully delivered
    light: '#81C784',        // Light green for backgrounds
    dark: '#388E3C',         // Dark green for text
    background: 'rgba(76, 175, 80, 0.1)',
    border: 'rgba(76, 175, 80, 0.3)',
    icon: 'checkmark-circle',
    label: 'Delivered'
  },
  
  CANCELLED: {
    primary: '#FF3B30',      // Red - Cancelled order
    light: '#E57373',        // Light red for backgrounds
    dark: '#D32F2F',         // Dark red for text
    background: 'rgba(255, 59, 48, 0.1)',
    border: 'rgba(255, 59, 48, 0.3)',
    icon: 'close-circle',
    label: 'Cancelled'
  },
  
  RETURNED: {
    primary: '#FF9800',      // Orange - Returned item
    light: '#FFB74D',        // Light orange for backgrounds
    dark: '#F57C00',         // Dark orange for text
    background: 'rgba(255, 152, 0, 0.1)',
    border: 'rgba(255, 152, 0, 0.3)',
    icon: 'return-up-back',
    label: 'Returned'
  },
  
  REFUNDED: {
    primary: '#607D8B',      // Blue Grey - Refunded
    light: '#90A4AE',        // Light blue grey for backgrounds
    dark: '#455A64',         // Dark blue grey for text
    background: 'rgba(96, 125, 139, 0.1)',
    border: 'rgba(96, 125, 139, 0.3)',
    icon: 'card',
    label: 'Refunded'
  }
};

// =============================================
// PAYMENT STATUS COLORS
// =============================================

export const PAYMENT_STATUS_COLORS = {
  PENDING: {
    primary: '#FF8B47',      // Orange - Payment pending
    background: 'rgba(255, 139, 71, 0.1)',
    icon: 'time-outline',
    label: 'Payment Pending'
  },
  
  PAID: {
    primary: '#4CAF50',      // Green - Payment successful
    background: 'rgba(76, 175, 80, 0.1)',
    icon: 'checkmark-circle',
    label: 'Paid'
  },
  
  FAILED: {
    primary: '#FF3B30',      // Red - Payment failed
    background: 'rgba(255, 59, 48, 0.1)',
    icon: 'close-circle',
    label: 'Payment Failed'
  },
  
  REFUNDED: {
    primary: '#607D8B',      // Blue Grey - Payment refunded
    background: 'rgba(96, 125, 139, 0.1)',
    icon: 'return-up-back',
    label: 'Refunded'
  }
};

// =============================================
// PRIORITY COLORS
// =============================================

export const PRIORITY_COLORS = {
  HIGH: {
    primary: '#FF3B30',      // Red - High priority
    background: 'rgba(255, 59, 48, 0.1)',
    icon: 'warning',
    label: 'High Priority'
  },
  
  MEDIUM: {
    primary: '#FF8B47',      // Orange - Medium priority
    background: 'rgba(255, 139, 71, 0.1)',
    icon: 'alert-circle',
    label: 'Medium Priority'
  },
  
  LOW: {
    primary: '#4CAF50',      // Green - Low priority
    background: 'rgba(76, 175, 80, 0.1)',
    icon: 'checkmark-circle',
    label: 'Low Priority'
  }
};

// =============================================
// UTILITY FUNCTIONS
// =============================================

/**
 * Get color scheme for order status
 * @param {string} status - Order status (pending, confirmed, processing, shipped, delivered, cancelled, returned)
 * @returns {object} Color scheme object
 */
export const getOrderStatusColors = (status) => {
  const normalizedStatus = status?.toUpperCase() || 'PENDING';
  return ORDER_STATUS_COLORS[normalizedStatus] || ORDER_STATUS_COLORS.PENDING;
};

/**
 * Get color scheme for payment status
 * @param {string} status - Payment status (pending, paid, failed, refunded)
 * @returns {object} Color scheme object
 */
export const getPaymentStatusColors = (status) => {
  const normalizedStatus = status?.toUpperCase() || 'PENDING';
  return PAYMENT_STATUS_COLORS[normalizedStatus] || PAYMENT_STATUS_COLORS.PENDING;
};

/**
 * Get color scheme for priority level
 * @param {string} priority - Priority level (high, medium, low)
 * @returns {object} Color scheme object
 */
export const getPriorityColors = (priority) => {
  const normalizedPriority = priority?.toUpperCase() || 'MEDIUM';
  return PRIORITY_COLORS[normalizedPriority] || PRIORITY_COLORS.MEDIUM;
};

// =============================================
// GRADIENT COLORS FOR CARDS
// =============================================

export const ORDER_GRADIENTS = {
  PENDING: ['#FF8B47', '#FFB74D'],
  CONFIRMED: ['#2196F3', '#64B5F6'],
  PROCESSING: ['#9C27B0', '#BA68C8'],
  SHIPPED: ['#00BCD4', '#4DD0E1'],
  DELIVERED: ['#4CAF50', '#81C784'],
  CANCELLED: ['#FF3B30', '#E57373'],
  RETURNED: ['#FF9800', '#FFB74D'],
  REFUNDED: ['#607D8B', '#90A4AE']
};

// =============================================
// THEME COLORS FOR CONSISTENCY
// =============================================

export const THEME_COLORS = {
  PRIMARY: '#FF8B47',        // Main app color
  SECONDARY: '#2196F3',      // Secondary app color
  SUCCESS: '#4CAF50',        // Success messages
  WARNING: '#FF8B47',        // Warning messages
  ERROR: '#FF3B30',          // Error messages
  INFO: '#2196F3',           // Info messages
  
  // Text colors
  TEXT_PRIMARY: '#1A1A1A',   // Main text
  TEXT_SECONDARY: '#666666', // Secondary text
  TEXT_LIGHT: '#999999',     // Light text
  TEXT_WHITE: '#FFFFFF',     // White text
  
  // Background colors
  BACKGROUND_PRIMARY: '#FFFFFF',     // Main background
  BACKGROUND_SECONDARY: '#F5F5F5',   // Secondary background
  BACKGROUND_DARK: '#1A1A1A',        // Dark background
  
  // Border colors
  BORDER_LIGHT: '#E0E0E0',   // Light border
  BORDER_MEDIUM: '#CCCCCC',  // Medium border
  BORDER_DARK: '#999999'     // Dark border
};

export default {
  ORDER_STATUS_COLORS,
  PAYMENT_STATUS_COLORS,
  PRIORITY_COLORS,
  ORDER_GRADIENTS,
  THEME_COLORS,
  getOrderStatusColors,
  getPaymentStatusColors,
  getPriorityColors
};
