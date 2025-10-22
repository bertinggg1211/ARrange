const { supabase } = require('./db/supabase');

// Performance monitoring utilities
class PerformanceMonitor {
  constructor() {
    this.metrics = new Map();
  }

  // Start timing a database operation
  startTimer(operationName) {
    const startTime = process.hrtime.bigint();
    return {
      operationName,
      startTime,
      end: () => {
        const endTime = process.hrtime.bigint();
        const duration = Number(endTime - startTime) / 1000000; // Convert to milliseconds
        this.recordMetric(operationName, duration);
        return duration;
      }
    };
  }

  // Record a performance metric
  recordMetric(operationName, duration) {
    if (!this.metrics.has(operationName)) {
      this.metrics.set(operationName, {
        count: 0,
        totalTime: 0,
        minTime: Infinity,
        maxTime: 0,
        avgTime: 0
      });
    }

    const metric = this.metrics.get(operationName);
    metric.count++;
    metric.totalTime += duration;
    metric.minTime = Math.min(metric.minTime, duration);
    metric.maxTime = Math.max(metric.maxTime, duration);
    metric.avgTime = metric.totalTime / metric.count;

    // Log slow queries (> 1000ms)
    if (duration > 1000) {
      console.warn(`🐌 SLOW QUERY: ${operationName} took ${duration.toFixed(2)}ms`);
    } else if (duration > 500) {
      console.log(`⚠️ MODERATE: ${operationName} took ${duration.toFixed(2)}ms`);
    } else {
      console.log(`⚡ FAST: ${operationName} took ${duration.toFixed(2)}ms`);
    }
  }

  // Get performance report
  getReport() {
    const report = {};
    for (const [operation, metrics] of this.metrics) {
      report[operation] = {
        calls: metrics.count,
        totalTime: `${metrics.totalTime.toFixed(2)}ms`,
        avgTime: `${metrics.avgTime.toFixed(2)}ms`,
        minTime: `${metrics.minTime.toFixed(2)}ms`,
        maxTime: `${metrics.maxTime.toFixed(2)}ms`
      };
    }
    return report;
  }

  // Print performance report
  printReport() {
    console.log('\n📊 PERFORMANCE REPORT:');
    console.log('='.repeat(80));
    
    const report = this.getReport();
    for (const [operation, metrics] of Object.entries(report)) {
      console.log(`\n🔍 ${operation}:`);
      console.log(`   Calls: ${metrics.calls}`);
      console.log(`   Total: ${metrics.totalTime}`);
      console.log(`   Avg: ${metrics.avgTime}`);
      console.log(`   Min: ${metrics.minTime}`);
      console.log(`   Max: ${metrics.maxTime}`);
    }
    console.log('='.repeat(80));
  }

  // Check database health
  async checkDatabaseHealth() {
    console.log('\n🏥 DATABASE HEALTH CHECK:');
    console.log('='.repeat(50));

    try {
      // Test basic connectivity
      const timer = this.startTimer('health_check');
      const { data, error } = await supabase
        .from('users')
        .select('id')
        .limit(1);
      
      const duration = timer.end();
      
      if (error) {
        console.log('❌ Database connection: FAILED');
        console.log('   Error:', error.message);
        return false;
      }

      console.log('✅ Database connection: OK');
      console.log(`   Response time: ${duration.toFixed(2)}ms`);

      // Check table sizes
      await this.checkTableSizes();

      return true;
    } catch (error) {
      console.log('❌ Database health check failed:', error.message);
      return false;
    }
  }

  // Check table sizes for performance insights
  async checkTableSizes() {
    try {
      const tables = ['users', 'products', 'ar_scans', 'carts', 'messages'];
      
      console.log('\n📋 TABLE SIZES:');
      for (const table of tables) {
        try {
          const { count, error } = await supabase
            .from(table)
            .select('*', { count: 'exact', head: true });
          
          if (!error) {
            console.log(`   ${table}: ${count || 0} rows`);
          }
        } catch (e) {
          console.log(`   ${table}: Unable to count (${e.message})`);
        }
      }
    } catch (error) {
      console.log('   Error checking table sizes:', error.message);
    }
  }

  // Clear metrics
  clearMetrics() {
    this.metrics.clear();
    console.log('🗑️ Performance metrics cleared');
  }
}

// Create global performance monitor instance
const performanceMonitor = new PerformanceMonitor();

// Export for use in other modules
module.exports = {
  performanceMonitor,
  PerformanceMonitor
};

// CLI usage
if (require.main === module) {
  (async () => {
    console.log('🚀 Starting database performance check...');
    
    const isHealthy = await performanceMonitor.checkDatabaseHealth();
    
    if (isHealthy) {
      console.log('\n✅ Database is healthy and performing well!');
    } else {
      console.log('\n❌ Database has performance issues that need attention.');
    }
    
    process.exit(isHealthy ? 0 : 1);
  })();
}
