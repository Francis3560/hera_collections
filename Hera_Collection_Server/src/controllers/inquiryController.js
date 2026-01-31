import InquiryService from '../services/inquiry.service.js';

/**
 * Get or create a session for the current user/guest
 */
export const getMySession = async (req, res) => {
  try {
    const { guestId, guestName, guestEmail } = req.body;
    const userId = req.user?.id; // From auth middleware if logged in

    const session = await InquiryService.getOrCreateSession({
      userId,
      guestId,
      guestName,
      guestEmail
    });

    res.status(200).json(session);
  } catch (error) {
    console.error('Error fetching/creating inquiry session:', error);
    res.status(500).json({ message: 'Failed to initialize inquiry session' });
  }
};

/**
 * Send a message (User/Guest)
 */
export const sendMessage = async (req, res) => {
  try {
    const { sessionId, content } = req.body;
    const senderId = req.user?.id;

    if (!sessionId || !content) {
      return res.status(400).json({ message: 'Session ID and content are required' });
    }

    const message = await InquiryService.addMessage({
      sessionId,
      senderId,
      isFromAdmin: false,
      content
    });

    res.status(201).json(message);
  } catch (error) {
    console.error('Error sending message:', error);
    res.status(500).json({ message: 'Failed to send message' });
  }
};

/**
 * Admin: Get all active inquiries
 */
export const getActiveInquiries = async (req, res) => {
  try {
    const sessions = await InquiryService.getActiveSessions();
    res.status(200).json(sessions);
  } catch (error) {
    console.error('Error fetching active inquiries:', error);
    res.status(500).json({ message: 'Failed to fetch active inquiries' });
  }
};

/**
 * Admin: Reply to an inquiry
 */
export const adminReply = async (req, res) => {
  try {
    const { sessionId, content } = req.body;
    const senderId = req.user.id;

    if (!sessionId || !content) {
      return res.status(400).json({ message: 'Session ID and content are required' });
    }

    const message = await InquiryService.addMessage({
      sessionId,
      senderId,
      isFromAdmin: true,
      content
    });

    res.status(201).json(message);
  } catch (error) {
    console.error('Error sending admin reply:', error);
    res.status(500).json({ message: 'Failed to send reply' });
  }
};

/**
 * Admin: Close session
 */
export const closeInquiry = async (req, res) => {
  try {
    const { id } = req.params;
    await InquiryService.closeSession(id);
    res.status(200).json({ message: 'Inquiry closed and session removed' });
  } catch (error) {
    console.error('Error closing inquiry:', error);
    res.status(500).json({ message: 'Failed to close inquiry' });
  }
};

/**
 * Admin: Get session messages
 */
export const getInquiryMessages = async (req, res) => {
  try {
    const { id } = req.params;
    const session = await InquiryService.getSessionDetails(id);
    if (!session) return res.status(404).json({ message: 'Session not found' });
    res.status(200).json(session);
  } catch (error) {
    console.error('Error fetching inquiry messages:', error);
    res.status(500).json({ message: 'Failed to fetch messages' });
  }
};
