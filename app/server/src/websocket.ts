import {
  ConnectedSocket,
  MessageBody,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
@WebSocketGateway(3001, {
  cors: {
    origin: 'http://localhost:5173',
    credentials: true,
  },
})
export class ChatWebSocket {
  @WebSocketServer()
  server: Server;
  private messages = new Map<string, { from: string; message: string }[]>();
  @SubscribeMessage('join')
  handleSendRoom(
    @MessageBody() data: { room: string; sender: string },
    @ConnectedSocket() client: Socket,
  ): void {
    const { room, sender } = data;
    client.join(room);
    console.log(`hello ${sender} you are in ${room}`);
    this.server.to(room).emit('join', {
      form: sender,
      text: `welcome ${sender} joined the room`,
    });
  }
  @SubscribeMessage('leave')
  handleLeaveRoom(
    @MessageBody() room: string,
    @ConnectedSocket() client: Socket,
  ): void {
    client.leave(room);
    console.log(`${client.id} leave this room ${room}`);
    this.server.to(room).emit('leave', 'user has leaved this room');
  }

  @SubscribeMessage('message')
  handleMessage(
    @MessageBody() data: { room: string; message: string },
    @ConnectedSocket() client: Socket,
  ) {
    const { room, message } = data;
    const msgs = this.messages.get(room) || [];
    msgs.push({ from: client.id, message });
    this.messages.set(room, msgs);
    console.log(this.messages);
    this.server.to(room).emit('message', {
      from: client.id,
      text: message,
    });
  }

  handleConnection(client: Socket) {
    const id_user = client.handshake.query.userId as string;
    if (id_user) {
      client.join(` ${id_user}`);
      console.log(`welcome :  ${id_user}`);
    }
  }
  @SubscribeMessage('privateMessage')
  handlePrivateMessage(
    @MessageBody() data: { recipientId: string; message: string },
    @ConnectedSocket() client: Socket,
  ) {
    const senderId = client.handshake.query.userId;
    if (data.recipientId == senderId) {
      console.log('the same id ');
      return;
    }
    const room = `to : ${data.recipientId}  =>  ${data.message}`;
    console.log(room);
    this.server.to(room).emit('privateMessage', {
      from: senderId,
      text: data.message,
    });
  }
}
