/**
 * Système de notifications automatiques
 *
 * Crée des notifications in-app pour les événements importants :
 * - Nouvelle commande pour les pharmaciens
 * - Changement de statut de commande pour les patients
 * - Messages reçus
 * - Avis clients
 */

import { logger } from '@/lib/logger';
import { db } from '@/lib/db';

export type NotificationType = 'info' | 'order' | 'alert' | 'review' | 'message' | 'stock';

export interface NotificationData {
  orderId?: string;
  medicationId?: string;
  medicationName?: string;
  pharmacyId?: string;
  reviewId?: string;
  messageId?: string;
  senderId?: string;
}

/**
 * Crée une notification pour un utilisateur
 */
export async function createNotification({
  userId,
  title,
  message,
  type = 'info',
  data,
}: {
  userId: string;
  title: string;
  message: string;
  type?: NotificationType;
  data?: NotificationData;
}) {
  try {
    const notification = await db.notification.create({
      data: {
        userId,
        title,
        message,
        type,
        data: data ? JSON.stringify(data) : null,
      },
    });
    logger.info('Notification created', { notificationId: notification.id, userId, type });
    return notification;
  } catch (error) {
    logger.error('Error creating notification:', error);
    return null;
  }
}

/**
 * Notifie le pharmacien d'une nouvelle commande
 */
export async function notifyNewOrder(orderId: string, pharmacyId: string) {
  try {
    // Trouver le pharmacien lié à cette pharmacie
    const pharmacist = await db.user.findFirst({
      where: {
        linkedPharmacyId: pharmacyId,
        role: 'pharmacist',
      },
      select: { id: true },
    });

    if (!pharmacist) {
      logger.warn('No pharmacist found for pharmacy', { pharmacyId });
      return null;
    }

    // Récupérer les détails de la commande
    const order = await db.order.findUnique({
      where: { id: orderId },
      select: {
        totalQuantity: true,
        totalPrice: true,
        items: {
          select: {
            medication: {
              select: {
                name: true,
                commercialName: true,
              },
            },
          },
          take: 1,
        },
      },
    });

    const firstMedication = order?.items[0]?.medication;
    const medicationName = firstMedication?.commercialName || firstMedication?.name || 'Médicament';
    const itemCount = order?.totalQuantity || 0;

    return await createNotification({
      userId: pharmacist.id,
      title: '📦 Nouvelle commande',
      message: `Commande de ${itemCount} médicament${itemCount > 1 ? 's' : ''} • ${medicationName}${itemCount > 1 ? ` et ${itemCount - 1} autre${itemCount > 2 ? 's' : ''}` : ''}`,
      type: 'order',
      data: { orderId },
    });
  } catch (error) {
    logger.error('Error notifying new order:', error);
    return null;
  }
}

/**
 * Notifie le patient d'un changement de statut de commande
 */
export async function notifyOrderStatusChange(orderId: string, status: string) {
  try {
    const order = await db.order.findUnique({
      where: { id: orderId },
      select: {
        userId: true,
        items: {
          select: {
            medication: {
              select: {
                name: true,
                commercialName: true,
              },
            },
          },
          take: 1,
        },
      },
    });

    if (!order) {
      logger.warn('Order not found for status notification', { orderId });
      return null;
    }

    const statusMessages: Record<string, { title: string; message: string }> = {
      confirmed: {
        title: '✅ Commande confirmée',
        message: 'Votre commande a été confirmée par la pharmacie. Elle est en cours de préparation.',
      },
      ready: {
        title: '🎯 Commande prête',
        message: 'Votre commande est prête à être récupérée à la pharmacie.',
      },
      picked_up: {
        title: '✨ Commande récupérée',
        message: 'Votre commande a été récupérée avec succès. Merci de votre confiance !',
      },
      cancelled: {
        title: '❌ Commande annulée',
        message: 'Votre commande a été annulée. Le stock a été restauré.',
      },
    };

    const statusInfo = statusMessages[status];
    if (!statusInfo) {
      return null;
    }

    return await createNotification({
      userId: order.userId,
      title: statusInfo.title,
      message: statusInfo.message,
      type: 'order',
      data: { orderId },
    });
  } catch (error) {
    logger.error('Error notifying order status change:', error);
    return null;
  }
}

/**
 * Notifie l'utilisateur d'un nouveau message reçu
 */
export async function notifyNewMessage(messageId: string, receiverId: string, senderName: string) {
  try {
    return await createNotification({
      userId: receiverId,
      title: '💬 Nouveau message',
      message: `Vous avez reçu un nouveau message de ${senderName}`,
      type: 'message',
      data: { messageId, senderId: senderName },
    });
  } catch (error) {
    logger.error('Error notifying new message:', error);
    return null;
  }
}

/**
 * Notifie le pharmacien d'un nouvel avis client
 */
export async function notifyNewReview(reviewId: string, pharmacyId: string, rating: number, userName?: string) {
  try {
    const pharmacist = await db.user.findFirst({
      where: {
        linkedPharmacyId: pharmacyId,
        role: 'pharmacist',
      },
      select: { id: true },
    });

    if (!pharmacist) {
      return null;
    }

    const stars = '⭐'.repeat(rating) + '☆'.repeat(5 - rating);

    return await createNotification({
      userId: pharmacist.id,
      title: `${stars} Nouvel avis client`,
      message: `${userName || 'Un client'} a laissé un avis de ${rating}/5`,
      type: 'review',
      data: { reviewId, pharmacyId },
    });
  } catch (error) {
    logger.error('Error notifying new review:', error);
    return null;
  }
}

/**
 * Notifie le pharmacien d'un stock bas
 */
export async function notifyLowStock(pharmacyId: string, medicationName: string, currentStock: number) {
  try {
    const pharmacist = await db.user.findFirst({
      where: {
        linkedPharmacyId: pharmacyId,
        role: 'pharmacist',
      },
      select: { id: true },
    });

    if (!pharmacist) {
      return null;
    }

    return await createNotification({
      userId: pharmacist.id,
      title: '⚠️ Stock faible',
      message: `${medicationName} - Stock restant : ${currentStock} unité${currentStock > 1 ? 's' : ''}`,
      type: 'stock',
      data: { medicationName, pharmacyId },
    });
  } catch (error) {
    logger.error('Error notifying low stock:', error);
    return null;
  }
}

/**
 * Marque une notification comme lue
 */
export async function markNotificationAsRead(notificationId: string) {
  try {
    return await db.notification.update({
      where: { id: notificationId },
      data: { read: true },
    });
  } catch (error) {
    logger.error('Error marking notification as read:', error);
    return null;
  }
}

/**
 * Marque toutes les notifications d'un utilisateur comme lues
 */
export async function markAllNotificationsAsRead(userId: string) {
  try {
    const result = await db.notification.updateMany({
      where: {
        userId,
        read: false,
      },
      data: { read: true },
    });
    logger.info('All notifications marked as read', { userId, count: result.count });
    return result;
  } catch (error) {
    logger.error('Error marking all notifications as read:', error);
    return null;
  }
}
