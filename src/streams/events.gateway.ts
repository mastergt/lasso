import {
    ConnectedSocket,
    MessageBody,
    SubscribeMessage,
    WebSocketGateway,
    WebSocketServer,
    WsResponse,
} from '@nestjs/websockets';
import { from, Observable, timer } from 'rxjs';
import { map } from 'rxjs/operators';
import { Server, Socket } from 'socket.io';
import { StreamsService } from './streams.service';
import { LoggerService } from '../logger/logger.service';

@WebSocketGateway({
    cors: {
        origin: '*',
    },
})
export class EventsGateway {
    private connectedClients = []
    private tmp = 0;
    private readonly prefix = '[EventsGateway]'
    constructor(
        private readonly logger: LoggerService,
        private readonly streams: StreamsService
    ) { }
    @WebSocketServer()
    server: Server;
    afterInit() {
        this.server.on('connection', socket => {
            this.logger.debug(`new connection! ${socket.id}`, this.prefix, '[afterInit]');
            this.connectedClients.push(socket.id);
            socket.on("disconnect", (reason) => {
                console.warn(`DISCONNECT ${socket.id}`)
                const index = this.connectedClients.indexOf(socket.id);
                this.logger.debug(index, this.prefix, '[disconnect]')
                if (index > -1) {
                    this.connectedClients.splice(index, 1);
                }
            });
        })
    }
    @SubscribeMessage('stream')
    streamLog(@MessageBody('number') number: any, @ConnectedSocket() client: Socket): any {
        // let timerObj = {
        //     start: function () {
        //         let that = this;
        //         this.timer = setTimeout(function () {
        //             that.state = false
        //         }, 3000);
        //     },
        //     number: number,
        //     state: true,
        //     timer: {} as any
        // }
        // timerObj.start()
        // this.timers.push(timerObj)
        let unsubscribe;
        let logFunc = (log) => {
            this.logger.trace(log, this.prefix, '[streamLog]')
            this.logger.trace(this.connectedClients, this.prefix, '[streamLog]')
            this.logger.trace(this.connectedClients.indexOf(client.id), this.prefix, '[streamLog]')
            if (this.connectedClients.indexOf(client.id) > -1)
                client.emit('log', log);
            else unsubscribe();

        }
        let runningStream = this.streams.findRunningStream(number);
        if (runningStream) {
            runningStream.events.on('log', logFunc);
            unsubscribe = () => {
                this.logger.debug(`remove event listener log`, this.prefix, '[runningStream]')
                runningStream.events.removeListener('log', logFunc);
            }
        } else this.logger.warn(`strean number ${number} NOT found`, this.prefix, '[streamLog]')

    }
    private ttt() {

    }
    @SubscribeMessage('streamKeepalive')
    streamLogKeepalive(@MessageBody('number') number: any, @ConnectedSocket() client: Socket): any {

        this.logger.debug(`keepaliveReceived ${number}`, this.prefix)
    }

}