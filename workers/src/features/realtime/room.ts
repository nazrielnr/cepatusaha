export class RealtimeRoom {
  private sockets = new Set<WebSocket>()

  async fetch(request: Request): Promise<Response> {
    if (request.headers.get('Upgrade') !== 'websocket') return new Response('Expected websocket', { status: 426 })
    const pair = new WebSocketPair()
    const [client, server] = Object.values(pair)
    server.accept()
    this.sockets.add(server)
    server.addEventListener('message', (event) => this.broadcast(String(event.data), server))
    server.addEventListener('close', () => this.sockets.delete(server))
    server.addEventListener('error', () => this.sockets.delete(server))
    return new Response(null, { status: 101, webSocket: client })
  }

  private broadcast(message: string, sender: WebSocket) {
    for (const socket of this.sockets) {
      if (socket !== sender && socket.readyState === WebSocket.OPEN) socket.send(message)
    }
  }
}
