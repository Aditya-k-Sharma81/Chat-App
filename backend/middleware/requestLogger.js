/**
 * Request Logger Middleware
 * Logs basic request details (Method, URL, Time) 
 * and demonstrates proper next() usage.
 */

const requestLogger = (req, res, next) => {
    const start = Date.now();
    const { method, originalUrl } = req;
    
    // Log basic details
    console.log(`[${new Date().toISOString()}] ${method} ${originalUrl}`);

    // Extendable: You could add auth checks here if needed
    // if (!req.headers.authorization) { 
    //    return res.status(401).json({ message: 'Unauthorized' });
    // }

    // Use next() to pass control to the next middleware/route handler
    next();

    // Optional: Log when the request finishes
    res.on('finish', () => {
        const duration = Date.now() - start;
        console.log(`[${new Date().toISOString()}] ${method} ${originalUrl} COMPLETED in ${duration}ms`);
    });
};

module.exports = requestLogger;
