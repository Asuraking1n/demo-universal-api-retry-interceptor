import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import { Toaster, toast } from "react-hot-toast";
import {
  startGlobalInterceptor,
  stopGlobalInterceptor,
  getGlobalInterceptor,
} from "universal-api-retry-interceptor";
import "./App.css";

function App() {
  const [interceptorActive, setInterceptorActive] = useState(false);
  const [logs, setLogs] = useState([]);
  const [stats, setStats] = useState({
    isActive: false,
    isOnline: navigator.onLine,
    pendingRequests: 0,
  });

  const [requestHistory, setRequestHistory] = useState([]);
  const [activeRequests, setActiveRequests] = useState(new Set());
  const [config, setConfig] = useState({
    delayTime: 2000,
    retryInterval: 3000,
    maxRetries: 3,
    enableLogging: true,
  });
  const [testResults, setTestResults] = useState({
    successful: 0,
    failed: 0,
    retried: 0,
    total: 0,
  });
  const logContainerRef = useRef(null);

  const addLog = (message, type = "info", requestId = null) => {
    const timestamp = new Date().toLocaleTimeString();
    const newLog = {
      id: Date.now(),
      timestamp,
      message,
      type,
      requestId,
      fullTimestamp: new Date().toISOString(),
    };
    setLogs((prev) => [newLog, ...prev.slice(0, 49)]); // Keep last 50 logs

    // Auto-scroll to latest log
    setTimeout(() => {
      if (logContainerRef.current) {
        logContainerRef.current.scrollTop = 0;
      }
    }, 100);
  };

  const addRequestToHistory = (request) => {
    setRequestHistory((prev) => [request, ...prev.slice(0, 19)]); // Keep last 20 requests
  };

  const updateStats = () => {
    const interceptor = getGlobalInterceptor();
    if (interceptor) {
      const status = interceptor.getStatus();
      setStats(status);
    }
  };

  const updateTestResults = (type) => {
    setTestResults((prev) => ({
      ...prev,
      [type]: prev[type] + 1,
      total: prev.total + 1,
    }));
  };

  useEffect(() => {
    const interval = setInterval(updateStats, 1000);

    const handleOnline = () => {
      setStats((prev) => ({ ...prev, isOnline: true }));
      addLog(
        "🌐 Network is back online! Retrying stored requests...",
        "success"
      );
      toast.success("🌐 Back online! Retrying requests...");
    };

    const handleOffline = () => {
      setStats((prev) => ({ ...prev, isOnline: false }));
      addLog(
        "📴 Network went offline. Requests will be stored for retry.",
        "warning"
      );
      toast.error("📴 Gone offline! Requests will be stored...");
    };

    const handleError = (event) => {
      event.preventDefault();

      const errorMessage =
        event.error?.message || event.message || "Unknown error";

      if (errorMessage.includes("Max retries exceeded")) {
        // This is an expected retry failure - handle gracefully
        const url =
          errorMessage.match(/https?:\/\/[^\s]+/)?.[0] || "unknown URL";
        addLog(
          `💥 Expected failure: Request to ${url} failed after all retries`,
          "warning"
        );
        updateTestResults("failed");

        toast.error(
          `Request failed after retries (this is expected for error test URLs)`,
          {
            duration: 4000,
          }
        );
      } else {
        addLog(`❌ Unexpected error: ${errorMessage}`, "error");
        toast.error(`Unexpected error occurred: ${errorMessage}`);
      }
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    window.addEventListener("error", handleError);
    window.addEventListener("unhandledrejection", (event) => {
      handleError({
        error: event.reason,
        preventDefault: () => event.preventDefault(),
      });
    });

    return () => {
      clearInterval(interval);
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
      window.removeEventListener("error", handleError);
      window.removeEventListener("unhandledrejection", handleError);
    };
  }, []);

  const startInterceptor = () => {
    try {
      startGlobalInterceptor({
        delayTime: config.delayTime,
        retryInterval: config.retryInterval,
        maxRetries: config.maxRetries,
        enableLogging: config.enableLogging,
        onRetry: (error, retryCount, requestInfo) => {
          const message = `🔄 Retrying ${requestInfo.url} (attempt ${retryCount}/${config.maxRetries})`;
          addLog(message, "warning");
          toast(message, { icon: "🔄", duration: 2000 });
          updateTestResults("retried");
        },
        onMaxRetriesExceeded: (error, requestInfo) => {
          const message = `💥 Max retries exceeded for ${requestInfo.url}`;
          addLog(message, "error");
          toast.error(message);
          updateTestResults("failed");
        },
      });

      setInterceptorActive(true);
      addLog("🚀 Universal API Interceptor started with config:", "success");
      addLog(`   • Delay Time: ${config.delayTime}ms`, "info");
      addLog(`   • Retry Interval: ${config.retryInterval}ms`, "info");
      addLog(`   • Max Retries: ${config.maxRetries}`, "info");
      toast.success("🚀 Interceptor started!");
      updateStats();
    } catch (error) {
      addLog("❌ Failed to start interceptor: " + error.message, "error");
      toast.error("Failed to start interceptor");
    }
  };

  const stopInterceptor = () => {
    try {
      stopGlobalInterceptor();
      setInterceptorActive(false);
      addLog("⏹️ Interceptor stopped. All pending requests cleared.", "info");
      toast.success("⏹️ Interceptor stopped");
      updateStats();
    } catch (error) {
      addLog("❌ Failed to stop interceptor: " + error.message, "error");
      toast.error("Failed to stop interceptor");
    }
  };

  const clearPendingRequests = () => {
    const interceptor = getGlobalInterceptor();
    if (interceptor) {
      const count = interceptor.getPendingRequestsCount();
      interceptor.clearPendingRequests();
      addLog(`🧹 Cleared ${count} pending requests`, "info");
      toast.success(`🧹 Cleared ${count} pending requests`);
      updateStats();
    }
  };

  const makeRequest = async (type, url, options = {}, description = "") => {
    const requestId = Math.random().toString(36).substring(7);
    const startTime = Date.now();

    setActiveRequests((prev) => new Set([...prev, requestId]));

    const requestInfo = {
      id: requestId,
      type,
      url,
      description,
      startTime,
      status: "pending",
    };

    addRequestToHistory(requestInfo);
    addLog(`🚀 Starting ${type} request: ${description}`, "info", requestId);

    try {
      let response;
      const duration = Date.now() - startTime;

      if (type === "FETCH") {
        response = await fetch(url, options);
        if (response.ok) {
          addLog(
            `✅ ${type} SUCCESS (${duration}ms): ${description}`,
            "success",
            requestId
          );
          updateTestResults("successful");
          requestInfo.status = "success";
          requestInfo.duration = duration;
          requestInfo.statusCode = response.status;
        }
      } else if (type === "AXIOS") {
        response = await axios({ url, ...options });
        addLog(
          `✅ ${type} SUCCESS (${duration}ms): ${description}`,
          "success",
          requestId
        );
        updateTestResults("successful");
        requestInfo.status = "success";
        requestInfo.duration = duration;
        requestInfo.statusCode = response.status;
      }
    } catch (error) {
      const duration = Date.now() - startTime;

      // Check if this is a "Max retries exceeded" error (expected behavior)
      if (error.message && error.message.includes("Max retries exceeded")) {
        addLog(
          `💥 ${type} EXPECTED FAILURE (${duration}ms): ${description} - Failed after ${config.maxRetries} retries`,
          "warning",
          requestId
        );
        updateTestResults("failed");
        requestInfo.status = "max_retries";

        toast(
          `${description} - Failed after retries (expected for error tests)`,
          {
            icon: "💥",
            duration: 3000,
            style: {
              background: "#fed7d7",
              color: "#c53030",
            },
          }
        );
      } else {
        addLog(
          `❌ ${type} UNEXPECTED ERROR (${duration}ms): ${error.message}`,
          "error",
          requestId
        );
        updateTestResults("failed");
        requestInfo.status = "error";
        toast.error(`Unexpected error: ${error.message}`);
      }

      requestInfo.duration = duration;
      requestInfo.error = error.message;
    } finally {
      setActiveRequests((prev) => {
        const newSet = new Set(prev);
        newSet.delete(requestId);
        return newSet;
      });
    }
  };

  const makeXHRRequest = (url, description) => {
    const requestId = Math.random().toString(36).substring(7);
    const startTime = Date.now();

    setActiveRequests((prev) => new Set([...prev, requestId]));

    const requestInfo = {
      id: requestId,
      type: "XHR",
      url,
      description,
      startTime,
      status: "pending",
    };

    addRequestToHistory(requestInfo);
    addLog(`🚀 Starting XHR request: ${description}`, "info", requestId);

    const xhr = new XMLHttpRequest();
    xhr.open("GET", url);

    xhr.onload = function () {
      const duration = Date.now() - startTime;
      if (xhr.status >= 200 && xhr.status < 300) {
        addLog(
          `✅ XHR SUCCESS (${duration}ms): ${description}`,
          "success",
          requestId
        );
        updateTestResults("successful");
        requestInfo.status = "success";
        requestInfo.duration = duration;
        requestInfo.statusCode = xhr.status;
      } else {
        addLog(
          `🔄 XHR Server Error (${xhr.status}) - Will be retried: ${description}`,
          "warning",
          requestId
        );
      }
      setActiveRequests((prev) => {
        const newSet = new Set(prev);
        newSet.delete(requestId);
        return newSet;
      });
    };

    xhr.onerror = function () {
      const duration = Date.now() - startTime;
      addLog(
        `❌ XHR NETWORK ERROR (${duration}ms): ${description}`,
        "error",
        requestId
      );
      requestInfo.status = "error";
      requestInfo.duration = duration;
      setActiveRequests((prev) => {
        const newSet = new Set(prev);
        newSet.delete(requestId);
        return newSet;
      });
    };

    xhr.send();
  };

  const runTestSuite = async () => {
    if (!interceptorActive) {
      toast.error("Start the interceptor first!");
      return;
    }

    addLog("🧪 Starting comprehensive test suite...", "info");
    addLog(
      "ℹ️  Note: Error tests (500, 503, 502) are EXPECTED to fail after retries - this demonstrates the interceptor working!",
      "info"
    );
    toast.loading(
      "🧪 Running test suite... Error tests will fail after retries (this is expected!)",
      { duration: 3000 }
    );

    setTimeout(
      () =>
        makeRequest(
          "FETCH",
          "https://jsonplaceholder.typicode.com/posts/1",
          {},
          "Fetch: Get Post #1"
        ),
      500
    );
    setTimeout(
      () =>
        makeRequest(
          "AXIOS",
          "https://jsonplaceholder.typicode.com/users/1",
          { method: "GET" },
          "Axios: Get User #1"
        ),
      1000
    );
    setTimeout(
      () =>
        makeXHRRequest(
          "https://jsonplaceholder.typicode.com/posts/2",
          "XHR: Get Post #2"
        ),
      1500
    );

    setTimeout(() => {
      addLog(
        "⚠️  Starting error tests - these will retry 3 times then fail (expected behavior)",
        "warning"
      );
      makeRequest(
        "FETCH",
        "https://httpstat.us/500",
        {},
        "Fetch: Server Error (500) - Will retry then fail"
      );
    }, 2000);
    setTimeout(
      () =>
        makeRequest(
          "AXIOS",
          "https://httpstat.us/503",
          { method: "GET" },
          "Axios: Service Unavailable (503) - Will retry then fail"
        ),
      2500
    );
    setTimeout(
      () =>
        makeXHRRequest(
          "https://httpstat.us/502",
          "XHR: Bad Gateway (502) - Will retry then fail"
        ),
      3000
    );

    setTimeout(
      () =>
        makeRequest(
          "FETCH",
          "https://httpstat.us/200?sleep=5000",
          {},
          "Fetch: Slow Response (5s)"
        ),
      3500
    );
    setTimeout(
      () =>
        makeRequest(
          "AXIOS",
          "https://httpstat.us/429",
          { method: "GET" },
          "Axios: Rate Limited (429) - Will retry then fail"
        ),
      4000
    );
  };

  const clearLogs = () => {
    setLogs([]);
    addLog("🧹 Logs cleared", "info");
  };

  const clearHistory = () => {
    setRequestHistory([]);
    setTestResults({ successful: 0, failed: 0, retried: 0, total: 0 });
    addLog("🗑️ Request history and stats cleared", "info");
  };

  const simulateOffline = () => {
    addLog(
      "📴 Simulating offline mode... All new requests will be stored.",
      "warning"
    );
    toast.loading("📴 Going offline...", { duration: 2000 });

    setStats((prev) => ({ ...prev, isOnline: false }));

    window.dispatchEvent(new Event("offline"));

    Object.defineProperty(navigator, "onLine", {
      writable: true,
      value: false,
    });
  };
  const simulateOnline = () => {
    addLog(
      "📶 Simulating online mode... Stored requests will be retried.",
      "success"
    );
    toast.success("📶 Going online...", { duration: 2000 });

    setStats((prev) => ({ ...prev, isOnline: true }));

    window.dispatchEvent(new Event("online"));

    Object.defineProperty(navigator, "onLine", {
      writable: true,
      value: true,
    });
  };
  const testOfflineScenario = async () => {
    if (!interceptorActive) {
      toast.error("Start the interceptor first!");
      return;
    }

    addLog("🧪 Starting offline scenario test...", "info");

    // Step 1: Go offline
    addLog("📴 Step 1: Going offline...", "warning");
    simulateOffline();

    // Step 2: Make requests while offline (should be stored)
    setTimeout(() => {
      addLog(
        "📦 Step 2: Making requests while offline (should be stored)...",
        "info"
      );
      makeRequest(
        "FETCH",
        "https://jsonplaceholder.typicode.com/posts/1",
        {},
        "Offline Test: Should be stored"
      );
      makeRequest(
        "AXIOS",
        "https://jsonplaceholder.typicode.com/users/1",
        { method: "GET" },
        "Offline Test: Should be stored"
      );
    }, 1000);

    // Step 3: Go back online (stored requests should execute)
    setTimeout(() => {
      addLog(
        "📶 Step 3: Going back online (stored requests should execute)...",
        "success"
      );
      simulateOnline();
    }, 3000);
  };

  return (
    <div className="app">
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 3000,
          style: {
            background: "#363636",
            color: "#fff",
          },
        }}
      />

      <div className="container">
        <header className="header">
          <h1>🌐 Universal API Retry Interceptor</h1>
          <p>Interactive Test Dashboard</p>
          <div className="header-stats">
            <span
              className={`status-badge ${
                interceptorActive ? "active" : "inactive"
              }`}
            >
              {interceptorActive ? "🟢 ACTIVE" : "🔴 INACTIVE"}
            </span>
            <span
              className={`status-badge ${
                stats.isOnline ? "online" : "offline"
              }`}
            >
              {stats.isOnline ? "📶 ONLINE" : "📴 OFFLINE"}
            </span>
            <span className="status-badge pending">
              🔄 {stats.pendingRequests} PENDING
            </span>
          </div>
        </header>

        {/* Enhanced Control Panel */}
        <div className="control-panel">
          <div className="config-section">
            <h3>⚙️ Configuration</h3>
            <div className="config-controls">
              <div className="config-item">
                <label>Delay Time (ms):</label>
                <input
                  type="number"
                  value={config.delayTime}
                  onChange={(e) =>
                    setConfig((prev) => ({
                      ...prev,
                      delayTime: parseInt(e.target.value),
                    }))
                  }
                  disabled={interceptorActive}
                  min="100"
                  max="10000"
                  step="100"
                />
              </div>
              <div className="config-item">
                <label>Retry Interval (ms):</label>
                <input
                  type="number"
                  value={config.retryInterval}
                  onChange={(e) =>
                    setConfig((prev) => ({
                      ...prev,
                      retryInterval: parseInt(e.target.value),
                    }))
                  }
                  disabled={interceptorActive}
                  min="1000"
                  max="30000"
                  step="500"
                />
              </div>
              <div className="config-item">
                <label>Max Retries:</label>
                <input
                  type="number"
                  value={config.maxRetries}
                  onChange={(e) =>
                    setConfig((prev) => ({
                      ...prev,
                      maxRetries: parseInt(e.target.value),
                    }))
                  }
                  disabled={interceptorActive}
                  min="1"
                  max="10"
                />
              </div>
            </div>
          </div>

          <div className="action-section">
            <h3>🎮 Actions</h3>
            <div className="controls">
              <button
                onClick={startInterceptor}
                disabled={interceptorActive}
                className="btn btn-primary"
              >
                🚀 Start Interceptor
              </button>
              <button
                onClick={stopInterceptor}
                disabled={!interceptorActive}
                className="btn btn-secondary"
              >
                ⏹️ Stop Interceptor
              </button>
              <button
                onClick={clearPendingRequests}
                disabled={!interceptorActive || stats.pendingRequests === 0}
                className="btn btn-warning"
              >
                🧹 Clear Pending ({stats.pendingRequests})
              </button>
            </div>
          </div>
        </div>

        {/* Status Explanation */}
        <div className="status-explanation">
          <h3>💡 Understanding Test Results</h3>
          <div className="explanation-grid">
            <div className="explanation-item success">
              <span className="explanation-icon">✅</span>
              <div>
                <strong>Successful Requests</strong>
                <p>Requests that completed successfully (200 status)</p>
              </div>
            </div>
            <div className="explanation-item retry">
              <span className="explanation-icon">🔄</span>
              <div>
                <strong>Retried Requests</strong>
                <p>Number of retry attempts made by the interceptor</p>
              </div>
            </div>
            <div className="explanation-item failed">
              <span className="explanation-icon">💥</span>
              <div>
                <strong>Expected Failures</strong>
                <p>
                  Error test URLs (500, 503, etc.) that failed after retries -
                  this proves the interceptor works!
                </p>
              </div>
            </div>
            <div className="explanation-item total">
              <span className="explanation-icon">📊</span>
              <div>
                <strong>Total Requests</strong>
                <p>All requests made (successful + failed)</p>
              </div>
            </div>
          </div>
        </div>
        <div className="results-dashboard">
          <h3>📊 Test Results</h3>
          <div className="results-stats">
            <div className="result-card success">
              <div className="result-number">{testResults.successful}</div>
              <div className="result-label">Successful</div>
            </div>
            <div className="result-card retry">
              <div className="result-number">{testResults.retried}</div>
              <div className="result-label">Retried</div>
            </div>
            <div className="result-card failed">
              <div className="result-number">{testResults.failed}</div>
              <div className="result-label">Failed</div>
            </div>
            <div className="result-card total">
              <div className="result-number">{testResults.total}</div>
              <div className="result-label">Total</div>
            </div>
            <div className="result-card active">
              <div className="result-number">{activeRequests.size}</div>
              <div className="result-label">Active</div>
            </div>
          </div>
        </div>

        {/* Enhanced Test Sections */}
        <div className="test-sections">
          <div className="test-section comprehensive">
            <h3>🚀 Comprehensive Test Suite</h3>
            <p>Runs multiple requests to test all scenarios</p>
            <div className="test-explanation">
              <p>
                <strong>ℹ️ What to expect:</strong>
              </p>
              <ul>
                <li>
                  ✅ <strong>Successful requests</strong> - Will complete
                  normally
                </li>
                <li>
                  🔄 <strong>Error requests (500, 503, 502, 429)</strong> - Will
                  retry 3 times, then fail with "Max retries exceeded" (this is
                  expected!)
                </li>
                <li>
                  📱{" "}
                  <strong>
                    The errors you see are proof your interceptor is working!
                  </strong>
                </li>
              </ul>
            </div>
            <button
              onClick={runTestSuite}
              disabled={!interceptorActive}
              className="btn btn-comprehensive"
            >
              🧪 Run Full Test Suite
            </button>
          </div>

          <div className="test-section">
            <h3>🎯 Individual Tests</h3>
            <div className="individual-tests">
              <button
                onClick={() =>
                  makeRequest(
                    "FETCH",
                    "https://jsonplaceholder.typicode.com/posts/1",
                    {},
                    "Manual Fetch Test"
                  )
                }
                disabled={!interceptorActive}
                className="btn btn-test"
              >
                🧪 Test Fetch
              </button>
              <button
                onClick={() =>
                  makeRequest(
                    "AXIOS",
                    "https://jsonplaceholder.typicode.com/users/1",
                    { method: "GET" },
                    "Manual Axios Test"
                  )
                }
                disabled={!interceptorActive}
                className="btn btn-test"
              >
                🧪 Test Axios
              </button>
              <button
                onClick={() =>
                  makeXHRRequest(
                    "https://jsonplaceholder.typicode.com/posts/2",
                    "Manual XHR Test"
                  )
                }
                disabled={!interceptorActive}
                className="btn btn-test"
              >
                🧪 Test XHR
              </button>
            </div>
          </div>

          <div className="test-section">
            <h3>💥 Error Tests</h3>
            <div className="error-tests">
              <button
                onClick={() =>
                  makeRequest(
                    "FETCH",
                    "https://httpstat.us/500",
                    {},
                    "Server Error Test"
                  )
                }
                disabled={!interceptorActive}
                className="btn btn-error"
              >
                ⚠️ 500 Error
              </button>
              <button
                onClick={() =>
                  makeRequest(
                    "AXIOS",
                    "https://httpstat.us/503",
                    { method: "GET" },
                    "Service Unavailable Test"
                  )
                }
                disabled={!interceptorActive}
                className="btn btn-error"
              >
                ⚠️ 503 Error
              </button>
              <button
                onClick={() =>
                  makeXHRRequest("https://httpstat.us/429", "Rate Limited Test")
                }
                disabled={!interceptorActive}
                className="btn btn-error"
              >
                ⚠️ 429 Error
              </button>
            </div>
          </div>
        </div>

        {/* Network Simulation */}
        <div className="network-simulation">
          <h3>📡 Network Simulation</h3>
          <div className="offline-explanation">
            <p>
              <strong>🔍 How to test offline mode:</strong>
            </p>
            <ol>
              <li>Click "Go Offline" button</li>
              <li>Make some API requests (they should be stored)</li>
              <li>Click "Go Online" button</li>
              <li>Watch stored requests execute automatically</li>
            </ol>
            <p>
              <strong>💡 Alternative:</strong> Use Chrome DevTools → Network tab
              → "Offline" checkbox for real offline simulation
            </p>
          </div>
          <div className="controls">
            <button onClick={simulateOffline} className="btn btn-offline">
              📴 Go Offline
            </button>
            <button onClick={simulateOnline} className="btn btn-online">
              📶 Go Online
            </button>
            <button
              onClick={testOfflineScenario}
              className="btn btn-test"
              disabled={!interceptorActive}
            >
              🧪 Test Offline Scenario
            </button>
          </div>
        </div>

        {/* Request History */}
        <div className="history-section">
          <h3>📋 Request History</h3>
          <div className="history-controls">
            <button onClick={clearHistory} className="btn btn-clear">
              🗑️ Clear History
            </button>
          </div>
          <div className="request-history">
            {requestHistory.length === 0 ? (
              <p className="no-history">
                No requests made yet. Run some tests!
              </p>
            ) : (
              requestHistory.map((request) => (
                <div
                  key={request.id}
                  className={`request-item ${request.status}`}
                >
                  <div className="request-header">
                    <span
                      className={`request-type ${request.type.toLowerCase()}`}
                    >
                      {request.type}
                    </span>
                    <span className="request-description">
                      {request.description}
                    </span>
                    <span className={`request-status ${request.status}`}>
                      {request.status === "success"
                        ? "✅"
                        : request.status === "error"
                        ? "❌"
                        : request.status === "pending"
                        ? "⏳"
                        : "🔄"}
                    </span>
                  </div>
                  <div className="request-details">
                    <span className="request-url">{request.url}</span>
                    {request.duration && (
                      <span className="request-duration">
                        {request.duration}ms
                      </span>
                    )}
                    {request.statusCode && (
                      <span className="request-code">{request.statusCode}</span>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Enhanced Logs */}
        <div className="logs-section">
          <h3>📋 Live Activity Log</h3>
          <div className="log-controls">
            <button onClick={clearLogs} className="btn btn-clear">
              🧹 Clear Logs
            </button>
            <span className="log-count">{logs.length} entries</span>
          </div>
          <div className="logs" ref={logContainerRef}>
            {logs.length === 0 ? (
              <p className="no-logs">
                No activity yet. Start the interceptor and run some tests!
              </p>
            ) : (
              logs.map((log) => (
                <div key={log.id} className={`log-entry log-${log.type}`}>
                  <span className="log-time">[{log.timestamp}]</span>
                  <span className="log-message">{log.message}</span>
                  {log.requestId && (
                    <span className="log-request-id">#{log.requestId}</span>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <footer className="footer">
        <div className="footer-content">
          <div className="footer-section about">
            <h3>🌐 Universal API Retry Interceptor</h3>
            <p>
              A powerful, universal solution for handling API retries and
              network resilience in web applications. Works with any HTTP
              library!
            </p>
            <div className="footer-stats">
              <span className="footer-stat">✅ Zero Dependencies</span>
              <span className="footer-stat">🚀 Production Ready</span>
              <span className="footer-stat">🔧 TypeScript Support</span>
            </div>
          </div>

          <div className="footer-section links">
            <h3>🔗 Links & Resources</h3>
            <div className="footer-links">
              <a
                href="https://github.com/asuraking1n"
                target="_blank"
                rel="noopener noreferrer"
                className="footer-link github"
              >
                <span className="link-icon">📦</span>
                <span>GitHub Profile</span>
              </a>
              <a
                href="https://www.linkedin.com/in/nishant-kumar-tiwari-253a46196/"
                target="_blank"
                rel="noopener noreferrer"
                className="footer-link linkedin"
              >
                <span className="link-icon">💼</span>
                <span>LinkedIn Profile</span>
              </a>
              <a
                href="https://www.npmjs.com/package/universal-api-retry-interceptor"
                target="_blank"
                rel="noopener noreferrer"
                className="footer-link npm"
              >
                <span className="link-icon">📋</span>
                <span>NPM Package</span>
              </a>
            </div>
          </div>

          <div className="footer-section contribute">
            <h3>🤝 Contribute</h3>
            <p>Found a bug or want to contribute? We'd love your help!</p>
            <div className="contribute-actions">
              <a
                href="https://github.com/asuraking1n/universal-api-retry-interceptor"
                target="_blank"
                rel="noopener noreferrer"
                className="contribute-btn"
              >
                🐛 Report Issues
              </a>
              <a
                href="https://github.com/asuraking1n/universal-api-retry-interceptor/pulls"
                target="_blank"
                rel="noopener noreferrer"
                className="contribute-btn"
              >
                🔧 Submit PR
              </a>
              <a
                href="https://github.com/asuraking1n/universal-api-retry-interceptor/fork"
                target="_blank"
                rel="noopener noreferrer"
                className="contribute-btn"
              >
                ⭐ Fork Project
              </a>
            </div>
          </div>
        </div>

        <div className="footer-bottom">
          <div className="footer-copyright">
            <p>
              Made by 👨‍💻dev for 👨‍💻devs (
              <a
                href="https://www.linkedin.com/in/nishant-kumar-tiwari-253a46196/"
                target="_blank"
                rel="noopener noreferrer"
                className="author-link"
              >
                Nishant Kumar Tiwari
              </a>{" "}
              )
            </p>
            <p className="footer-tagline">
              Empowering developers with bulletproof network resilience 🚀
            </p>
          </div>
          <div className="footer-tech">
            <span className="tech-badge">React</span>
            <span className="tech-badge">TypeScript</span>
            <span className="tech-badge">Universal</span>
            <span className="tech-badge">Browser</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;
