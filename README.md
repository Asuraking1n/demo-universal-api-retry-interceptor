# 🎮 Universal API Retry Interceptor - React Demo

<div align="center">

![Demo Screenshot](https://github.com/user-attachments/assets/2d217a9f-48e6-4a1a-adbc-5931325a4228
)

**An interactive, comprehensive demonstration of the Universal API Retry Interceptor in action with React**

[🚀 Live Demo](https://demo-universal-api-retry-interceptor.netlify.app/) • [📦 Main Package](https://github.com/asuraking1n/universal-api-retry-interceptor) • [📖 Documentation](https://github.com/Asuraking1n/universal-api-retry-interceptor)

</div>

---

## 🌟 What This Demo Shows

This React application provides a **real-time, interactive demonstration** of the Universal API Retry Interceptor's capabilities. Watch as the interceptor automatically handles network failures, retries requests, and manages offline scenarios - all while maintaining a smooth user experience.

### 🎯 **Key Demonstrations:**

- ✅ **Universal HTTP Library Support** - See fetch, Axios, and XMLHttpRequest all protected by the same interceptor
- 🔄 **Intelligent Retry Logic** - Watch failed requests automatically retry with configurable delays  
- 📱 **Offline Resilience** - Simulate network outages and see requests stored then executed when back online
- 🎛️ **Real-time Configuration** - Adjust retry settings and see immediate effects
- 📊 **Live Monitoring** - Track request success rates, retry attempts, and pending operations
- 🎨 **Professional UI** - Beautiful, responsive interface showcasing best practices

---

## 🚀 Quick Start

### Prerequisites
- Node.js 14+ 
- npm or yarn

### Installation & Setup

```bash
# Clone the repository
git clone https://github.com/asuraking1n/universal-api-retry-interceptor.git
cd universal-api-retry-interceptor/example-react-app

# Install dependencies
npm install

# Start the development server
npm start

# Open http://localhost:3000 in your browser
```

### Alternative: Using the NPM Package

```bash
# Create a new React app
npx create-react-app my-interceptor-demo
cd my-interceptor-demo

# Install the interceptor package
npm install universal-api-retry-interceptor axios react-hot-toast

# Copy the demo files from this repository
# Replace src/App.js and src/App.css with the demo versions

# Start the app
npm start
```

---

## 🎮 Interactive Features

### 🎛️ **Configuration Panel**
- **Real-time Settings** - Adjust delay time, retry interval, and max retries
- **Live Updates** - See configuration changes applied immediately
- **Visual Feedback** - Settings are disabled when interceptor is active

### 📊 **Live Dashboard**
- **Status Indicators** - Interceptor active/inactive, online/offline status
- **Real-time Counters** - Track successful, retried, failed, and active requests
- **Performance Metrics** - Monitor response times and success rates

### 🧪 **Test Scenarios**

#### **Individual Library Tests**
```javascript
// Test each HTTP library separately
🎯 Fetch API Tests
🔗 Axios Tests  
⚡ XMLHttpRequest Tests
```

#### **Comprehensive Test Suite**
```javascript
// Automated test sequence that demonstrates:
✅ Successful requests (jsonplaceholder.typicode.com)
❌ Server errors (httpstat.us/500, /503, /502)
🐌 Slow responses and timeouts
🔄 Rate limiting scenarios (429 errors)
```

#### **Error Scenario Testing**
```javascript
// Dedicated error tests to show retry logic
💥 500 Internal Server Error
🚫 503 Service Unavailable  
🌐 502 Bad Gateway
⏱️ 429 Rate Limited
```

### 📡 **Network Simulation**
- **Go Offline** - Simulate network disconnection
- **Go Online** - Restore network connectivity
- **Offline Test Scenario** - Automated offline/online test sequence

### 📋 **Request History**
- **Visual Request Cards** - Each request shows type, status, duration, URL
- **Color-coded Status** - Success (green), retry (orange), failed (red)
- **Performance Tracking** - Response times and HTTP status codes
- **Request Correlation** - Follow individual requests through their lifecycle

### 📝 **Live Activity Log**
- **Real-time Updates** - See interceptor activity as it happens
- **Detailed Logging** - Request IDs, retry attempts, and status changes
- **Color-coded Messages** - Success, warning, error, and info categories
- **Auto-scroll** - Always shows the latest activity

---

## 🎨 User Interface Features

### 🎭 **Modern Design**
- **Glassmorphism Effects** - Frosted glass appearance with backdrop blur
- **Smooth Animations** - Hover effects, transitions, and micro-interactions
- **Responsive Layout** - Works perfectly on desktop, tablet, and mobile
- **Professional Styling** - Clean, modern aesthetic

### 🔔 **Interactive Feedback**
- **Toast Notifications** - Real-time feedback for all operations
- **Status Badges** - Visual indicators in the header
- **Loading States** - Clear feedback during operations
- **Error Handling** - Graceful error presentation

### 📱 **Responsive Design**
```css
/* Mobile-first approach */
@media (max-width: 768px) {
  /* Optimized for mobile devices */
}

/* Tablet optimization */
@media (min-width: 769px) and (max-width: 1024px) {
  /* Tablet-specific layouts */
}

/* Desktop experience */
@media (min-width: 1025px) {
  /* Full desktop features */
}
```

---

## 🔧 Technical Implementation

### 🏗️ **Architecture**

```javascript
// App component structure
App.js
├── Configuration Panel      // Real-time settings
├── Status Dashboard        // Live monitoring
├── Test Sections          // Interactive test buttons
├── Network Simulation     // Offline/online controls
├── Request History        // Visual request tracking
└── Activity Log          // Live interceptor activity
```

### 📦 **Key Dependencies**

```json
{
  "dependencies": {
    "react": "^18.2.0",
    "axios": "^1.6.0",
    "react-hot-toast": "^2.4.1",
    "universal-api-retry-interceptor": "^1.0.0"
  }
}
```

### 🎯 **Core Features Implementation**

#### **Interceptor Integration**
```javascript
// Start interceptor with React-friendly configuration
useEffect(() => {
  startGlobalInterceptor({
    delayTime: config.delayTime,
    retryInterval: config.retryInterval,
    maxRetries: config.maxRetries,
    enableLogging: true,
    onRetry: (error, retryCount, requestInfo) => {
      // Real-time UI updates
      addLog(`🔄 Retrying ${requestInfo.url} (attempt ${retryCount})`);
      updateTestResults('retried');
    },
    onMaxRetriesExceeded: (error, requestInfo) => {
      // Graceful failure handling
      addLog(`💥 Max retries exceeded for ${requestInfo.url}`);
      updateTestResults('failed');
    }
  });
}, [config]);
```

#### **Real-time State Management**
```javascript
// Comprehensive state tracking
const [interceptorActive, setInterceptorActive] = useState(false);
const [stats, setStats] = useState({
  isActive: false,
  isOnline: navigator.onLine,
  pendingRequests: 0
});
const [requestHistory, setRequestHistory] = useState([]);
const [testResults, setTestResults] = useState({
  successful: 0,
  failed: 0,
  retried: 0,
  total: 0
});
```

#### **HTTP Library Testing**
```javascript
// Test different HTTP libraries
const makeRequest = async (type, url, options, description) => {
  // Unified request handling for fetch, axios, XHR
  if (type === 'FETCH') {
    return await fetch(url, options);
  } else if (type === 'AXIOS') {
    return await axios({ url, ...options });
  }
  // XHR handling with modern Promise wrapper
};
```

---


### 🎯 **Demonstration Scenarios**

1. **🏃‍♂️ Success Path** - Normal API requests complete successfully
2. **🔄 Retry Logic** - Server errors trigger automatic retry attempts  
3. **📴 Offline Mode** - Network disconnection stores requests for later
4. **📶 Recovery** - Network restoration executes stored requests
5. **💥 Exhausted Retries** - Graceful failure after max attempts
6. **⚙️ Configuration** - Real-time setting adjustments

---

## 🛠️ Customization Guide

### 🎨 **Styling Customization**

```css
/* Update primary colors */
:root {
  --primary-gradient: linear-gradient(135deg, #667eea, #764ba2);
  --success-color: #48bb78;
  --error-color: #e53e3e;
  --warning-color: #ed8936;
}

/* Customize component themes */
.control-panel {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(15px);
  /* Your custom styles */
}
```

### ⚙️ **Functionality Extensions**

```javascript
// Add custom test scenarios
const customTestScenario = async () => {
  // Your custom API test logic
  await makeRequest('FETCH', '/api/custom-endpoint', {}, 'Custom Test');
};

// Extend interceptor configuration
const extendedConfig = {
  ...defaultConfig,
  customRetryCondition: (error, response) => {
    // Your custom retry logic
    return response?.status === 503;
  }
};
```

### 📊 **Additional Monitoring**

```javascript
// Add performance metrics
const [performanceMetrics, setPerformanceMetrics] = useState({
  averageResponseTime: 0,
  successRate: 0,
  totalRequests: 0
});

// Custom analytics integration
const trackRetryEvent = (url, attempt) => {
  analytics.track('API_Retry', { url, attempt });
};
```

---

## 🐛 Troubleshooting

### ❓ **Common Issues**

#### **Issue: Interceptor not starting**
```javascript
// Solution: Check console for errors
console.log('Interceptor status:', getGlobalInterceptor()?.getStatus());

// Ensure proper import
import { startGlobalInterceptor } from 'universal-api-retry-interceptor';
```

#### **Issue: Toast notifications not showing**
```javascript
// Solution: Ensure Toaster component is included
<Toaster position="top-right" />

// Check react-hot-toast installation
npm install react-hot-toast
```

#### **Issue: Network simulation not working**
```javascript
// Solution: Use Chrome DevTools for real offline testing
// DevTools → Network → Offline checkbox
```

#### **Issue: Requests not being intercepted**
```javascript
// Solution: Verify HTTP library compatibility
// The interceptor works with fetch, axios, and XMLHttpRequest
// Some custom HTTP libraries might not be supported
```

### 🔍 **Debug Mode**

```javascript
// Enable debug logging
startGlobalInterceptor({
  enableLogging: true,
  onRetry: (error, retryCount, requestInfo) => {
    console.log('Debug retry:', { error, retryCount, requestInfo });
  }
});
```

---

## 🤝 Contributing to the Demo

### 🎯 **Ways to Contribute**

1. **🐛 Report Issues** - Found a bug in the demo? Let us know!
2. **💡 Suggest Features** - Ideas for new demo scenarios?
3. **🎨 Improve UI/UX** - Make the demo even more beautiful
4. **📖 Enhance Documentation** - Help others understand the demo
5. **🧪 Add Test Scenarios** - New ways to showcase the interceptor

### 🔧 **Development Setup**

```bash
# Fork the repository
git clone https://github.com/YOUR-USERNAME/universal-api-retry-interceptor.git
cd universal-api-retry-interceptor/example-react-app

# Create feature branch  
git checkout -b feature/awesome-demo-feature

# Install dependencies
npm install

# Start development server
npm start

# Make your changes and test

# Commit and push
git add .
git commit -m "Add awesome demo feature"
git push origin feature/awesome-demo-feature

# Create pull request
```

### 📋 **Contribution Guidelines**

- ✅ **Follow the existing code style**
- ✅ **Test your changes thoroughly**
- ✅ **Update documentation if needed**
- ✅ **Keep the demo user-friendly**
- ✅ **Ensure responsive design**

---

## 📞 Support & Feedback

### 💬 **Get Help**
- 🐛 **Demo Issues**: [Create an issue](https://github.com/asuraking1n/universal-api-retry-interceptor/issues/new?template=demo-issue.md)
- 💡 **Feature Requests**: [Start a discussion](https://github.com/asuraking1n/universal-api-retry-interceptor/discussions)
- 📖 **Main Package Docs**: [README](https://github.com/asuraking1n/universal-api-retry-interceptor#readme)

### 🌟 **Show Your Support**
If this demo helped you understand the interceptor:
- ⭐ **Star the repository**
- 🐦 **Share on social media**
- 📝 **Write about your experience**
- 🗣️ **Tell other developers**

---

## 📜 License

MIT © [Nishant Kumar Tiwari](https://github.com/asuraking1n)

This demo is part of the Universal API Retry Interceptor project.

---

## 🔗 Related Links

- 📦 **[Main Package](https://github.com/asuraking1n/universal-api-retry-interceptor)** - The core interceptor library
- 📖 **[Full Documentation](https://github.com/asuraking1n/universal-api-retry-interceptor#readme)** - Comprehensive usage guide
- 🚀 **[NPM Package](https://www.npmjs.com/package/universal-api-retry-interceptor)** - Install in your projects
- 💼 **[LinkedIn](https://www.linkedin.com/in/nishant-kumar-tiwari-253a46196/)** - Connect with the creator
- 👨‍💻 **[GitHub Profile](https://github.com/asuraking1n)** - More projects

---

<div align="center">

**Experience the power of bulletproof network resilience** 🚀

*Made with ❤️ by [Nishant Kumar Tiwari](https://github.com/asuraking1n)*

[⬆ Back to Top](#-universal-api-retry-interceptor---react-demo)

</div>
