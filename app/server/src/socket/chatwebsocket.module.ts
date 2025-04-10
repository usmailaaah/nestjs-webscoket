import { Module } from '@nestjs/common';
import { ChatWebSocket } from 'src/websocket';

@Module({
  providers: [ChatWebSocket],
  imports: [],
})
export class WebSocketModule { }
