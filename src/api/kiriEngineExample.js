// 🎯 EXAMPLE: How to use the new async KIRI Engine API
// This file shows how to implement the improved async polling in your React components

import { kiriEngineApi, createCancellationToken } from './kiriEngineApi';

// Example React component usage
export const useKiriScanWithProgress = () => {
  const [scanState, setScanState] = useState({
    isScanning: false,
    progress: null,
    status: null,
    result: null,
    error: null,
    cancellationToken: null
  });

  const startScan = async (images, productName) => {
    try {
      setScanState({
        isScanning: true,
        progress: null,
        status: null,
        result: null,
        error: null,
        cancellationToken: null
      });

      // Use the new async polling system
      const scanResult = await kiriEngineApi.startScanWithProgress(
        images,
        productName,
        // Progress callback - called every 5-10 seconds
        (progress) => {
          console.log(`📊 Progress: ${progress.elapsedMinutes}m ${progress.elapsedSeconds % 60}s - ${progress.status}`);
          setScanState(prev => ({
            ...prev,
            progress: {
              elapsedSeconds: progress.elapsedSeconds,
              elapsedMinutes: progress.elapsedMinutes,
              status: progress.status,
              isProcessing: progress.isProcessing,
              remainingSeconds: progress.remainingSeconds
            }
          }));
        },
        // Status update callback - called when status changes
        (statusUpdate) => {
          console.log(`🔄 Status Update: ${statusUpdate.status} - ${statusUpdate.message}`);
          setScanState(prev => ({
            ...prev,
            status: {
              status: statusUpdate.status,
              message: statusUpdate.message,
              elapsedSeconds: statusUpdate.elapsedSeconds
            }
          }));
        }
      );

      if (scanResult.success) {
        setScanState(prev => ({
          ...prev,
          isScanning: false,
          result: scanResult.result,
          cancellationToken: scanResult.cancellationToken
        }));
      } else {
        setScanState(prev => ({
          ...prev,
          isScanning: false,
          error: scanResult.error,
          cancellationToken: scanResult.cancellationToken
        }));
      }

    } catch (error) {
      setScanState(prev => ({
        ...prev,
        isScanning: false,
        error: error.message
      }));
    }
  };

  const cancelScan = () => {
    if (scanState.cancellationToken) {
      scanState.cancellationToken.cancel();
      setScanState(prev => ({
        ...prev,
        isScanning: false,
        error: 'Scan cancelled by user'
      }));
    }
  };

  return {
    scanState,
    startScan,
    cancelScan
  };
};

// Example usage in a React component
export const ARScanComponent = () => {
  const { scanState, startScan, cancelScan } = useKiriScanWithProgress();

  const handleStartScan = async () => {
    const images = [/* your image array */];
    const productName = 'My Product';
    
    await startScan(images, productName);
  };

  return (
    <View>
      {scanState.isScanning && (
        <View>
          <Text>🔄 Processing AR Scan...</Text>
          {scanState.progress && (
            <View>
              <Text>⏱️ Time: {scanState.progress.elapsedMinutes}m {scanState.progress.elapsedSeconds % 60}s</Text>
              <Text>📊 Status: {scanState.progress.status}</Text>
              <Text>⏳ Remaining: {Math.floor(scanState.progress.remainingSeconds / 60)}m</Text>
            </View>
          )}
          {scanState.status && (
            <Text>🔄 {scanState.status.message}</Text>
          )}
          <Button title="Cancel Scan" onPress={cancelScan} />
        </View>
      )}
      
      {scanState.result && (
        <View>
          <Text>✅ Scan completed!</Text>
          <Text>📥 Download URL: {scanState.result.glbUrl}</Text>
        </View>
      )}
      
      {scanState.error && (
        <View>
          <Text>❌ Error: {scanState.error}</Text>
        </View>
      )}
    </View>
  );
};

// 🎯 KEY IMPROVEMENTS:

// 1. **Non-blocking UI**: The polling happens in the background
// 2. **Progress tracking**: Real-time updates on processing status
// 3. **Cancellation**: Users can cancel long-running scans
// 4. **Better timeouts**: 10 minutes max instead of 5 minutes
// 5. **Adaptive polling**: Different wait times for different statuses
// 6. **Error recovery**: Exponential backoff for failed requests
// 7. **Status updates**: Clear feedback on what's happening

// 🚀 USAGE:
// 1. Import the hook: `import { useKiriScanWithProgress } from './kiriEngineExample'`
// 2. Use in component: `const { scanState, startScan, cancelScan } = useKiriScanWithProgress()`
// 3. Start scan: `await startScan(images, productName)`
// 4. Monitor progress: `scanState.progress` and `scanState.status`
// 5. Cancel if needed: `cancelScan()`
