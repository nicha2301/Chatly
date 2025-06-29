import * as admin from 'firebase-admin';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

dotenv.config();

// Đường dẫn đến file service account
const SERVICE_ACCOUNT_PATH = process.env.FIREBASE_SERVICE_ACCOUNT_PATH || '';

// Khởi tạo Firebase Admin SDK
const initFirebase = (): admin.app.App | null => {
  try {
    // Kiểm tra xem Firebase đã được khởi tạo chưa
    if (admin.apps.length > 0) {
      return admin.apps[0];
    }

    // Kiểm tra xem có sử dụng Firebase không
    const useFirebase = process.env.USE_FIREBASE === 'true';
    
    if (!useFirebase) {
      console.log('Firebase is disabled, skipping initialization...');
      return null;
    }

    // Kiểm tra file service account tồn tại
    if (!SERVICE_ACCOUNT_PATH || !fs.existsSync(SERVICE_ACCOUNT_PATH)) {
      console.error('Firebase service account file not found');
      return null;
    }

    // Đọc file service account
    const serviceAccount = require(path.resolve(SERVICE_ACCOUNT_PATH));

    // Khởi tạo Firebase Admin SDK
    const app = admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      databaseURL: process.env.FIREBASE_DATABASE_URL || '',
      storageBucket: process.env.FIREBASE_STORAGE_BUCKET || ''
    });

    console.log('Firebase Admin SDK initialized successfully');
    return app;
  } catch (error) {
    console.error('Error initializing Firebase Admin SDK:', error);
    return null;
  }
};

// Lấy Firebase Messaging
export const getMessaging = (): admin.messaging.Messaging | null => {
  try {
    const app = initFirebase();
    if (!app) {
      return null;
    }
    return admin.messaging(app);
  } catch (error) {
    console.error('Error getting Firebase Messaging:', error);
    return null;
  }
};

// Gửi thông báo đến một thiết bị
export const sendNotification = async (
  token: string,
  title: string,
  body: string,
  data?: Record<string, string>
): Promise<boolean> => {
  try {
    const messaging = getMessaging();
    if (!messaging) {
      return false;
    }

    // Cấu hình thông báo
    const message: admin.messaging.Message = {
      notification: {
        title,
        body
      },
      data,
      token
    };

    // Gửi thông báo
    const response = await messaging.send(message);
    console.log('Notification sent successfully:', response);
    return true;
  } catch (error) {
    console.error('Error sending notification:', error);
    return false;
  }
};

// Gửi thông báo đến nhiều thiết bị
export const sendMulticastNotification = async (
  tokens: string[],
  title: string,
  body: string,
  data?: Record<string, string>
): Promise<admin.messaging.BatchResponse | null> => {
  try {
    const messaging = getMessaging();
    if (!messaging) {
      return null;
    }

    // Kiểm tra danh sách tokens
    if (!tokens || tokens.length === 0) {
      console.error('No tokens provided');
      return null;
    }

    // Cấu hình thông báo
    const message: admin.messaging.MulticastMessage = {
      notification: {
        title,
        body
      },
      data,
      tokens
    };

    // Gửi thông báo đến nhiều thiết bị
    // Sử dụng phương thức sendEach thay vì sendMulticast
    const response = await messaging.sendEach(tokens.map(token => ({
      notification: { title, body },
      data,
      token
    })));
    
    console.log('Multicast notification sent successfully:', response);
    return response;
  } catch (error) {
    console.error('Error sending multicast notification:', error);
    return null;
  }
};

export default initFirebase; 