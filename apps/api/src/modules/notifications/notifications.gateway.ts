import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { ConfigService } from '@nestjs/config';
import * as jwt from 'jsonwebtoken';

@WebSocketGateway({
  namespace: 'notifications',
  cors: {
    origin: '*',
    credentials: true,
  },
})
export class NotificationsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server!: Server;

  constructor(private readonly configService: ConfigService) {}

  /**
   * Handle WebSocket connection. Verify JWT and join user room.
   */
  async handleConnection(client: Socket) {
    try {
      const token = client.handshake.auth?.token || client.handshake.headers?.authorization?.replace('Bearer ', '');

      if (!token) {
        client.disconnect();
        return;
      }

      const secret = this.configService.get<string>('JWT_SECRET', 'default-secret');
      const payload = jwt.verify(token, secret) as { sub: string };

      if (!payload?.sub) {
        client.disconnect();
        return;
      }

      // Store userId on socket for later use
      (client as Socket & { userId: string }).userId = payload.sub;

      // Join user-specific room
      await client.join(`user:${payload.sub}`);
    } catch {
      client.disconnect();
    }
  }

  /**
   * Handle WebSocket disconnection.
   */
  handleDisconnect(_client: Socket) {
    // Cleanup handled automatically by Socket.IO
  }

  /**
   * Send notification to a specific user.
   */
  sendToUser(userId: string, notification: Record<string, unknown>) {
    this.server.to(`user:${userId}`).emit('notification:new', notification);
  }

  /**
   * Update unread count for a specific user.
   */
  updateUnreadCount(userId: string, count: number) {
    this.server.to(`user:${userId}`).emit('notification:count', { count });
  }
}
