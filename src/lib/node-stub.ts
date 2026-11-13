/**
 * Inert stand-ins for node:http / https / net in the browser build. kaput reads
 * `http.createServer` and `net.Server.prototype.listen` when it is imported
 * (to patch them later for auto-detection, which the shim keeps off).
 */
class Server {
  listen() {}
}
const createServer = () => undefined
export { createServer, Server }
export default { createServer, Server }
