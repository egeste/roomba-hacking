import debounce from 'lodash/debounce'
import EventEmitter from 'events'
import TwosComplementBuffer from 'twos-complement-buffer'

import { Socket } from 'net'
import { scaleQuantize, scaleLinear } from 'd3-scale'

// Timeouts & intervals
export const TCP_SESSION_TIMEOUT = (1000 * 30) // 30 sec
export const TELEMETRY_POLLING_INTERVAL = (1000 / 20) // One/nth of a second

// TCP defaults
export const ROOWIFI_DEFAULT_HOST = '10.0.0.2'
export const ROOWIFI_DEFAULT_PORT = '9001'

// Message packet types
export const STREAM_RESPONSE_PACKET = 19
export const VIRTUAL_WALL_PACKET = 13

// Commands
export const COMMAND_SAFE = 131
export const COMMAND_SPOT = 134
export const COMMAND_CLEAN = 135
export const COMMAND_DOCK = 143
export const COMMAND_MOTORS_PWM = 144
export const COMMAND_DRIVE_PWM = 146
export const COMMAND_STREAM = 148

// Util
export const twosComplementBuffer = new TwosComplementBuffer(16, true)
export const sixteenBitSignedInteger = value => {
  const buffer = []
  twosComplementBuffer.pack(buffer, value)
  return buffer
}

// Scalars
export const drivePWMScalar = scaleQuantize()
  .domain([ -1, 1 ])
  .range([ -127, -64, -32, -16, 0, 0, 0, 0, 0, 0, 0, 16, 32, 64, 127 ])

export const brushScalar = scaleLinear()
  .domain([ -1, 1 ])
  .range([ -127, 127 ])

export const vacuumScalar = scaleLinear()
  .domain([ 0, 1 ])
  .range([ 0, 127 ])

export default class Roomba extends EventEmitter {

  constructor(...args) {
    super(...args)

    this.socket = new Socket()
    this.socket.setTimeout(TCP_SESSION_TIMEOUT)

    // Event handlers
    this.socket.on('timeout', () => this.resetConnection())
    this.socket.on('close', error => console.error(error))
    this.socket.on('error', error => console.error(error.message))
    // this.socket.on('data', this.onSocketData.bind(this))

    // State machines
    this.vacuumSpeed = 0
    this.mainBrushSpeed = 0
    this.sideBrushSpeed = 0
    this.sendMotorBytes = debounce(this.sendMotorBytes.bind(this))
  }

  connect() {
    return new Promise((resolve, reject) => {
      const host = process.env.ROOWIFI_HOST || ROOWIFI_DEFAULT_HOST
      const port = process.env.ROOWIFI_PORT || ROOWIFI_DEFAULT_PORT

      console.info('Connect socket', host, port)

      this.socket.connect({ host, port }, () => {
        console.info('Connect socket success')
        resolve(this.socket)
      })
    })
  }

  resetConnection() {
    if (this.resetTimeout) return
    console.info('Reconnecting...')
    this.resetTimeout = setTimeout(() => {
      delete this.resetTimeout
      this.connect()
    }, 1000)
  }

  disconnect() {
    return new Promise(resolve => {
      if (this.socket.pending) return resolve(this.socket)
      this.socket.end(undefined, undefined, () => {
        console.info('End socket')
        resolve(this.socket.destroy().unref())
      })
    })
  }

  sendBytes(byteArray) {
    if (this.socket.pending) {
      console.warn('Cannot sendBytes on pending socket')
      return Promise.resolve(this.socket)
    }

    return new Promise(resolve => {
      return this.socket.write(Buffer.from(byteArray), () => {
        return resolve(this.socket)
      })
    })
  }

  toggleSafeMode() {
    console.info('toggleSafeMode')
    return this.sendBytes([ COMMAND_SAFE, 0 ])
      .then(() => console.info('toggleSafeMode success'))
  }

  toggleCleaningMode() {
    console.info('toggleCleaningMode')
    return this.sendBytes([ COMMAND_CLEAN, 0 ])
      .then(() => console.info('toggleCleaningMode success'))
  }

  toggleSpotMode() {
    console.info('toggleSpotMode')
    return this.sendBytes([ COMMAND_SPOT, 0 ])
      .then(() => console.info('toggleSpotMode success'))
  }

  toggleDockMode() {
    console.info('toggleDockMode')
    return this.sendBytes([ COMMAND_DOCK, 0 ])
      .then(() => console.info('toggleDockMode success'))
  }

  toggleMainBrush() {
    this.setMainBrush((this.mainBrushSpeed === 0) ? 127 : 0)
  }

  toggleSideBrush() {
    this.setSideBrush((this.sideBrushSpeed === 0) ? 127 : 0)
  }

  toggleVacuum() {
    this.setVacuum((this.vacuumSpeed === 0) ? 127 : 0)
  }

  setMainBrush(velocityFloat) {
    this.mainBrushSpeed = brushScalar(velocityFloat)
    this.sendMotorBytes()
  }

  setSideBrush(velocityFloat) {
    this.sideBrushSpeed = brushScalar(velocityFloat)
    this.sendMotorBytes()
  }

  setVacuum(velocityFloat) {
    this.vacuumSpeed = vacuumScalar(velocityFloat)
    this.sendMotorBytes()
  }

  sendMotorBytes() {
    return this.sendBytes([
      COMMAND_MOTORS_PWM,
      this.mainBrushSpeed,
      this.sideBrushSpeed,
      this.vacuumSpeed,
      0
    ])
  }

  drivePWM(leftWheelVelocityFloat, rightWheelVelocityFloat) {
    const leftWheelVelocity = drivePWMScalar(leftWheelVelocityFloat)
    const rightWheelVelocity = drivePWMScalar(rightWheelVelocityFloat)
    this.sendBytes([
      COMMAND_DRIVE_PWM,
      ...sixteenBitSignedInteger(rightWheelVelocity),
      ...sixteenBitSignedInteger(leftWheelVelocity),
      0
    ])
  }

  // toggleStreamMode(packets = []) {
  //   console.info('toggleStreamMode')
  //   return this.sendBytes([ COMMAND_STREAM, 1, VIRTUAL_WALL_PACKET, 0 ])
  //     .then(() => console.info('toggleStreamMode success'))
  // }

  // onSocketData(packet) {
  //   console.log(packet)
  //   // const packetType = packet.slice(0, 1).toString().charCodeAt(0)
  //   // switch(packetType) {
  //   //   case STREAM_RESPONSE_PACKET: return this.onStreamData(packet)
  //   // }
  // }

  // onStreamData(packet) {
  //   console.log(packet)
  // }

}
