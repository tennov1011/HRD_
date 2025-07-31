/**
 * Format a date string or Date object to a human-readable format
 * @param {string|Date} date - The date to format
 * @param {string} format - The format to use (default: 'medium')
 * @returns {string} - Formatted date string
 */
export function formatDate(date, format = 'medium') {
    if (!date) return '';
    
    const dateObj = date instanceof Date ? date : new Date(date);
    
    // Check if date is valid
    if (isNaN(dateObj.getTime())) {
        return 'Invalid date';
    }
    
    try {
        switch (format) {
            case 'short':
                return dateObj.toLocaleDateString();
            case 'long':
                return dateObj.toLocaleDateString(undefined, { 
                    weekday: 'long', 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                });
            case 'time':
                return dateObj.toLocaleTimeString(undefined, { 
                    hour: '2-digit', 
                    minute: '2-digit' 
                });
            case 'full':
                return dateObj.toLocaleDateString(undefined, { 
                    weekday: 'long', 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric', 
                    hour: '2-digit', 
                    minute: '2-digit' 
                });
            case 'medium':
            default:
                return dateObj.toLocaleDateString(undefined, { 
                    year: 'numeric', 
                    month: 'short', 
                    day: 'numeric' 
                });
        }
    } catch (error) {
        console.error('Error formatting date:', error);
        return String(dateObj);
    }
}

/**
 * Format a date for an HTML date input (YYYY-MM-DD)
 * @param {string|Date} date - The date to format
 * @returns {string} - Date formatted as YYYY-MM-DD
 */
export function formatDateForInput(date) {
    if (!date) return '';
    
    const dateObj = date instanceof Date ? date : new Date(date);
    
    // Check if date is valid
    if (isNaN(dateObj.getTime())) {
        return '';
    }
    
    const year = dateObj.getFullYear();
    const month = String(dateObj.getMonth() + 1).padStart(2, '0');
    const day = String(dateObj.getDate()).padStart(2, '0');
    
    return `${year}-${month}-${day}`;
}

/**
 * Get relative time string (e.g., "2 days ago", "in 3 hours")
 * @param {string|Date} date - The date to format
 * @returns {string} - Relative time string
 */
export function getRelativeTimeString(date) {
    if (!date) return '';
    
    const dateObj = date instanceof Date ? date : new Date(date);
    
    // Check if date is valid
    if (isNaN(dateObj.getTime())) {
        return 'Invalid date';
    }
    
    try {
        const formatter = new Intl.RelativeTimeFormat(undefined, {
            numeric: 'auto'
        });
        
        const now = new Date();
        const diffInSeconds = Math.floor((dateObj.getTime() - now.getTime()) / 1000);
        
        // Convert to appropriate unit
        if (Math.abs(diffInSeconds) < 60) {
            return formatter.format(diffInSeconds, 'second');
        }
        
        const diffInMinutes = Math.floor(diffInSeconds / 60);
        if (Math.abs(diffInMinutes) < 60) {
            return formatter.format(diffInMinutes, 'minute');
        }
        
        const diffInHours = Math.floor(diffInMinutes / 60);
        if (Math.abs(diffInHours) < 24) {
            return formatter.format(diffInHours, 'hour');
        }
        
        const diffInDays = Math.floor(diffInHours / 24);
        if (Math.abs(diffInDays) < 30) {
            return formatter.format(diffInDays, 'day');
        }
        
        const diffInMonths = Math.floor(diffInDays / 30);
        if (Math.abs(diffInMonths) < 12) {
            return formatter.format(diffInMonths, 'month');
        }
        
        const diffInYears = Math.floor(diffInDays / 365);
        return formatter.format(diffInYears, 'year');
        
    } catch (error) {
        console.error('Error formatting relative time:', error);
        return formatDate(dateObj);
    }
}

/**
 * Check if a date has passed (is in the past)
 * @param {string|Date} date - Date to check
 * @returns {boolean} True if date has passed
 */
export function isDatePassed(date) {
    if (!date) return false;
    
    const targetDate = new Date(date);
    const today = new Date();
    
    // Set today to start of day for fair comparison
    today.setHours(0, 0, 0, 0);
    targetDate.setHours(0, 0, 0, 0);
    
    return targetDate < today;
}

/**
 * Check if job deadline has passed
 * @param {Object} job - Job object with deadline property
 * @returns {boolean} True if deadline has passed
 */
export function isJobExpired(job) {
    return job?.deadline ? isDatePassed(job.deadline) : false;
}
