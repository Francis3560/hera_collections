import prisma from '../database.js';
import NotificationService from './notification.service.js';

class InquiryService {
  /**
   * Create or find an open inquiry session
   */
  async getOrCreateSession({ userId, guestId, guestName, guestEmail }) {
    // Try to find an open session for this user/guest
    const existingSession = await prisma.inquirySession.findFirst({
      where: {
        OR: [
          userId ? { userId: Number(userId), status: 'OPEN' } : null,
          guestId ? { guestId, status: 'OPEN' } : null
        ].filter(Boolean)
      },
      include: {
        messages: {
          orderBy: { createdAt: 'asc' }
        }
      }
    });

    if (existingSession) {
      return existingSession;
    }

    // Create new session
    const session = await prisma.inquirySession.create({
      data: {
        userId: userId ? Number(userId) : null,
        guestId,
        guestName,
        guestEmail,
        status: 'OPEN'
      },
      include: {
        messages: true
      }
    });

    // Notify admins that a new session has started
    await this.notifyAdminsOfNewSession(session);

    return session;
  }

  /**
   * Notify all admins of a new inquiry session
   */
  async notifyAdminsOfNewSession(session) {
    const senderName = session.guestName || "Guest User";
    const admins = await prisma.user.findMany({
      where: { role: 'ADMIN', deletedAt: null }
    });

    for (const admin of admins) {
      await NotificationService.createNotification({
        userId: admin.id,
        type: 'INQUIRY_MESSAGE',
        title: 'New Chat Session',
        message: `${senderName} has started a new inquiry session.`,
        link: `/admin/messaging/inbox`,
        entityId: String(session.id),
        entityType: 'INQUIRY'
      });
    }
  }

  /**
   * Add a message to a session
   */
  async addMessage({ sessionId, senderId, isFromAdmin, content }) {
    const message = await prisma.inquiryMessage.create({
      data: {
        sessionId,
        senderId: senderId ? Number(senderId) : null,
        isFromAdmin,
        content
      },
      include: {
        session: true
      }
    });

    // Notify admin if message is from user/guest
    if (!isFromAdmin) {
      await this.notifyAdminsOfNewMessage(message);
    }

    return message;
  }

  /**
   * Notify all admins of a new message
   */
  async notifyAdminsOfNewMessage(message) {
    const senderName = message.session.guestName || "Guest User";
    
    // Create in-app notification for all admins
    const admins = await prisma.user.findMany({
      where: { role: 'ADMIN', deletedAt: null }
    });

    for (const admin of admins) {
      await NotificationService.createNotification({
        userId: admin.id,
        type: 'INQUIRY_MESSAGE',
        title: 'New Live Inquiry',
        message: `${senderName}: ${message.content.substring(0, 50)}${message.content.length > 50 ? '...' : ''}`,
        link: `/admin/messaging/inbox`,
        entityId: String(message.sessionId),
        entityType: 'INQUIRY'
      });
    }
  }

  /**
   * Get all active sessions (for Admin)
   */
  async getActiveSessions() {
    return await prisma.inquirySession.findMany({
      where: { status: 'OPEN' },
      include: {
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1
        },
        user: {
          select: { id: true, name: true, email: true, picture: true }
        }
      },
      orderBy: { updatedAt: 'desc' }
    });
  }

  /**
   * Get session details with all messages
   */
  async getSessionDetails(sessionId) {
    return await prisma.inquirySession.findUnique({
      where: { id: sessionId },
      include: {
        messages: {
          orderBy: { createdAt: 'asc' }
        },
        user: {
          select: { id: true, name: true, email: true, picture: true }
        }
      }
    });
  }

  /**
   * Close session (makes it "disappear")
   */
  async closeSession(sessionId) {
    // The user said "disappear", so we'll delete the session and its messages
    // To be safe we could mark as CLOSED, but let's follow the "disappear" requirement
    return await prisma.inquirySession.delete({
      where: { id: sessionId }
    });
  }
}

export default new InquiryService();
