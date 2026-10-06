// MCP legacy-SSE 会话中继：Pages Functions 按请求调度 isolate，不能共享内存；
// 以 sessionId 为 DO 名强制同对象路由 —— POST /push 入队，SSE /stream 轮询出队，毫秒级可靠。
export class McpSession {
  constructor(state) {
    this.state = state
    this.queue = []
  }

  async fetch(request) {
    const url = new URL(request.url)
    if (url.pathname === '/push') {
      this.queue.push(await request.text())
      return new Response('ok')
    }
    const sid = url.searchParams.get('sid') || ''
    const enc = new TextEncoder()
    const queue = this.queue
    let poll
    let ka
    const stream = new ReadableStream({
      start(controller) {
        controller.enqueue(enc.encode(`event: endpoint\ndata: /mcp/messages?sessionId=${sid}\n\n`))
        poll = setInterval(() => {
          try {
            while (queue.length) {
              controller.enqueue(enc.encode(`event: message\ndata: ${queue.shift()}\n\n`))
            }
          } catch {
            /* 流已关 */
          }
        }, 400)
        ka = setInterval(() => {
          try {
            controller.enqueue(enc.encode(':ka\n\n'))
          } catch {
            /* noop */
          }
        }, 20000)
      },
      cancel() {
        clearInterval(poll)
        clearInterval(ka)
      }
    })
    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache'
      }
    })
  }
}

export default {
  fetch() {
    return new Response('codecv-mcp-do')
  }
}
