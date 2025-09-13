import { Injectable } from "@nestjs/common";

@Injectable()
export class PresenceService {
  private connectedUsers = new Map<string, { status: string; lastSeen: Date }>();

  // mark user as online
  setUserOnline(userId: string) {
    this.connectedUsers.set(userId, {
      status: 'ONLINE',
      lastSeen: new Date(),
    });
  }

  // mark user offline
  setUserOffline(userId: string) {
    this.connectedUsers.set(userId, {
      status: 'OFFLINE',
      lastSeen: new Date(),
    });
  }

  // get user status
  getUserStatus(userId: string) {
    return this.connectedUsers.get(userId) || {
      status: 'OFFLINE',
      lastSeen: new Date(),
    };
  }

  // get all users online
  getOnlineUsers() {
    const online = [];
    this.connectedUsers.forEach((status, userId) => {
      if (status.status === 'ONLINE') {
        online.push({ userId, ...status });
      }
    });
    return online;
  }
}