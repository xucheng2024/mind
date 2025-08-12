export default function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { error, stack, componentStack, timestamp, userAgent, url } = req.body;

    // Log error to console for debugging
    console.error('Error Report:', {
      error,
      stack,
      componentStack,
      timestamp,
      userAgent,
      url
    });

    // In a production environment, you might want to:
    // - Send to a logging service (e.g., Sentry, LogRocket)
    // - Store in a database
    // - Send notifications to developers

    res.status(200).json({ 
      success: true, 
      message: 'Error report received',
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    console.error('Failed to process error report:', err);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to process error report' 
    });
  }
}
