// Performance monitoring utility for debugging slow loading issues
class PerformanceMonitor {
  constructor() {
    this.timers = new Map();
    this.metrics = [];
  }

  // Start timing an operation
  startTimer(operationName) {
    const startTime = Date.now();
    this.timers.set(operationName, startTime);
    console.log(`⏱️ Started: ${operationName}`);
    return startTime;
  }

  // End timing and log results
  endTimer(operationName, additionalInfo = {}) {
    const startTime = this.timers.get(operationName);
    if (!startTime) {
      console.warn(`⚠️ No timer found for: ${operationName}`);
      return null;
    }

    const endTime = Date.now();
    const duration = endTime - startTime;
    
    const metric = {
      operation: operationName,
      duration,
      timestamp: endTime,
      ...additionalInfo
    };

    this.metrics.push(metric);
    this.timers.delete(operationName);

    // Log with color coding based on performance
    if (duration < 1000) {
      console.log(`✅ Completed: ${operationName} (${duration}ms) - Good`);
    } else if (duration < 3000) {
      console.log(`⚠️ Completed: ${operationName} (${duration}ms) - Slow`);
    } else {
      console.log(`❌ Completed: ${operationName} (${duration}ms) - Very Slow`);
    }

    return metric;
  }

  // Get performance summary
  getSummary() {
    const summary = {
      totalOperations: this.metrics.length,
      averageDuration: 0,
      slowOperations: [],
      fastOperations: []
    };

    if (this.metrics.length === 0) {
      return summary;
    }

    const totalDuration = this.metrics.reduce((sum, metric) => sum + metric.duration, 0);
    summary.averageDuration = Math.round(totalDuration / this.metrics.length);

    this.metrics.forEach(metric => {
      if (metric.duration > 2000) {
        summary.slowOperations.push(metric);
      } else if (metric.duration < 500) {
        summary.fastOperations.push(metric);
      }
    });

    return summary;
  }

  // Log performance summary
  logSummary() {
    const summary = this.getSummary();
    console.log('\n📊 Performance Summary:');
    console.log(`Total Operations: ${summary.totalOperations}`);
    console.log(`Average Duration: ${summary.averageDuration}ms`);
    
    if (summary.slowOperations.length > 0) {
      console.log('\n🐌 Slow Operations (>2s):');
      summary.slowOperations.forEach(op => {
        console.log(`  - ${op.operation}: ${op.duration}ms`);
      });
    }

    if (summary.fastOperations.length > 0) {
      console.log('\n⚡ Fast Operations (<500ms):');
      summary.fastOperations.forEach(op => {
        console.log(`  - ${op.operation}: ${op.duration}ms`);
      });
    }
  }

  // Clear all metrics
  clear() {
    this.metrics = [];
    this.timers.clear();
    console.log('🧹 Performance metrics cleared');
  }
}

// Create singleton instance
const performanceMonitor = new PerformanceMonitor();

// Helper functions for easy use
export const startTimer = (operationName) => performanceMonitor.startTimer(operationName);
export const endTimer = (operationName, additionalInfo) => performanceMonitor.endTimer(operationName, additionalInfo);
export const logPerformanceSummary = () => performanceMonitor.logSummary();
export const clearMetrics = () => performanceMonitor.clear();

export default performanceMonitor;
