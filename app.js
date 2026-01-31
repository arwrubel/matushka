/**
 * Matushka - Browser-Based Russian Language Teaching Materials Collector
 *
 * This application provides a complete browser-based interface for discovering,
 * filtering, downloading, and citing Russian language teaching materials from
 * public media sources.
 *
 * @version 2.0.0
 * @license MIT
 */

// =============================================================================
// DEBUG CONFIGURATION
// =============================================================================

/**
 * Debug Configuration
 *
 * Set enabled to false in production to disable all debug logging.
 */
const DEBUG = {
    enabled: true,
    logLevel: 'verbose', // 'error', 'warn', 'info', 'verbose'
    showTimestamps: true,
    logToConsole: true,
    logToUI: true  // Show in on-page debug panel
};

// =============================================================================
// DEBUG LOGGER CLASS
// =============================================================================

/**
 * DebugLogger - Comprehensive debugging and logging utility
 *
 * Provides styled console output, API call logging, state tracking,
 * performance timing, and on-page debug panel support.
 */
const DebugLogger = {
    // Log levels priority
    levels: {
        error: 0,
        warn: 1,
        info: 2,
        verbose: 3
    },

    // Console style configurations
    styles: {
        api: 'color: #2196F3; font-weight: bold;',           // Blue for API calls
        error: 'color: #F44336; font-weight: bold;',         // Red for errors
        warn: 'color: #FF9800; font-weight: bold;',          // Orange for warnings
        state: 'color: #9C27B0; font-weight: bold;',         // Purple for state changes
        timing: 'color: #4CAF50; font-weight: bold;',        // Green for timing
        ui: 'color: #00BCD4; font-weight: bold;',            // Cyan for UI events
        network: 'color: #795548; font-weight: bold;',       // Brown for network
        init: 'color: #607D8B; font-weight: bold;',          // Gray for initialization
        default: 'color: #333; font-weight: normal;'         // Default style
    },

    // In-memory log storage for export
    logHistory: [],
    maxHistorySize: 1000,

    /**
     * Check if logging should occur based on level
     * @param {string} level - Log level to check
     * @returns {boolean} Whether to log
     */
    shouldLog(level) {
        if (!DEBUG.enabled) return false;
        const currentLevelPriority = this.levels[DEBUG.logLevel] || 3;
        const messageLevelPriority = this.levels[level] || 3;
        return messageLevelPriority <= currentLevelPriority;
    },

    /**
     * Format timestamp for log output
     * @returns {string} Formatted timestamp [HH:MM:SS.mmm]
     */
    getTimestamp() {
        if (!DEBUG.showTimestamps) return '';
        const now = new Date();
        const hours = now.getHours().toString().padStart(2, '0');
        const minutes = now.getMinutes().toString().padStart(2, '0');
        const seconds = now.getSeconds().toString().padStart(2, '0');
        const ms = now.getMilliseconds().toString().padStart(3, '0');
        return `[${hours}:${minutes}:${seconds}.${ms}]`;
    },

    /**
     * Store log entry in history
     * @param {string} category - Log category
     * @param {string} message - Log message
     * @param {*} data - Optional data
     */
    storeLog(category, message, data) {
        const entry = {
            timestamp: new Date().toISOString(),
            category,
            message,
            data: data ? JSON.stringify(data).substring(0, 500) : null
        };
        this.logHistory.push(entry);
        if (this.logHistory.length > this.maxHistorySize) {
            this.logHistory.shift();
        }
    },

    /**
     * Log to UI debug panel if enabled and panel exists
     * @param {string} category - Log category
     * @param {string} message - Log message
     * @param {string} colorClass - CSS class for color
     */
    logToUIPanel(category, message, colorClass) {
        if (!DEBUG.logToUI) return;

        const panel = document.getElementById('debugPanel');
        const logContainer = document.getElementById('debugLogContainer');
        if (!panel || !logContainer) return;

        const entry = document.createElement('div');
        entry.className = `debug-entry debug-${colorClass}`;
        entry.innerHTML = `<span class="debug-timestamp">${this.getTimestamp()}</span> <span class="debug-category">[${category}]</span> <span class="debug-message">${this.escapeHtml(message)}</span>`;

        logContainer.appendChild(entry);
        logContainer.scrollTop = logContainer.scrollHeight;
    },

    /**
     * Escape HTML for safe display
     * @param {string} text - Text to escape
     * @returns {string} Escaped text
     */
    escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    },

    /**
     * General logging method
     * @param {string} category - Log category (API, UI, STATE, etc.)
     * @param {string} message - Log message
     * @param {*} data - Optional data to log
     */
    log(category, message, data = null) {
        if (!this.shouldLog('info')) return;

        const timestamp = this.getTimestamp();
        const prefix = `${timestamp} [${category.toUpperCase()}]`;
        const style = this.styles[category.toLowerCase()] || this.styles.default;

        if (DEBUG.logToConsole) {
            if (data !== null) {
                console.log(`%c${prefix} ${message}`, style, data);
            } else {
                console.log(`%c${prefix} ${message}`, style);
            }
        }

        this.storeLog(category, message, data);
        this.logToUIPanel(category, message, category.toLowerCase());
    },

    /**
     * API call logging with detailed request/response info
     * @param {string} endpoint - API endpoint
     * @param {string} method - HTTP method
     * @param {Object} params - Request parameters
     * @param {Object} response - Response data (optional, for completion)
     */
    api(endpoint, method, params = null, response = null) {
        if (!this.shouldLog('info')) return;

        const timestamp = this.getTimestamp();
        const style = this.styles.api;

        if (DEBUG.logToConsole) {
            if (response === null) {
                // Request logging
                console.log(`%c${timestamp} [API] ${method} ${endpoint}`, style);
                if (params) {
                    console.log(`%c               Parameters:`, style, params);
                }
            } else {
                // Response logging
                const status = response.status || 'OK';
                const timing = response.timing ? ` (${response.timing})` : '';
                console.log(`%c${timestamp} [API] Response ${status}${timing}`, style);
                if (response.data) {
                    const dataPreview = typeof response.data === 'object'
                        ? JSON.stringify(response.data).substring(0, 200) + (JSON.stringify(response.data).length > 200 ? '...' : '')
                        : response.data;
                    console.log(`%c               Data: ${dataPreview}`, style);
                }
            }
        }

        const message = response === null
            ? `${method} ${endpoint}`
            : `Response ${response.status || 'OK'}`;
        this.storeLog('API', message, params || response);
        this.logToUIPanel('API', message, 'api');
    },

    /**
     * Error logging with stack traces
     * @param {string} context - Error context/location
     * @param {Error|string} error - Error object or message
     */
    error(context, error) {
        if (!this.shouldLog('error')) return;

        const timestamp = this.getTimestamp();
        const style = this.styles.error;
        const errorMessage = error instanceof Error ? error.message : error;
        const stack = error instanceof Error ? error.stack : null;

        if (DEBUG.logToConsole) {
            console.log(`%c${timestamp} [ERROR] ${context}`, style);
            console.log(`%c               Message: ${errorMessage}`, style);
            if (stack) {
                console.log(`%c               Stack:`, style);
                console.log(stack);
            }
        }

        this.storeLog('ERROR', `${context}: ${errorMessage}`, { stack });
        this.logToUIPanel('ERROR', `${context}: ${errorMessage}`, 'error');
    },

    /**
     * Warning logging
     * @param {string} context - Warning context
     * @param {string} message - Warning message
     */
    warn(context, message) {
        if (!this.shouldLog('warn')) return;

        const timestamp = this.getTimestamp();
        const style = this.styles.warn;

        if (DEBUG.logToConsole) {
            console.log(`%c${timestamp} [WARN] ${context}: ${message}`, style);
        }

        this.storeLog('WARN', `${context}: ${message}`, null);
        this.logToUIPanel('WARN', `${context}: ${message}`, 'warn');
    },

    /**
     * State change tracking
     * @param {string} stateName - Name of the state variable
     * @param {*} oldValue - Previous value
     * @param {*} newValue - New value
     */
    state(stateName, oldValue, newValue) {
        if (!this.shouldLog('verbose')) return;

        const timestamp = this.getTimestamp();
        const style = this.styles.state;

        const formatValue = (val) => {
            if (val === null || val === undefined) return 'null';
            if (Array.isArray(val)) return `[${val.length} items]`;
            if (val instanceof Set) return `Set(${val.size})`;
            if (val instanceof Map) return `Map(${val.size})`;
            if (typeof val === 'object') return JSON.stringify(val).substring(0, 100);
            return String(val);
        };

        const oldStr = formatValue(oldValue);
        const newStr = formatValue(newValue);

        if (DEBUG.logToConsole) {
            console.log(`%c${timestamp} [STATE] ${stateName}: ${oldStr} -> ${newStr}`, style);
        }

        this.storeLog('STATE', `${stateName}: ${oldStr} -> ${newStr}`, null);
        this.logToUIPanel('STATE', `${stateName}: ${oldStr} -> ${newStr}`, 'state');
    },

    /**
     * Performance timing
     * @param {string} label - Operation label
     * @param {number} startTime - Start timestamp from performance.now()
     * @returns {number} Elapsed time in ms
     */
    timing(label, startTime) {
        if (!this.shouldLog('info')) return 0;

        const elapsed = performance.now() - startTime;
        const timestamp = this.getTimestamp();
        const style = this.styles.timing;
        const formattedTime = elapsed < 1000
            ? `${elapsed.toFixed(2)}ms`
            : `${(elapsed / 1000).toFixed(3)}s`;

        if (DEBUG.logToConsole) {
            console.log(`%c${timestamp} [TIMING] ${label}: ${formattedTime}`, style);
        }

        this.storeLog('TIMING', `${label}: ${formattedTime}`, { elapsed });
        this.logToUIPanel('TIMING', `${label}: ${formattedTime}`, 'timing');

        return elapsed;
    },

    /**
     * Start a console group
     * @param {string} name - Group name
     */
    group(name) {
        if (!DEBUG.enabled || !DEBUG.logToConsole) return;
        console.group(`%c${this.getTimestamp()} [GROUP] ${name}`, this.styles.default);
    },

    /**
     * End a console group
     */
    groupEnd() {
        if (!DEBUG.enabled || !DEBUG.logToConsole) return;
        console.groupEnd();
    },

    /**
     * Log UI event
     * @param {string} eventType - Type of UI event (click, change, etc.)
     * @param {string} element - Element identifier
     * @param {*} value - Event value (optional)
     */
    ui(eventType, element, value = null) {
        if (!this.shouldLog('verbose')) return;

        const timestamp = this.getTimestamp();
        const style = this.styles.ui;
        const message = value !== null
            ? `${eventType} on ${element}: ${value}`
            : `${eventType} on ${element}`;

        if (DEBUG.logToConsole) {
            console.log(`%c${timestamp} [UI] ${message}`, style);
        }

        this.storeLog('UI', message, null);
        this.logToUIPanel('UI', message, 'ui');
    },

    /**
     * Log network status
     * @param {string} status - Network status type
     * @param {string} message - Status message
     * @param {Object} details - Additional details
     */
    network(status, message, details = null) {
        if (!this.shouldLog('warn')) return;

        const timestamp = this.getTimestamp();
        const style = this.styles.network;

        if (DEBUG.logToConsole) {
            console.log(`%c${timestamp} [NETWORK] ${status}: ${message}`, style);
            if (details) {
                console.log(`%c               Details:`, style, details);
            }
        }

        this.storeLog('NETWORK', `${status}: ${message}`, details);
        this.logToUIPanel('NETWORK', `${status}: ${message}`, 'network');
    },

    /**
     * Log initialization info
     * @param {string} component - Component being initialized
     * @param {Object} config - Configuration details
     */
    init(component, config = null) {
        if (!this.shouldLog('info')) return;

        const timestamp = this.getTimestamp();
        const style = this.styles.init;

        if (DEBUG.logToConsole) {
            console.log(`%c${timestamp} [INIT] ${component}`, style);
            if (config) {
                console.log(`%c               Config:`, style, config);
            }
        }

        this.storeLog('INIT', component, config);
        this.logToUIPanel('INIT', component, 'init');
    },

    /**
     * Export all logs as JSON
     * @returns {string} JSON string of all logs
     */
    exportLogs() {
        return JSON.stringify(this.logHistory, null, 2);
    },

    /**
     * Clear log history
     */
    clearLogs() {
        this.logHistory = [];
        const logContainer = document.getElementById('debugLogContainer');
        if (logContainer) {
            logContainer.innerHTML = '';
        }
        this.log('DEBUG', 'Logs cleared');
    },

    /**
     * Get browser/environment info
     * @returns {Object} Environment information
     */
    getEnvironmentInfo() {
        return {
            userAgent: navigator.userAgent,
            platform: navigator.platform,
            language: navigator.language,
            cookiesEnabled: navigator.cookieEnabled,
            onLine: navigator.onLine,
            screenWidth: window.screen.width,
            screenHeight: window.screen.height,
            viewportWidth: window.innerWidth,
            viewportHeight: window.innerHeight,
            timestamp: new Date().toISOString()
        };
    }
};

// =============================================================================
// DEBUG PANEL UI FUNCTIONS
// =============================================================================

/**
 * Initialize the debug panel in the DOM
 * Creates the panel if it doesn't exist
 */
function initializeDebugPanel() {
    if (!DEBUG.logToUI) return;

    // Check if panel already exists
    if (document.getElementById('debugPanel')) return;

    const panel = document.createElement('div');
    panel.id = 'debugPanel';
    panel.innerHTML = `
        <div class="debug-panel-header">
            <span class="debug-panel-title">Debug Console</span>
            <div class="debug-panel-controls">
                <select id="debugFilterCategory" title="Filter by category">
                    <option value="all">All Categories</option>
                    <option value="api">API</option>
                    <option value="error">Errors</option>
                    <option value="warn">Warnings</option>
                    <option value="state">State</option>
                    <option value="timing">Timing</option>
                    <option value="ui">UI</option>
                    <option value="network">Network</option>
                    <option value="init">Init</option>
                </select>
                <button id="debugClearBtn" title="Clear logs">Clear</button>
                <button id="debugExportBtn" title="Export logs">Export</button>
                <button id="debugToggleBtn" title="Minimize/Maximize">_</button>
            </div>
        </div>
        <div id="debugLogContainer" class="debug-log-container"></div>
    `;

    // Add styles
    const styles = document.createElement('style');
    styles.textContent = `
        #debugPanel {
            position: fixed;
            bottom: 0;
            right: 0;
            width: 500px;
            max-height: 300px;
            background: #1e1e1e;
            border: 1px solid #333;
            border-radius: 8px 0 0 0;
            font-family: 'Consolas', 'Monaco', monospace;
            font-size: 11px;
            z-index: 10000;
            box-shadow: -2px -2px 10px rgba(0,0,0,0.3);
        }
        #debugPanel.minimized {
            max-height: 30px;
            overflow: hidden;
        }
        #debugPanel.minimized .debug-log-container {
            display: none;
        }
        .debug-panel-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 6px 10px;
            background: #333;
            border-bottom: 1px solid #444;
            border-radius: 8px 0 0 0;
        }
        .debug-panel-title {
            color: #fff;
            font-weight: bold;
        }
        .debug-panel-controls {
            display: flex;
            gap: 5px;
        }
        .debug-panel-controls button,
        .debug-panel-controls select {
            padding: 2px 8px;
            font-size: 10px;
            background: #555;
            color: #fff;
            border: 1px solid #666;
            border-radius: 3px;
            cursor: pointer;
        }
        .debug-panel-controls button:hover,
        .debug-panel-controls select:hover {
            background: #666;
        }
        .debug-log-container {
            max-height: 260px;
            overflow-y: auto;
            padding: 5px;
        }
        .debug-entry {
            padding: 2px 5px;
            margin: 1px 0;
            border-radius: 2px;
            word-wrap: break-word;
        }
        .debug-timestamp {
            color: #888;
        }
        .debug-category {
            font-weight: bold;
        }
        .debug-message {
            color: #ccc;
        }
        .debug-api .debug-category { color: #2196F3; }
        .debug-error { background: rgba(244, 67, 54, 0.1); }
        .debug-error .debug-category { color: #F44336; }
        .debug-warn { background: rgba(255, 152, 0, 0.1); }
        .debug-warn .debug-category { color: #FF9800; }
        .debug-state .debug-category { color: #9C27B0; }
        .debug-timing .debug-category { color: #4CAF50; }
        .debug-ui .debug-category { color: #00BCD4; }
        .debug-network .debug-category { color: #795548; }
        .debug-init .debug-category { color: #607D8B; }
    `;
    document.head.appendChild(styles);
    document.body.appendChild(panel);

    // Add event listeners
    document.getElementById('debugClearBtn').addEventListener('click', () => {
        DebugLogger.clearLogs();
    });

    document.getElementById('debugExportBtn').addEventListener('click', () => {
        const logs = DebugLogger.exportLogs();
        const blob = new Blob([logs], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `matushka_debug_${new Date().toISOString().replace(/[:.]/g, '-')}.json`;
        link.click();
        URL.revokeObjectURL(url);
        DebugLogger.log('DEBUG', 'Logs exported');
    });

    document.getElementById('debugToggleBtn').addEventListener('click', () => {
        panel.classList.toggle('minimized');
        const btn = document.getElementById('debugToggleBtn');
        btn.textContent = panel.classList.contains('minimized') ? '+' : '_';
    });

    document.getElementById('debugFilterCategory').addEventListener('change', (e) => {
        const filter = e.target.value;
        const entries = document.querySelectorAll('.debug-entry');
        entries.forEach(entry => {
            if (filter === 'all') {
                entry.style.display = 'block';
            } else {
                entry.style.display = entry.classList.contains(`debug-${filter}`) ? 'block' : 'none';
            }
        });
    });
}

// =============================================================================
// ERROR BOUNDARY WRAPPER
// =============================================================================

/**
 * Wrap a function with error boundary for safe execution
 * @param {Function} fn - Function to wrap
 * @param {string} context - Context name for error logging
 * @returns {Function} Wrapped function with error handling
 */
function withErrorBoundary(fn, context) {
    return async function(...args) {
        try {
            return await fn.apply(this, args);
        } catch (error) {
            DebugLogger.error(context, error);
            showError(`An error occurred in ${context}. Please try again.`);
            throw error;
        }
    };
}

// =============================================================================
// CONFIGURATION
// =============================================================================

/**
 * Worker URL Configuration
 *
 * Change this URL to point to your deployed Cloudflare Worker.
 * Deploy the worker to your Cloudflare account and update this URL accordingly.
 *
 * Example: 'https://matushka-worker.your-subdomain.workers.dev'
 */
const WORKER_URL = 'https://matushka-api.arwrubel.workers.dev';

/**
 * API Configuration
 */
const API_CONFIG = {
    // Request timeout in milliseconds (30 seconds)
    TIMEOUT_MS: 30000,

    // Maximum concurrent scrape requests
    MAX_CONCURRENT_SCRAPES: 5,

    // Delay between batch requests to avoid rate limiting (ms)
    BATCH_DELAY_MS: 100,

    // API endpoints (relative to WORKER_URL)
    ENDPOINTS: {
        DISCOVER: '/api/discover',
        SCRAPE: '/api/scrape',
        PROXY: '/api/proxy'
    }
};

// =============================================================================
// STATE MANAGEMENT
// =============================================================================

/**
 * Application State
 *
 * Centralized state object containing all application data.
 * This makes state management predictable and debugging easier.
 */
const AppState = {
    // Current filter values from the form
    filters: {
        duration: {
            min_seconds: 30,
            max_seconds: 600
        },
        days_back: 7,
        categories: ['all'],
        sources: ['all'],
        max_items: 50
    },

    // Search results from the API (array of video metadata objects)
    searchResults: [],

    // Set of selected item IDs for download
    selectedItems: new Set(),

    // Map of downloaded items with their full metadata
    // Key: item ID, Value: metadata object
    downloadedItems: new Map(),

    // Array of citation objects for downloaded items
    citations: [],

    // Loading state
    isLoading: false,

    // Current download progress
    downloadProgress: {
        current: 0,
        total: 0,
        inProgress: false
    }
};

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

/**
 * Format duration in seconds to human-readable format
 *
 * @param {number} seconds - Duration in seconds
 * @returns {string} Formatted duration string (e.g., "2:30", "1:05:30")
 *
 * @example
 * formatDuration(150) // Returns "2:30"
 * formatDuration(3930) // Returns "1:05:30"
 */
function formatDuration(seconds) {
    if (seconds === null || seconds === undefined || isNaN(seconds)) {
        return '--:--';
    }

    const totalSeconds = Math.floor(seconds);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;

    // Pad seconds with leading zero
    const paddedSecs = secs.toString().padStart(2, '0');

    if (hours > 0) {
        // Format: H:MM:SS
        const paddedMins = minutes.toString().padStart(2, '0');
        return `${hours}:${paddedMins}:${paddedSecs}`;
    } else {
        // Format: M:SS
        return `${minutes}:${paddedSecs}`;
    }
}

/**
 * Format ISO date string to human-readable format
 *
 * @param {string} isoString - ISO 8601 date string
 * @returns {string} Formatted date string
 *
 * @example
 * formatDate('2024-01-15T10:30:00Z') // Returns "January 15, 2024"
 */
function formatDate(isoString) {
    if (!isoString) {
        return 'Unknown date';
    }

    try {
        const date = new Date(isoString);

        // Check for invalid date
        if (isNaN(date.getTime())) {
            return 'Unknown date';
        }

        const options = {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        };

        return date.toLocaleDateString('en-US', options);
    } catch (error) {
        return 'Unknown date';
    }
}

/**
 * Format date for citations (Month Day, Year format)
 *
 * @param {string|Date} dateInput - Date to format
 * @returns {string} Formatted date for citations
 */
function formatCitationDate(dateInput) {
    if (!dateInput) {
        return 'n.d.';
    }

    try {
        const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;

        if (isNaN(date.getTime())) {
            return 'n.d.';
        }

        const options = {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        };

        return date.toLocaleDateString('en-US', options);
    } catch (error) {
        return 'n.d.';
    }
}

/**
 * Get year from date for APA citations
 *
 * @param {string|Date} dateInput - Date to extract year from
 * @returns {string} Year or 'n.d.'
 */
function getYear(dateInput) {
    if (!dateInput) {
        return 'n.d.';
    }

    try {
        const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;

        if (isNaN(date.getTime())) {
            return 'n.d.';
        }

        return date.getFullYear().toString();
    } catch (error) {
        return 'n.d.';
    }
}

/**
 * Sanitize a string to create a safe filename
 *
 * Removes or replaces characters that are invalid in filenames across
 * different operating systems.
 *
 * @param {string} title - Original title string
 * @returns {string} Sanitized filename-safe string
 *
 * @example
 * sanitizeFilename('News: Special Report 10/15') // Returns "News_Special_Report_10-15"
 */
function sanitizeFilename(title) {
    if (!title || typeof title !== 'string') {
        return 'untitled';
    }

    return title
        // Replace slashes with dashes
        .replace(/[\/\\]/g, '-')
        // Replace colons with dashes
        .replace(/:/g, '-')
        // Remove characters invalid in Windows filenames
        .replace(/[<>"|?*]/g, '')
        // Replace multiple spaces with single underscore
        .replace(/\s+/g, '_')
        // Remove leading/trailing underscores and dashes
        .replace(/^[-_]+|[-_]+$/g, '')
        // Limit length to 200 characters
        .substring(0, 200)
        // Provide fallback if empty
        || 'untitled';
}

/**
 * Generate a unique citation ID from metadata
 *
 * Creates a deterministic ID based on the item's metadata for consistent
 * referencing in citations.
 *
 * @param {Object} metadata - Item metadata object
 * @returns {string} Unique citation identifier
 *
 * @example
 * generateCitationId({publisher: '1tv', title: 'News', publish_date: '2024-01-15'})
 * // Returns "1tv_news_2024"
 */
function generateCitationId(metadata) {
    const parts = [];

    // Add publisher shorthand
    if (metadata.publisher) {
        const publisherKey = metadata.publisher
            .toLowerCase()
            .replace(/[^a-z0-9]/g, '')
            .substring(0, 10);
        parts.push(publisherKey);
    }

    // Add first word of title
    if (metadata.title) {
        const titleKey = metadata.title
            .toLowerCase()
            .split(/\s+/)[0]
            .replace(/[^a-z0-9]/g, '')
            .substring(0, 15);
        parts.push(titleKey);
    }

    // Add year
    if (metadata.publish_date) {
        const year = getYear(metadata.publish_date);
        if (year !== 'n.d.') {
            parts.push(year);
        }
    }

    // Add random suffix for uniqueness
    const randomSuffix = Math.random().toString(36).substring(2, 6);
    parts.push(randomSuffix);

    return parts.join('_') || `item_${Date.now()}`;
}

/**
 * Display an error message to the user
 *
 * @param {string} message - Error message to display
 */
function showError(message) {
    DebugLogger.log('UI', `Showing error message: ${message}`);

    const container = document.getElementById('errorMessages');
    if (!container) {
        DebugLogger.warn('showError', 'Error container not found in DOM');
        console.error('Error:', message);
        return;
    }

    // Clear previous messages
    container.innerHTML = '';

    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-message';
    errorDiv.textContent = message;
    container.appendChild(errorDiv);

    // Scroll error into view
    container.scrollIntoView({ behavior: 'smooth', block: 'nearest' });

    // Auto-clear after 10 seconds
    setTimeout(() => {
        if (container.contains(errorDiv)) {
            errorDiv.remove();
        }
    }, 10000);
}

/**
 * Display a success message to the user
 *
 * @param {string} message - Success message to display
 */
function showSuccess(message) {
    DebugLogger.log('UI', `Showing success message: ${message}`);

    const container = document.getElementById('errorMessages');
    if (!container) {
        DebugLogger.warn('showSuccess', 'Error container not found in DOM');
        console.log('Success:', message);
        return;
    }

    // Clear previous messages
    container.innerHTML = '';

    const successDiv = document.createElement('div');
    successDiv.className = 'success-message';
    successDiv.textContent = message;
    container.appendChild(successDiv);

    // Auto-clear after 5 seconds
    setTimeout(() => {
        if (container.contains(successDiv)) {
            successDiv.remove();
        }
    }, 5000);
}

/**
 * Clear all messages from the message container
 */
function clearMessages() {
    const container = document.getElementById('errorMessages');
    if (container) {
        container.innerHTML = '';
    }
}

/**
 * Show the loading spinner and disable interactive elements
 */
function showLoading() {
    DebugLogger.log('UI', 'Showing loading spinner');
    AppState.isLoading = true;

    // Show loading spinner
    const spinner = document.getElementById('loadingSpinner');
    if (spinner) {
        spinner.style.display = 'flex';
    }

    // Hide results section during loading
    const resultsSection = document.getElementById('resultsSection');
    if (resultsSection) {
        resultsSection.style.display = 'none';
    }

    // Disable search button
    const searchBtn = document.getElementById('searchBtn');
    if (searchBtn) {
        searchBtn.disabled = true;
        searchBtn.textContent = 'Searching...';
    }
}

/**
 * Hide the loading spinner and re-enable interactive elements
 */
function hideLoading() {
    DebugLogger.log('UI', 'Hiding loading spinner');
    AppState.isLoading = false;

    // Hide loading spinner
    const spinner = document.getElementById('loadingSpinner');
    if (spinner) {
        spinner.style.display = 'none';
    }

    // Re-enable search button
    const searchBtn = document.getElementById('searchBtn');
    if (searchBtn) {
        searchBtn.disabled = false;
        searchBtn.textContent = 'Search';
    }
}

/**
 * Update loading progress text
 *
 * @param {string} message - Progress message to display
 */
function updateLoadingProgress(message) {
    const progressText = document.getElementById('loadingProgress');
    if (progressText) {
        progressText.textContent = message;
    }
}

/**
 * Create a timeout promise for fetch requests
 *
 * @param {number} ms - Timeout in milliseconds
 * @returns {Promise} Promise that rejects after timeout
 */
function createTimeout(ms) {
    return new Promise((_, reject) => {
        setTimeout(() => {
            reject(new Error(`Request timed out after ${ms}ms`));
        }, ms);
    });
}

/**
 * Fetch with timeout wrapper
 *
 * @param {string} url - URL to fetch
 * @param {Object} options - Fetch options
 * @param {number} timeout - Timeout in milliseconds
 * @returns {Promise<Response>} Fetch response
 */
async function fetchWithTimeout(url, options = {}, timeout = API_CONFIG.TIMEOUT_MS) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);
    const startTime = performance.now();

    DebugLogger.api(url, options.method || 'GET', options.body ? JSON.parse(options.body) : null);

    try {
        const response = await fetch(url, {
            ...options,
            signal: controller.signal
        });
        clearTimeout(timeoutId);

        const elapsed = performance.now() - startTime;
        const timingStr = elapsed < 1000 ? `${elapsed.toFixed(0)}ms` : `${(elapsed / 1000).toFixed(3)}s`;

        DebugLogger.api(url, options.method || 'GET', null, {
            status: response.status,
            timing: timingStr,
            ok: response.ok
        });

        return response;
    } catch (error) {
        clearTimeout(timeoutId);
        const elapsed = performance.now() - startTime;

        if (error.name === 'AbortError') {
            DebugLogger.network('TIMEOUT', `Request timed out after ${timeout}ms`, { url, elapsed });
            throw new Error(`Request timed out after ${timeout}ms`);
        }

        DebugLogger.network('ERROR', error.message, { url, elapsed, error: error.name });
        throw error;
    }
}

/**
 * Delay execution for a specified time
 *
 * @param {number} ms - Milliseconds to delay
 * @returns {Promise} Promise that resolves after delay
 */
function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// =============================================================================
// API FUNCTIONS
// =============================================================================

/**
 * Discover content URLs from sources based on filters
 *
 * Calls the worker's /api/discover endpoint to get a list of content URLs
 * that match the specified filters.
 *
 * @param {Object} filters - Filter parameters
 * @returns {Promise<Array>} Array of discovered URLs
 */
async function discoverContent(filters) {
    const url = `${WORKER_URL}${API_CONFIG.ENDPOINTS.DISCOVER}`;
    const startTime = performance.now();

    DebugLogger.group('Content Discovery');
    DebugLogger.log('API', `Starting content discovery`, filters);

    try {
        const response = await fetchWithTimeout(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(filters)
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            DebugLogger.error('discoverContent', `API returned ${response.status}: ${errorData.error || 'Unknown error'}`);
            throw new Error(errorData.error || `API error: ${response.status}`);
        }

        const data = await response.json();
        const urls = data.urls || [];

        DebugLogger.timing('Content discovery', startTime);
        DebugLogger.log('API', `Found ${urls.length} URLs`);
        DebugLogger.groupEnd();

        return urls;
    } catch (error) {
        DebugLogger.groupEnd();

        if (error.message.includes('timed out')) {
            DebugLogger.network('TIMEOUT', 'Discovery request timed out', { url, filters });
            throw new Error('Discovery request timed out. Please try again or reduce your search scope.');
        }
        if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
            DebugLogger.network('UNREACHABLE', 'Worker unreachable or CORS issue', { url, error: error.message });
            throw new Error('Network error. Please check your connection and ensure the worker URL is correct.');
        }
        throw error;
    }
}

/**
 * Scrape metadata for a single URL
 *
 * Calls the worker's /api/scrape endpoint to get full metadata for a content URL.
 *
 * @param {string} contentUrl - URL of the content to scrape
 * @returns {Promise<Object>} Metadata object for the content
 */
async function scrapeMetadata(contentUrl) {
    const url = `${WORKER_URL}${API_CONFIG.ENDPOINTS.SCRAPE}`;
    const startTime = performance.now();

    try {
        const response = await fetchWithTimeout(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ url: contentUrl })
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            DebugLogger.error('scrapeMetadata', `Scrape failed for ${contentUrl}: ${response.status}`);
            throw new Error(errorData.error || `Scrape error: ${response.status}`);
        }

        const data = await response.json();
        DebugLogger.log('API', `Scraped: ${data.title || contentUrl}`, { duration: data.duration_seconds });
        return data;
    } catch (error) {
        // Return partial data on error to allow graceful degradation
        DebugLogger.warn('scrapeMetadata', `Failed to scrape ${contentUrl}: ${error.message}`);
        return {
            source_url: contentUrl,
            error: error.message,
            metadata_complete: false
        };
    }
}

/**
 * Scrape metadata for multiple URLs with concurrency control
 *
 * @param {Array<string>} urls - Array of URLs to scrape
 * @param {Function} onProgress - Progress callback (current, total)
 * @returns {Promise<Array>} Array of metadata objects
 */
async function scrapeMultipleUrls(urls, onProgress) {
    const results = [];
    const maxConcurrent = API_CONFIG.MAX_CONCURRENT_SCRAPES;
    const startTime = performance.now();

    DebugLogger.group('Batch Scraping');
    DebugLogger.log('API', `Starting batch scrape of ${urls.length} URLs`, { maxConcurrent });

    // Process URLs in batches
    for (let i = 0; i < urls.length; i += maxConcurrent) {
        const batch = urls.slice(i, i + maxConcurrent);
        const batchNum = Math.floor(i / maxConcurrent) + 1;
        const totalBatches = Math.ceil(urls.length / maxConcurrent);

        DebugLogger.log('API', `Processing batch ${batchNum}/${totalBatches}`);

        // Scrape batch concurrently
        const batchPromises = batch.map(url => scrapeMetadata(url));
        const batchResults = await Promise.all(batchPromises);

        results.push(...batchResults);

        // Report progress
        if (onProgress) {
            onProgress(results.length, urls.length);
        }

        // Small delay between batches to avoid overwhelming the worker
        if (i + maxConcurrent < urls.length) {
            await delay(API_CONFIG.BATCH_DELAY_MS);
        }
    }

    const successCount = results.filter(r => !r.error).length;
    const errorCount = results.filter(r => r.error).length;

    DebugLogger.timing('Batch scraping complete', startTime);
    DebugLogger.log('API', `Batch complete: ${successCount} success, ${errorCount} errors`);
    DebugLogger.groupEnd();

    return results;
}

/**
 * Get proxy URL for downloading content
 *
 * Constructs the proxy URL that will stream content through the worker.
 *
 * @param {string} contentUrl - Original content URL
 * @returns {string} Proxy URL for download
 */
function getProxyUrl(contentUrl) {
    const encodedUrl = encodeURIComponent(contentUrl);
    return `${WORKER_URL}${API_CONFIG.ENDPOINTS.PROXY}?url=${encodedUrl}`;
}

// =============================================================================
// FILTER FUNCTIONS
// =============================================================================

/**
 * Collect filter values from the form
 *
 * Reads all form inputs and returns a structured filter object.
 *
 * @returns {Object} Filter object for API calls
 */
function collectFilters() {
    const oldFilters = { ...AppState.filters };

    const filters = {
        duration: {
            min_seconds: parseInt(document.getElementById('minDuration')?.value) || 30,
            max_seconds: parseInt(document.getElementById('maxDuration')?.value) || 600
        },
        days_back: parseInt(document.getElementById('daysBack')?.value) || 7,
        categories: getSelectedCategories(),
        sources: getSelectedSources(),
        max_items: parseInt(document.getElementById('maxItems')?.value) || 50
    };

    // Update state and log changes
    DebugLogger.state('AppState.filters', oldFilters, filters);
    AppState.filters = filters;

    DebugLogger.log('FILTERS', 'Filters collected', filters);

    return filters;
}

/**
 * Get selected categories from checkboxes
 *
 * @returns {Array<string>} Array of selected category values
 */
function getSelectedCategories() {
    const allCategoriesCheckbox = document.getElementById('allCategories');

    if (allCategoriesCheckbox?.checked) {
        return ['all'];
    }

    const categoryCheckboxes = document.querySelectorAll('input[name="categories"]:checked');
    const categories = Array.from(categoryCheckboxes).map(cb => cb.value);

    return categories.length > 0 ? categories : ['all'];
}

/**
 * Get selected sources from checkboxes
 *
 * @returns {Array<string>} Array of selected source values
 */
function getSelectedSources() {
    const allSourcesCheckbox = document.getElementById('allSources');

    if (allSourcesCheckbox?.checked) {
        return ['all'];
    }

    const sourceCheckboxes = document.querySelectorAll('input[name="sources"]:checked');
    const sources = Array.from(sourceCheckboxes).map(cb => cb.value);

    return sources.length > 0 ? sources : ['all'];
}

/**
 * Apply client-side duration filtering
 *
 * Filters results based on duration estimates when actual duration is available.
 *
 * @param {Array} results - Array of metadata objects
 * @param {number} minSeconds - Minimum duration in seconds
 * @param {number} maxSeconds - Maximum duration in seconds
 * @returns {Array} Filtered results
 */
function filterByDuration(results, minSeconds, maxSeconds) {
    return results.filter(item => {
        // If no duration available, include the item (benefit of the doubt)
        if (!item.duration_seconds && item.duration_seconds !== 0) {
            return true;
        }

        const duration = item.duration_seconds;
        return duration >= minSeconds && duration <= maxSeconds;
    });
}

/**
 * Apply client-side category filtering
 *
 * @param {Array} results - Array of metadata objects
 * @param {Array<string>} categories - Array of allowed categories
 * @returns {Array} Filtered results
 */
function filterByCategory(results, categories) {
    // If 'all' is selected, return all results
    if (categories.includes('all')) {
        return results;
    }

    return results.filter(item => {
        // If no category, include the item
        if (!item.category) {
            return true;
        }

        return categories.includes(item.category.toLowerCase());
    });
}

/**
 * Validate filter values
 *
 * @param {Object} filters - Filter object to validate
 * @returns {Array<string>} Array of error messages (empty if valid)
 */
function validateFilters(filters) {
    const errors = [];

    // Validate duration
    if (filters.duration.min_seconds < 0) {
        errors.push('Minimum duration cannot be negative');
    }

    if (filters.duration.max_seconds < 0) {
        errors.push('Maximum duration cannot be negative');
    }

    if (filters.duration.min_seconds >= filters.duration.max_seconds) {
        errors.push('Minimum duration must be less than maximum duration');
    }

    if (filters.duration.max_seconds > 3600) {
        errors.push('Maximum duration cannot exceed 3600 seconds (1 hour)');
    }

    // Validate days back
    if (filters.days_back < 1) {
        errors.push('Days back must be at least 1');
    }

    if (filters.days_back > 365) {
        errors.push('Days back cannot exceed 365');
    }

    // Validate max items
    if (filters.max_items < 1) {
        errors.push('Maximum items must be at least 1');
    }

    if (filters.max_items > 500) {
        errors.push('Maximum items cannot exceed 500');
    }

    return errors;
}

// =============================================================================
// SEARCH FLOW
// =============================================================================

/**
 * Execute the full search flow
 *
 * This is the main search function that:
 * 1. Collects filter values
 * 2. Validates filters
 * 3. Discovers content URLs
 * 4. Scrapes metadata for each URL
 * 5. Applies client-side filtering
 * 6. Displays results
 */
async function executeSearch() {
    const searchStartTime = performance.now();

    DebugLogger.group('Search Execution');
    DebugLogger.log('SEARCH', 'Starting search execution');

    // Prevent multiple concurrent searches
    if (AppState.isLoading) {
        DebugLogger.warn('executeSearch', 'Search already in progress, ignoring request');
        DebugLogger.groupEnd();
        return;
    }

    clearMessages();

    // Collect and validate filters
    const filters = collectFilters();
    const validationErrors = validateFilters(filters);

    if (validationErrors.length > 0) {
        DebugLogger.error('executeSearch', `Validation failed: ${validationErrors.join(', ')}`);
        validationErrors.forEach(error => showError(error));
        DebugLogger.groupEnd();
        return;
    }

    // Check worker URL configuration
    if (WORKER_URL.includes('YOUR_SUBDOMAIN')) {
        DebugLogger.error('executeSearch', 'Worker URL not configured');
        showError('Please configure the WORKER_URL in app.js with your deployed Cloudflare Worker URL.');
        DebugLogger.groupEnd();
        return;
    }

    // Show loading state
    showLoading();
    DebugLogger.state('AppState.isLoading', false, true);

    try {
        // Step 1: Discover content URLs
        DebugLogger.log('SEARCH', 'Step 1: Discovering content URLs');
        updateLoadingProgress('Discovering content...');
        const discoveredUrls = await discoverContent(filters);

        if (discoveredUrls.length === 0) {
            DebugLogger.log('SEARCH', 'No content found matching filters');
            hideLoading();
            showSuccess('No content found matching your filters. Try adjusting your search criteria.');
            displayResults([]);
            DebugLogger.groupEnd();
            return;
        }

        DebugLogger.log('SEARCH', `Step 2: Scraping metadata for ${discoveredUrls.length} URLs`);
        updateLoadingProgress(`Found ${discoveredUrls.length} items. Fetching metadata...`);

        // Step 2: Scrape metadata for each URL
        const allMetadata = await scrapeMultipleUrls(discoveredUrls, (current, total) => {
            updateLoadingProgress(`Fetching metadata: ${current}/${total}`);
        });

        // Step 3: Filter out items with errors
        DebugLogger.log('SEARCH', 'Step 3: Filtering out error items');
        const validMetadata = allMetadata.filter(item => !item.error);
        DebugLogger.log('SEARCH', `Valid metadata: ${validMetadata.length}/${allMetadata.length}`);

        // Step 4: Apply client-side duration filtering
        DebugLogger.log('SEARCH', 'Step 4: Applying duration filter');
        let filteredResults = filterByDuration(
            validMetadata,
            filters.duration.min_seconds,
            filters.duration.max_seconds
        );
        DebugLogger.log('SEARCH', `After duration filter: ${filteredResults.length} items`);

        // Step 5: Apply category filtering
        DebugLogger.log('SEARCH', 'Step 5: Applying category filter');
        filteredResults = filterByCategory(filteredResults, filters.categories);
        DebugLogger.log('SEARCH', `After category filter: ${filteredResults.length} items`);

        // Step 6: Limit to max_items
        DebugLogger.log('SEARCH', `Step 6: Limiting to max ${filters.max_items} items`);
        filteredResults = filteredResults.slice(0, filters.max_items);

        // Update state
        const oldResults = AppState.searchResults;
        AppState.searchResults = filteredResults;
        DebugLogger.state('AppState.searchResults', oldResults, filteredResults);

        const oldSelected = AppState.selectedItems.size;
        AppState.selectedItems.clear();
        DebugLogger.state('AppState.selectedItems', `Set(${oldSelected})`, 'Set(0)');

        // Display results
        hideLoading();
        displayResults(filteredResults);

        DebugLogger.timing('Total search time', searchStartTime);

        if (filteredResults.length > 0) {
            showSuccess(`Found ${filteredResults.length} items matching your criteria.`);
            DebugLogger.log('SEARCH', `Search complete: ${filteredResults.length} results`);
        } else {
            showSuccess('No items matched your duration or category filters after metadata check.');
            DebugLogger.log('SEARCH', 'Search complete: no results after filtering');
        }

    } catch (error) {
        hideLoading();
        DebugLogger.error('executeSearch', error);
        showError(error.message || 'An error occurred during search. Please try again.');
    }

    DebugLogger.groupEnd();
}

// =============================================================================
// RESULTS DISPLAY
// =============================================================================

/**
 * Display search results in the results grid
 *
 * @param {Array} results - Array of metadata objects to display
 */
function displayResults(results) {
    const renderStartTime = performance.now();
    DebugLogger.log('UI', `Rendering ${results.length} result cards...`);

    const resultsSection = document.getElementById('resultsSection');
    const resultsGrid = document.getElementById('resultsGrid');
    const resultsCount = document.getElementById('resultsCount');

    if (!resultsSection || !resultsGrid) {
        DebugLogger.error('displayResults', 'Results container not found in DOM');
        return;
    }

    // Update count
    if (resultsCount) {
        resultsCount.textContent = `${results.length} item${results.length !== 1 ? 's' : ''} found`;
    }

    // Clear previous results
    resultsGrid.innerHTML = '';

    // Show results section
    resultsSection.style.display = 'block';

    if (results.length === 0) {
        resultsGrid.innerHTML = '<p class="no-results">No results to display. Try adjusting your filters.</p>';
        DebugLogger.log('UI', 'No results to display');
        return;
    }

    // Create result cards
    results.forEach((item, index) => {
        const card = createResultCard(item, index);
        resultsGrid.appendChild(card);
    });

    // Update selection UI
    updateSelectionUI();

    DebugLogger.timing('Render complete', renderStartTime);

    // Scroll to results
    resultsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    DebugLogger.log('UI', 'Scrolled to results section');
}

/**
 * Create a result card element for a single item
 *
 * @param {Object} item - Metadata object for the item
 * @param {number} index - Index of the item in results
 * @returns {HTMLElement} Card element
 */
function createResultCard(item, index) {
    const card = document.createElement('div');
    card.className = 'result-card';
    card.dataset.index = index;

    // Generate unique ID for the item if not present
    const itemId = item.id || `item_${index}_${Date.now()}`;
    item.id = itemId;

    // Thumbnail section
    const thumbnailHtml = item.thumbnail_url
        ? `<img src="${escapeHtml(item.thumbnail_url)}" alt="Thumbnail" class="result-thumbnail" loading="lazy" onerror="this.parentElement.innerHTML='<div class=\\'thumbnail-placeholder\\'>No Image</div>'">`
        : '<div class="thumbnail-placeholder">No Image</div>';

    // Build card HTML
    card.innerHTML = `
        <div class="card-checkbox">
            <input type="checkbox" id="select_${itemId}" data-item-id="${itemId}" class="item-checkbox">
            <label for="select_${itemId}" class="visually-hidden">Select item</label>
        </div>
        <div class="card-thumbnail">
            ${thumbnailHtml}
        </div>
        <div class="card-content">
            <h4 class="card-title" title="${escapeHtml(item.title || 'Untitled')}">${escapeHtml(item.title || 'Untitled')}</h4>
            <div class="card-meta">
                ${item.program_name ? `<span class="meta-program">${escapeHtml(item.program_name)}</span>` : ''}
                ${item.publisher ? `<span class="meta-publisher">${escapeHtml(item.publisher)}</span>` : ''}
            </div>
            <div class="card-details">
                <span class="detail-duration">${formatDuration(item.duration_seconds)}</span>
                <span class="detail-date">${formatDate(item.publish_date)}</span>
                ${item.category ? `<span class="detail-category">${escapeHtml(item.category)}</span>` : ''}
            </div>
            ${item.description ? `<p class="card-description" title="${escapeHtml(item.description)}">${escapeHtml(truncateText(item.description, 150))}</p>` : ''}
            <div class="card-source">
                <a href="${escapeHtml(item.source_url || '#')}" target="_blank" rel="noopener noreferrer" class="source-link">View Source</a>
            </div>
        </div>
    `;

    // Add checkbox event listener
    const checkbox = card.querySelector('.item-checkbox');
    checkbox.addEventListener('change', (e) => {
        handleItemSelection(itemId, e.target.checked);
    });

    return card;
}

/**
 * Escape HTML special characters to prevent XSS
 *
 * @param {string} text - Text to escape
 * @returns {string} Escaped text
 */
function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

/**
 * Truncate text to a specified length
 *
 * @param {string} text - Text to truncate
 * @param {number} maxLength - Maximum length
 * @returns {string} Truncated text with ellipsis if needed
 */
function truncateText(text, maxLength) {
    if (!text || text.length <= maxLength) {
        return text || '';
    }
    return text.substring(0, maxLength - 3) + '...';
}

/**
 * Handle individual item selection/deselection
 *
 * @param {string} itemId - ID of the item
 * @param {boolean} isSelected - Whether the item is selected
 */
function handleItemSelection(itemId, isSelected) {
    const oldSize = AppState.selectedItems.size;

    if (isSelected) {
        AppState.selectedItems.add(itemId);
        DebugLogger.ui('checkbox', `item ${itemId}`, 'selected');
    } else {
        AppState.selectedItems.delete(itemId);
        DebugLogger.ui('checkbox', `item ${itemId}`, 'deselected');
    }

    DebugLogger.state('AppState.selectedItems', `Set(${oldSize})`, `Set(${AppState.selectedItems.size})`);
    updateSelectionUI();
}

/**
 * Update selection-related UI elements
 */
function updateSelectionUI() {
    const selectedCount = AppState.selectedItems.size;
    const totalCount = AppState.searchResults.length;

    // Update selected count display
    const selectedCountEl = document.getElementById('selectedCount');
    if (selectedCountEl) {
        selectedCountEl.textContent = `${selectedCount} selected`;
    }

    // Update download button state
    const downloadBtn = document.getElementById('downloadSelectedBtn');
    if (downloadBtn) {
        downloadBtn.disabled = selectedCount === 0;
        downloadBtn.textContent = selectedCount > 0
            ? `Download Selected (${selectedCount})`
            : 'Download Selected';
    }

    // Update select all checkbox state
    const selectAllCheckbox = document.getElementById('selectAllCheckbox');
    if (selectAllCheckbox) {
        selectAllCheckbox.checked = selectedCount > 0 && selectedCount === totalCount;
        selectAllCheckbox.indeterminate = selectedCount > 0 && selectedCount < totalCount;
    }
}

/**
 * Select all items in the results
 */
function selectAllItems() {
    AppState.searchResults.forEach(item => {
        AppState.selectedItems.add(item.id);
    });

    // Update all checkboxes
    document.querySelectorAll('.item-checkbox').forEach(checkbox => {
        checkbox.checked = true;
    });

    updateSelectionUI();
}

/**
 * Deselect all items in the results
 */
function deselectAllItems() {
    AppState.selectedItems.clear();

    // Update all checkboxes
    document.querySelectorAll('.item-checkbox').forEach(checkbox => {
        checkbox.checked = false;
    });

    updateSelectionUI();
}

/**
 * Handle select all checkbox toggle
 *
 * @param {Event} event - Change event from checkbox
 */
function handleSelectAllToggle(event) {
    if (event.target.checked) {
        selectAllItems();
    } else {
        deselectAllItems();
    }
}

// =============================================================================
// DOWNLOAD FLOW
// =============================================================================

/**
 * Download selected items
 *
 * Initiates download for all selected items through the proxy.
 */
async function downloadSelectedItems() {
    const downloadStartTime = performance.now();

    DebugLogger.group('Download Selected Items');
    DebugLogger.log('DOWNLOAD', `Starting download of ${AppState.selectedItems.size} items`);

    if (AppState.selectedItems.size === 0) {
        DebugLogger.warn('downloadSelectedItems', 'No items selected');
        showError('No items selected for download.');
        DebugLogger.groupEnd();
        return;
    }

    if (AppState.downloadProgress.inProgress) {
        DebugLogger.warn('downloadSelectedItems', 'Download already in progress');
        showError('Download already in progress. Please wait.');
        DebugLogger.groupEnd();
        return;
    }

    // Get selected item metadata
    const selectedMetadata = AppState.searchResults.filter(item =>
        AppState.selectedItems.has(item.id)
    );

    if (selectedMetadata.length === 0) {
        DebugLogger.error('downloadSelectedItems', 'Could not find metadata for selected items');
        showError('Could not find metadata for selected items.');
        DebugLogger.groupEnd();
        return;
    }

    // Initialize progress
    AppState.downloadProgress = {
        current: 0,
        total: selectedMetadata.length,
        inProgress: true
    };
    DebugLogger.state('AppState.downloadProgress', null, AppState.downloadProgress);

    updateDownloadProgress();

    try {
        // Process downloads sequentially to avoid overwhelming the browser
        for (const item of selectedMetadata) {
            try {
                DebugLogger.log('DOWNLOAD', `Downloading: ${item.title}`);
                await downloadSingleItem(item);

                // Store downloaded item
                AppState.downloadedItems.set(item.id, item);
                DebugLogger.log('DOWNLOAD', `Download complete: ${item.title}`);

                // Generate citation
                const citation = generateCitationData(item);
                AppState.citations.push(citation);
                DebugLogger.log('CITATION', `Generated citation for: ${item.title}`);

                // Update progress
                AppState.downloadProgress.current++;
                updateDownloadProgress();

                // Small delay between downloads
                await delay(500);

            } catch (error) {
                DebugLogger.error('downloadSingleItem', `Failed to download ${item.title}: ${error.message}`);
                // Continue with next item
            }
        }

        // Update citations panel
        updateCitationsPanel();

        DebugLogger.timing('Total download time', downloadStartTime);
        DebugLogger.log('DOWNLOAD', `Completed: ${AppState.downloadProgress.current}/${AppState.downloadProgress.total}`);
        showSuccess(`Downloaded ${AppState.downloadProgress.current} of ${AppState.downloadProgress.total} items.`);

    } catch (error) {
        DebugLogger.error('downloadSelectedItems', error);
        showError('Download process failed: ' + error.message);
    } finally {
        AppState.downloadProgress.inProgress = false;
        updateDownloadProgress();
        DebugLogger.groupEnd();
    }
}

/**
 * Download a single item through the proxy
 *
 * @param {Object} item - Metadata object for the item
 */
async function downloadSingleItem(item) {
    if (!item.source_url) {
        DebugLogger.error('downloadSingleItem', 'No source URL available');
        throw new Error('No source URL available');
    }

    // Create download link
    const proxyUrl = getProxyUrl(item.source_url);
    const filename = sanitizeFilename(item.title || 'download') + (item.file_format ? `.${item.file_format}` : '.mp4');

    DebugLogger.log('DOWNLOAD', `Initiating download via proxy`, {
        originalUrl: item.source_url,
        proxyUrl: proxyUrl,
        filename: filename
    });

    // Create temporary anchor element for download
    const link = document.createElement('a');
    link.href = proxyUrl;
    link.download = filename;
    link.style.display = 'none';

    // Append, click, and remove
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    DebugLogger.log('DOWNLOAD', `Download triggered: ${filename}`);
}

/**
 * Update download progress UI
 */
function updateDownloadProgress() {
    const progressContainer = document.getElementById('downloadProgress');
    const progressBar = document.getElementById('downloadProgressBar');
    const progressText = document.getElementById('downloadProgressText');

    if (!progressContainer) return;

    const { current, total, inProgress } = AppState.downloadProgress;

    if (inProgress) {
        progressContainer.style.display = 'block';

        if (progressBar) {
            const percentage = total > 0 ? (current / total) * 100 : 0;
            progressBar.style.width = `${percentage}%`;
        }

        if (progressText) {
            progressText.textContent = `Downloading: ${current}/${total}`;
        }
    } else {
        progressContainer.style.display = 'none';
    }
}

// =============================================================================
// CITATION SYSTEM
// =============================================================================

/**
 * Generate citation data object for a downloaded item
 *
 * Creates a comprehensive citation object with all 19 required fields.
 *
 * @param {Object} metadata - Item metadata
 * @returns {Object} Citation data object
 */
function generateCitationData(metadata) {
    const now = new Date();

    DebugLogger.log('CITATION', `Generating citation data for: ${metadata.title || 'Untitled'}`);

    const citation = {
        // Core identification
        id: generateCitationId(metadata),
        source_url: metadata.source_url || '',

        // Title and program information
        title: metadata.title || 'Untitled',
        program_name: metadata.program_name || '',
        segment_title: metadata.segment_title || '',

        // Publisher and author
        publisher: metadata.publisher || 'Unknown Publisher',
        author: metadata.author || '',

        // Dates
        publish_date: metadata.publish_date || null,
        access_date: now.toISOString(),
        download_timestamp: now.toISOString(),

        // Technical metadata
        duration_seconds: metadata.duration_seconds || null,
        file_format: metadata.file_format || 'mp4',
        thumbnail_url: metadata.thumbnail_url || '',

        // Classification
        category: metadata.category || '',

        // Content description
        description: metadata.description || '',
        original_language: metadata.original_language || 'Russian',

        // Legal and usage
        license_reference: metadata.license_reference || 'Fair use for educational purposes',
        educational_use_note: metadata.educational_use_note || 'For Russian language teaching and learning',

        // Completeness flag
        metadata_complete: Boolean(
            metadata.title &&
            metadata.publisher &&
            metadata.source_url &&
            metadata.publish_date
        )
    };

    DebugLogger.log('CITATION', `Citation ID: ${citation.id}`, { complete: citation.metadata_complete });

    return citation;
}

/**
 * Format citation in Chicago style
 *
 * Format: Publisher. "Title." Program. source_domain, Date. URL. Accessed Date.
 *
 * @param {Object} citation - Citation data object
 * @returns {string} Formatted citation
 */
function formatChicagoCitation(citation) {
    const parts = [];

    // Publisher
    if (citation.publisher) {
        parts.push(citation.publisher + '.');
    }

    // Title in quotes
    parts.push(`"${citation.title}."`);

    // Program name (if different from title)
    if (citation.program_name && citation.program_name !== citation.title) {
        parts.push(citation.program_name + '.');
    }

    // Source domain
    if (citation.source_url) {
        try {
            const domain = new URL(citation.source_url).hostname;
            parts.push(domain + ',');
        } catch (e) {
            // Skip domain if URL is invalid
        }
    }

    // Publish date
    if (citation.publish_date) {
        parts.push(formatCitationDate(citation.publish_date) + '.');
    }

    // URL
    if (citation.source_url) {
        parts.push(citation.source_url + '.');
    }

    // Access date
    parts.push(`Accessed ${formatCitationDate(citation.access_date)}.`);

    return parts.join(' ');
}

/**
 * Format citation in MLA style
 *
 * Format: Author. "Title." Program, Publisher, Date, URL. Accessed Date.
 *
 * @param {Object} citation - Citation data object
 * @returns {string} Formatted citation
 */
function formatMLACitation(citation) {
    const parts = [];

    // Author (or publisher as corporate author)
    const author = citation.author || citation.publisher || 'Unknown';
    parts.push(author + '.');

    // Title in quotes
    parts.push(`"${citation.title}."`);

    // Program name (italicized conceptually, using asterisks for plain text)
    if (citation.program_name && citation.program_name !== citation.title) {
        parts.push(`*${citation.program_name}*,`);
    }

    // Publisher
    if (citation.publisher && citation.publisher !== author) {
        parts.push(citation.publisher + ',');
    }

    // Publish date
    if (citation.publish_date) {
        parts.push(formatCitationDate(citation.publish_date) + ',');
    }

    // URL
    if (citation.source_url) {
        parts.push(citation.source_url + '.');
    }

    // Access date
    parts.push(`Accessed ${formatCitationDate(citation.access_date)}.`);

    return parts.join(' ');
}

/**
 * Format citation in APA style
 *
 * Format: Author (Year). Title [Audio file]. Program. Publisher. URL
 *
 * @param {Object} citation - Citation data object
 * @returns {string} Formatted citation
 */
function formatAPACitation(citation) {
    const parts = [];

    // Author
    const author = citation.author || citation.publisher || 'Unknown';
    parts.push(author);

    // Year in parentheses
    const year = getYear(citation.publish_date);
    parts.push(`(${year}).`);

    // Title with format indicator
    const formatIndicator = citation.file_format === 'mp3' ? 'Audio file' : 'Video file';
    parts.push(`${citation.title} [${formatIndicator}].`);

    // Program name
    if (citation.program_name && citation.program_name !== citation.title) {
        parts.push(`*${citation.program_name}*.`);
    }

    // Publisher
    if (citation.publisher && citation.publisher !== author) {
        parts.push(citation.publisher + '.');
    }

    // URL
    if (citation.source_url) {
        parts.push(citation.source_url);
    }

    return parts.join(' ');
}

/**
 * Format citation in BibTeX format
 *
 * @param {Object} citation - Citation data object
 * @returns {string} BibTeX formatted citation
 */
function formatBibTeXCitation(citation) {
    const key = citation.id.replace(/[^a-zA-Z0-9_]/g, '_');
    const year = getYear(citation.publish_date);

    // Escape special BibTeX characters
    const escapeBibTeX = (str) => {
        if (!str) return '';
        return str
            .replace(/[&]/g, '\\&')
            .replace(/[%]/g, '\\%')
            .replace(/[#]/g, '\\#')
            .replace(/[_]/g, '\\_')
            .replace(/[{]/g, '\\{')
            .replace(/[}]/g, '\\}');
    };

    const lines = [
        `@misc{${key},`,
        `  author = {${escapeBibTeX(citation.author || citation.publisher || 'Unknown')}},`,
        `  title = {${escapeBibTeX(citation.title)}},`,
        `  year = {${year}},`,
        `  howpublished = {${escapeBibTeX(citation.program_name || 'Online video')}},`,
        `  organization = {${escapeBibTeX(citation.publisher)}},`,
        `  url = {${citation.source_url || ''}},`,
        `  urldate = {${citation.access_date ? citation.access_date.split('T')[0] : ''}},`,
        `  note = {${escapeBibTeX(citation.educational_use_note || '')}},`,
        `  language = {${escapeBibTeX(citation.original_language || 'Russian')}}`,
        `}`
    ];

    return lines.join('\n');
}

/**
 * Format citation as JSON
 *
 * @param {Object} citation - Citation data object
 * @returns {string} JSON formatted citation
 */
function formatJSONCitation(citation) {
    return JSON.stringify(citation, null, 2);
}

/**
 * Format all citations in a specific style
 *
 * @param {string} style - Citation style ('chicago', 'mla', 'apa', 'bibtex', 'json')
 * @returns {string} All citations formatted in the specified style
 */
function formatAllCitations(style) {
    if (AppState.citations.length === 0) {
        return 'No citations available.';
    }

    const formatters = {
        chicago: formatChicagoCitation,
        mla: formatMLACitation,
        apa: formatAPACitation,
        bibtex: formatBibTeXCitation,
        json: formatJSONCitation
    };

    const formatter = formatters[style.toLowerCase()];
    if (!formatter) {
        return 'Unknown citation style.';
    }

    // For BibTeX and JSON, join with blank lines
    const separator = (style === 'bibtex' || style === 'json') ? '\n\n' : '\n\n';

    return AppState.citations.map(citation => formatter(citation)).join(separator);
}

/**
 * Update the citations panel with current citations
 */
function updateCitationsPanel() {
    const citationsSection = document.getElementById('citationsSection');
    const citationsList = document.getElementById('citationsList');
    const citationCount = document.getElementById('citationCount');

    if (!citationsSection) return;

    // Show section if there are citations
    if (AppState.citations.length > 0) {
        citationsSection.style.display = 'block';

        if (citationCount) {
            citationCount.textContent = `${AppState.citations.length} citation${AppState.citations.length !== 1 ? 's' : ''}`;
        }

        // Update citations list with current format
        const currentFormat = document.getElementById('citationFormat')?.value || 'chicago';
        displayCitationsInFormat(currentFormat);

        // Scroll to citations
        citationsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } else {
        citationsSection.style.display = 'none';
    }
}

/**
 * Display citations in a specific format
 *
 * @param {string} format - Citation format to display
 */
function displayCitationsInFormat(format) {
    const citationsList = document.getElementById('citationsList');
    if (!citationsList) return;

    const formattedCitations = formatAllCitations(format);

    // Use pre-formatted text for BibTeX and JSON
    if (format === 'bibtex' || format === 'json') {
        citationsList.innerHTML = `<pre class="citations-code">${escapeHtml(formattedCitations)}</pre>`;
    } else {
        // For other formats, display as paragraphs
        const citationHtml = AppState.citations.map((citation, index) => {
            const formatters = {
                chicago: formatChicagoCitation,
                mla: formatMLACitation,
                apa: formatAPACitation
            };
            const formatted = formatters[format](citation);
            return `<p class="citation-entry">${index + 1}. ${escapeHtml(formatted)}</p>`;
        }).join('');

        citationsList.innerHTML = citationHtml || '<p>No citations available.</p>';
    }
}

/**
 * Copy citations to clipboard
 */
async function copyCitationsToClipboard() {
    const format = document.getElementById('citationFormat')?.value || 'chicago';
    const formattedCitations = formatAllCitations(format);

    DebugLogger.log('CITATION', `Copying ${AppState.citations.length} citations to clipboard in ${format} format`);

    try {
        await navigator.clipboard.writeText(formattedCitations);
        DebugLogger.log('CITATION', 'Citations copied to clipboard successfully');
        showSuccess('Citations copied to clipboard!');
    } catch (error) {
        DebugLogger.warn('copyCitationsToClipboard', 'Clipboard API failed, using fallback');
        // Fallback for older browsers
        const textArea = document.createElement('textarea');
        textArea.value = formattedCitations;
        textArea.style.position = 'fixed';
        textArea.style.left = '-9999px';
        document.body.appendChild(textArea);
        textArea.select();

        try {
            document.execCommand('copy');
            DebugLogger.log('CITATION', 'Citations copied via fallback method');
            showSuccess('Citations copied to clipboard!');
        } catch (e) {
            DebugLogger.error('copyCitationsToClipboard', e);
            showError('Failed to copy citations. Please select and copy manually.');
        }

        document.body.removeChild(textArea);
    }
}

/**
 * Download citations as a file
 */
function downloadCitationsAsFile() {
    const format = document.getElementById('citationFormat')?.value || 'chicago';
    const formattedCitations = formatAllCitations(format);

    DebugLogger.log('CITATION', `Downloading ${AppState.citations.length} citations as ${format} file`);

    // Determine file extension
    let extension = '.txt';
    let mimeType = 'text/plain';

    if (format === 'bibtex') {
        extension = '.bib';
        mimeType = 'application/x-bibtex';
    } else if (format === 'json') {
        extension = '.json';
        mimeType = 'application/json';
    }

    // Create and download file
    const blob = new Blob([formattedCitations], { type: mimeType });
    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = url;
    link.download = `matushka_citations_${format}${extension}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    URL.revokeObjectURL(url);

    DebugLogger.log('CITATION', `Citations file downloaded: ${link.download}`);
    showSuccess(`Citations downloaded as ${link.download}`);
}

/**
 * Handle citation format change
 *
 * @param {Event} event - Change event from select element
 */
function handleCitationFormatChange(event) {
    const format = event.target.value;
    displayCitationsInFormat(format);
}

// =============================================================================
// UI INITIALIZATION
// =============================================================================

/**
 * Initialize all event listeners when DOM is ready
 */
document.addEventListener('DOMContentLoaded', function() {
    const initStartTime = performance.now();

    // Initialize debug panel first
    initializeDebugPanel();

    DebugLogger.group('Application Initialization');
    DebugLogger.init('Matushka Application', {
        version: '2.0.0',
        workerUrl: WORKER_URL,
        debugEnabled: DEBUG.enabled,
        logLevel: DEBUG.logLevel
    });

    // Log environment info
    DebugLogger.init('Environment', DebugLogger.getEnvironmentInfo());

    // Log configuration
    DebugLogger.init('API Configuration', API_CONFIG);

    initializeEventListeners();
    DebugLogger.init('Event listeners registered');

    initializeCheckboxBehavior();
    DebugLogger.init('Checkbox behavior initialized');

    initializeResultsSection();
    DebugLogger.init('Results section initialized');

    initializeCitationsSection();
    DebugLogger.init('Citations section initialized');

    DebugLogger.timing('Initialization complete', initStartTime);
    DebugLogger.log('INIT', 'Application ready');
    DebugLogger.groupEnd();
});

/**
 * Initialize event listeners for form controls
 */
function initializeEventListeners() {
    // Search button
    const searchBtn = document.getElementById('searchBtn');
    if (searchBtn) {
        searchBtn.addEventListener('click', () => {
            DebugLogger.ui('click', 'searchBtn');
            executeSearch();
        });
    }

    // Reset button
    const resetBtn = document.getElementById('resetBtn');
    if (resetBtn) {
        resetBtn.addEventListener('click', () => {
            DebugLogger.ui('click', 'resetBtn');
            resetToDefaults();
        });
    }

    // Select all checkbox
    const selectAllCheckbox = document.getElementById('selectAllCheckbox');
    if (selectAllCheckbox) {
        selectAllCheckbox.addEventListener('change', (e) => {
            DebugLogger.ui('change', 'selectAllCheckbox', e.target.checked);
            handleSelectAllToggle(e);
        });
    }

    // Download selected button
    const downloadBtn = document.getElementById('downloadSelectedBtn');
    if (downloadBtn) {
        downloadBtn.addEventListener('click', () => {
            DebugLogger.ui('click', 'downloadSelectedBtn');
            downloadSelectedItems();
        });
    }

    // Citation format selector
    const citationFormat = document.getElementById('citationFormat');
    if (citationFormat) {
        citationFormat.addEventListener('change', (e) => {
            DebugLogger.ui('change', 'citationFormat', e.target.value);
            handleCitationFormatChange(e);
        });
    }

    // Copy citations button
    const copyCitationsBtn = document.getElementById('copyCitationsBtn');
    if (copyCitationsBtn) {
        copyCitationsBtn.addEventListener('click', () => {
            DebugLogger.ui('click', 'copyCitationsBtn');
            copyCitationsToClipboard();
        });
    }

    // Download citations button
    const downloadCitationsBtn = document.getElementById('downloadCitationsBtn');
    if (downloadCitationsBtn) {
        downloadCitationsBtn.addEventListener('click', () => {
            DebugLogger.ui('click', 'downloadCitationsBtn');
            downloadCitationsAsFile();
        });
    }

    // Enter key on form inputs should trigger search
    const formInputs = document.querySelectorAll('#configForm input[type="number"]');
    formInputs.forEach(input => {
        input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                DebugLogger.ui('keypress', `${input.id} (Enter)`);
                e.preventDefault();
                executeSearch();
            }
        });
        // Log value changes on blur
        input.addEventListener('blur', (e) => {
            DebugLogger.ui('change', input.id, e.target.value);
        });
    });
}

/**
 * Initialize "All Categories" and "All Sources" checkbox behavior
 */
function initializeCheckboxBehavior() {
    // All Categories checkbox
    const allCategoriesCheckbox = document.getElementById('allCategories');
    if (allCategoriesCheckbox) {
        allCategoriesCheckbox.addEventListener('change', handleAllCategoriesCheckbox);
        // Initialize state
        handleAllCategoriesCheckbox();
    }

    // All Sources checkbox
    const allSourcesCheckbox = document.getElementById('allSources');
    if (allSourcesCheckbox) {
        allSourcesCheckbox.addEventListener('change', handleAllSourcesCheckbox);
        // Initialize state
        handleAllSourcesCheckbox();
    }

    // Individual category checkboxes
    const categoryCheckboxes = document.querySelectorAll('input[name="categories"]');
    categoryCheckboxes.forEach(checkbox => {
        checkbox.addEventListener('change', handleIndividualCategoryChange);
    });

    // Individual source checkboxes
    const sourceCheckboxes = document.querySelectorAll('input[name="sources"]');
    sourceCheckboxes.forEach(checkbox => {
        checkbox.addEventListener('change', handleIndividualSourceChange);
    });
}

/**
 * Handle "All Categories" checkbox state change
 */
function handleAllCategoriesCheckbox() {
    const allCategoriesCheckbox = document.getElementById('allCategories');
    const categoryCheckboxes = document.querySelectorAll('input[name="categories"]');

    DebugLogger.ui('change', 'allCategories', allCategoriesCheckbox?.checked);

    if (allCategoriesCheckbox?.checked) {
        // Disable and uncheck individual category checkboxes
        categoryCheckboxes.forEach(checkbox => {
            checkbox.disabled = true;
            checkbox.checked = false;
        });
        DebugLogger.log('UI', 'All individual category checkboxes disabled');
    } else {
        // Enable individual category checkboxes
        categoryCheckboxes.forEach(checkbox => {
            checkbox.disabled = false;
        });
        DebugLogger.log('UI', 'All individual category checkboxes enabled');
    }
}

/**
 * Handle individual category checkbox change
 */
function handleIndividualCategoryChange() {
    const allCategoriesCheckbox = document.getElementById('allCategories');
    const categoryCheckboxes = document.querySelectorAll('input[name="categories"]');
    const checkedCategories = Array.from(categoryCheckboxes).filter(cb => cb.checked).map(cb => cb.value);
    const anyChecked = checkedCategories.length > 0;

    DebugLogger.ui('change', 'categories', checkedCategories);

    // Uncheck "All Categories" if any individual category is checked
    if (anyChecked && allCategoriesCheckbox) {
        allCategoriesCheckbox.checked = false;
    }
}

/**
 * Handle "All Sources" checkbox state change
 */
function handleAllSourcesCheckbox() {
    const allSourcesCheckbox = document.getElementById('allSources');
    const sourceCheckboxes = document.querySelectorAll('input[name="sources"]');

    DebugLogger.ui('change', 'allSources', allSourcesCheckbox?.checked);

    if (allSourcesCheckbox?.checked) {
        // Disable and uncheck individual source checkboxes
        sourceCheckboxes.forEach(checkbox => {
            checkbox.disabled = true;
            checkbox.checked = false;
        });
        DebugLogger.log('UI', 'All individual source checkboxes disabled');
    } else {
        // Enable individual source checkboxes
        sourceCheckboxes.forEach(checkbox => {
            checkbox.disabled = false;
        });
        DebugLogger.log('UI', 'All individual source checkboxes enabled');
    }
}

/**
 * Handle individual source checkbox change
 */
function handleIndividualSourceChange() {
    const allSourcesCheckbox = document.getElementById('allSources');
    const sourceCheckboxes = document.querySelectorAll('input[name="sources"]');
    const checkedSources = Array.from(sourceCheckboxes).filter(cb => cb.checked).map(cb => cb.value);
    const anyChecked = checkedSources.length > 0;

    DebugLogger.ui('change', 'sources', checkedSources);

    // Uncheck "All Sources" if any individual source is checked
    if (anyChecked && allSourcesCheckbox) {
        allSourcesCheckbox.checked = false;
    }
}

/**
 * Initialize the results section (hidden by default)
 */
function initializeResultsSection() {
    const resultsSection = document.getElementById('resultsSection');
    if (resultsSection) {
        resultsSection.style.display = 'none';
    }

    // Initialize download progress container
    const downloadProgress = document.getElementById('downloadProgress');
    if (downloadProgress) {
        downloadProgress.style.display = 'none';
    }
}

/**
 * Initialize the citations section (hidden by default)
 */
function initializeCitationsSection() {
    const citationsSection = document.getElementById('citationsSection');
    if (citationsSection) {
        citationsSection.style.display = 'none';
    }
}

/**
 * Reset form to default values
 */
function resetToDefaults() {
    DebugLogger.group('Reset to Defaults');
    DebugLogger.log('UI', 'Resetting form to default values');

    clearMessages();

    // Duration
    const minDuration = document.getElementById('minDuration');
    const maxDuration = document.getElementById('maxDuration');
    if (minDuration) minDuration.value = 30;
    if (maxDuration) maxDuration.value = 600;

    // Date range
    const daysBack = document.getElementById('daysBack');
    if (daysBack) daysBack.value = 7;

    // Categories - reset to "All"
    const allCategoriesCheckbox = document.getElementById('allCategories');
    if (allCategoriesCheckbox) {
        allCategoriesCheckbox.checked = true;
    }
    const categoryCheckboxes = document.querySelectorAll('input[name="categories"]');
    categoryCheckboxes.forEach(checkbox => {
        checkbox.checked = false;
        checkbox.disabled = true;
    });

    // Sources - reset to "All"
    const allSourcesCheckbox = document.getElementById('allSources');
    if (allSourcesCheckbox) {
        allSourcesCheckbox.checked = true;
    }
    const sourceCheckboxes = document.querySelectorAll('input[name="sources"]');
    sourceCheckboxes.forEach(checkbox => {
        checkbox.checked = false;
        checkbox.disabled = true;
    });

    // Max items
    const maxItems = document.getElementById('maxItems');
    if (maxItems) maxItems.value = 50;

    // Clear results
    DebugLogger.state('AppState.searchResults', AppState.searchResults, []);
    AppState.searchResults = [];

    DebugLogger.state('AppState.selectedItems', `Set(${AppState.selectedItems.size})`, 'Set(0)');
    AppState.selectedItems.clear();

    const resultsSection = document.getElementById('resultsSection');
    if (resultsSection) {
        resultsSection.style.display = 'none';
    }

    // Clear citations
    DebugLogger.state('AppState.citations', AppState.citations, []);
    AppState.citations = [];

    DebugLogger.state('AppState.downloadedItems', `Map(${AppState.downloadedItems.size})`, 'Map(0)');
    AppState.downloadedItems.clear();

    const citationsSection = document.getElementById('citationsSection');
    if (citationsSection) {
        citationsSection.style.display = 'none';
    }

    DebugLogger.log('UI', 'Form reset complete');
    DebugLogger.groupEnd();

    showSuccess('Form reset to default values');
}

// =============================================================================
// LEGACY SUPPORT - Config Generator Functions
// =============================================================================

/**
 * Generate configuration file (legacy support for config generator mode)
 *
 * This function is maintained for backward compatibility with the original
 * configuration generator functionality.
 */
function generateConfig() {
    clearMessages();

    // Collect form values
    const config = {
        filters: {
            duration: {
                min_seconds: parseInt(document.getElementById('minDuration')?.value) || 30,
                max_seconds: parseInt(document.getElementById('maxDuration')?.value) || 600
            },
            date_range: {
                days_back: parseInt(document.getElementById('daysBack')?.value) || 7
            },
            categories: getSelectedCategories(),
            sources: getSelectedSources()
        },
        collection: {
            max_items: parseInt(document.getElementById('maxItems')?.value) || 50
        },
        output: {
            citation_formats: getSelectedFormats()
        }
    };

    // Validate configuration
    const validationErrors = validateConfigLegacy(config);
    if (validationErrors.length > 0) {
        validationErrors.forEach(error => showError(error));
        return;
    }

    // Download configuration file
    downloadJSON(config, 'config.json');
    showSuccess('Configuration generated successfully!');
}

/**
 * Get selected citation formats (legacy support)
 *
 * @returns {Array<string>} Array of selected format values
 */
function getSelectedFormats() {
    const formatCheckboxes = document.querySelectorAll('input[name="formats"]:checked');
    return Array.from(formatCheckboxes).map(cb => cb.value);
}

/**
 * Validate configuration object (legacy support)
 *
 * @param {Object} config - Configuration object to validate
 * @returns {Array} Array of error messages
 */
function validateConfigLegacy(config) {
    const errors = [];

    // Validate duration
    const minDuration = config.filters.duration.min_seconds;
    const maxDuration = config.filters.duration.max_seconds;

    if (isNaN(minDuration) || minDuration < 0) {
        errors.push('Minimum duration must be a positive number');
    }

    if (isNaN(maxDuration) || maxDuration < 0) {
        errors.push('Maximum duration must be a positive number');
    }

    if (minDuration >= maxDuration) {
        errors.push('Minimum duration must be less than maximum duration');
    }

    if (maxDuration > 3600) {
        errors.push('Maximum duration cannot exceed 3600 seconds (1 hour)');
    }

    // Validate days back
    const daysBack = config.filters.date_range.days_back;
    if (isNaN(daysBack) || daysBack < 1) {
        errors.push('Days back must be at least 1');
    }

    if (daysBack > 365) {
        errors.push('Days back cannot exceed 365');
    }

    // Validate categories
    if (!config.filters.categories || config.filters.categories.length === 0) {
        errors.push('At least one category must be selected');
    }

    // Validate sources
    if (!config.filters.sources || config.filters.sources.length === 0) {
        errors.push('At least one source must be selected');
    }

    // Validate max items
    const maxItems = config.collection.max_items;
    if (isNaN(maxItems) || maxItems < 1) {
        errors.push('Maximum items must be at least 1');
    }

    if (maxItems > 500) {
        errors.push('Maximum items cannot exceed 500');
    }

    return errors;
}

/**
 * Download data as JSON file (legacy support)
 *
 * @param {Object} data - Data to download
 * @param {string} filename - Name of the file
 */
function downloadJSON(data, filename) {
    const jsonString = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    // Clean up the URL object
    URL.revokeObjectURL(url);
}

// =============================================================================
// EXPORT FOR TESTING (if needed)
// =============================================================================

// Expose key functions for testing purposes
if (typeof window !== 'undefined') {
    window.Matushka = {
        // Configuration
        WORKER_URL,
        API_CONFIG,
        DEBUG,

        // State
        AppState,

        // Debug utilities
        DebugLogger,
        initializeDebugPanel,
        withErrorBoundary,

        // Utilities
        formatDuration,
        formatDate,
        sanitizeFilename,
        generateCitationId,
        showError,
        showSuccess,

        // API functions
        discoverContent,
        scrapeMetadata,
        getProxyUrl,

        // Search and results
        executeSearch,
        displayResults,

        // Downloads
        downloadSelectedItems,

        // Citations
        formatChicagoCitation,
        formatMLACitation,
        formatAPACitation,
        formatBibTeXCitation,
        formatJSONCitation,
        formatAllCitations,
        copyCitationsToClipboard,
        downloadCitationsAsFile,

        // Form controls
        resetToDefaults,
        collectFilters
    };

    // Log that the application is available
    DebugLogger.log('INIT', 'Matushka object exposed on window');
}
