import EventEmitter from 'events'

import { Socket } from 'net'
import { scaleLinear } from 'd3-scale'

export const TCP_SESSION_TIMEOUT = (1000 * 30) // 30 sec
export const TELEMETRY_POLLING_INTERVAL = (1000 / 20) // One/nth of a second

export const ROOWIFI_DEFAULT_HOST = '10.0.0.2'
export const ROOWIFI_DEFAULT_PORT = '9001'

// Message packet types
export const STREAM_RESPONSE_PACKET = 19
export const VIRTUAL_WALL_PACKET = 13

// Battery Charging States
export const CHARGING_STATE_NO_CHARGING = 0
export const CHARGING_STATE_CHARGING_RECOVERY = 1
export const CHARGING_STATE_CHARGING = 2
export const CHARGING_STATE_TRICKLE_CHAGING = 3
export const CHARGING_STATE_WAITING = 4
export const CHARGING_STATE_CHARGING_ERROR = 5

// Commands
export const COMMAND_SAFE = 131
export const COMMAND_FULL = 132
export const COMMAND_POWER = 133
export const COMMAND_SPOT = 134
export const COMMAND_CLEAN = 135
export const COMMAND_MAX = 136
export const COMMAND_DRIVE = 137
export const COMMAND_MOTORS = 138
export const COMMAND_LEDS = 139
export const COMMAND_SONG = 140
export const COMMAND_PLAY = 141
export const COMMAND_SENSORS = 142
export const COMMAND_DOCK = 143
export const COMMAND_STREAM = 148

// Number of parameters of Led commands
export const LEDS_NUM_PARAMETERS = 3

// Song note duration
export const NOTE_DURATION_SIXTEENTH_NOTE = 16
export const NOTE_DURATION_EIGHTH_NOTE = 32
export const NOTE_DURATION_QUARTER_NOTE = 64

// Led Control MASKS
export const LED_CLEAN_ON = 0x04
export const LED_CLEAN_OFF = 0xFB
export const LED_SPOT_ON = 0x08
export const LED_SPOT_OFF = 0xF7
export const LED_DIRT_ON = 0x01
export const LED_DIRT_OFF = 0xFE
export const LED_MAX_ON = 0x02
export const LED_MAX_OFF = 0xFD
export const LED_STATUS_OFF = 0x0F
export const LED_STATUS_AMBER = 0x30
export const LED_STATUS_RED = 0x10
export const LED_STATUS_GREEN = 0x20

// Cleaning Motors Control MASKS
export const SIDE_BRUSH_ON = 0x01
export const SIDE_BRUSH_OFF = 0xFE
export const VACUUM_ON = 0x02
export const VACUUM_OFF = 0xFD
export const MAIN_BRUSH_ON = 0x04
export const MAIN_BRUSH_OFF = 0xFB
export const ALL_CLEANING_MOTORS_ON = 0xFF
export const ALL_CLEANING_MOTORS_OFF = 0x00

export const sixteenBitSignedInteger = value => {
  const hexValue = (`0000${(value).toString(16)}`).substr(-4)
  const msBit = parseInt(hexValue.slice(0, 2), 16)
  const lsBit = parseInt(hexValue.slice(2, 4), 16)
  return [ msBit, lsBit ]
}

export const stringFromBuffer = (buffer, offset, bytes = 1) => {
  return buffer.slice(offset, (offset + bytes)).toString()
}

export const decimalFromBuffer = (buffer, offset, bytes = 1) => {
  return buffer.readUIntBE(offset, bytes)
}

export const booleanFromBuffer = (buffer, offset, bytes = 1) => {
  return Boolean(decimalFromBuffer(buffer, offset, bytes))
}

export const SENSOR_BUFFER_FORMATTERS = {
  [WALL_SENSOR]: booleanFromBuffer,
  [BUTTONS_SENSOR]: stringFromBuffer,
  [ANGLE_MSB_SENSOR]: decimalFromBuffer,
  [ANGLE_LSB_SENSOR]: decimalFromBuffer,
  [CHARGE_MSB_SENSOR]: decimalFromBuffer,
  [CHARGE_LSB_SENSOR]: decimalFromBuffer,
  [VOLTAGE_MSB_SENSOR]: decimalFromBuffer,
  [VOLTAGE_LSB_SENSOR]: decimalFromBuffer,
  [CURRENT_MSB_SENSOR]: decimalFromBuffer,
  [CURRENT_LSB_SENSOR]: decimalFromBuffer,
  [TEMPERATURE_SENSOR]: decimalFromBuffer,
  [CLIFFT_LEFT_SENSOR]: booleanFromBuffer,
  [CAPACITY_MSB_SENSOR]: decimalFromBuffer,
  [CAPACITY_LSB_SENSOR]: decimalFromBuffer,
  [CLIFFT_RIGHT_SENSOR]: booleanFromBuffer,
  [VIRTUAL_WALL_SENSOR]: booleanFromBuffer,
  [DISTANCE_MSB_SENSOR]: decimalFromBuffer,
  [DISTANCE_LSB_SENSOR]: decimalFromBuffer,
  [REMOTE_OPCODE_SENSOR]: stringFromBuffer,
  [BUMPWHEELDROPS_SENSOR]: decimalFromBuffer,
  [CHARGING_STATE_SENSOR]: decimalFromBuffer,
  [CLIFFT_FRONT_LEFT_SENSOR]: booleanFromBuffer,
  [CLIFFT_FRONT_RIGHT_SENSOR]: booleanFromBuffer,
  [MOTOR_OVERCURRENTS_SENSOR]: stringFromBuffer,
  [DIRT_DETECTOR_LEFT_SENSOR]: stringFromBuffer,
  [DIRT_DETECTOR_RIGHT_SENSOR]: stringFromBuffer
}

export default class Roomba extends EventEmitter {

  constructor(...args) {
    super(...args)

    this.socket = new Socket()
    this.socket.setTimeout(TCP_SESSION_TIMEOUT)

    // Event handlers
    this.socket.on('data', this.onSocketData.bind(this))
    this.socket.on('timeout', () => this.resetConnection())
    this.socket.on('close', error => console.error(error))
    this.socket.on('error', error => console.error(error.message))
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

  toggleStreamMode(packets = []) {
    console.info('toggleStreamMode')
    return this.sendBytes([ COMMAND_STREAM, 1, VIRTUAL_WALL_PACKET, 0 ])
      .then(() => console.info('toggleStreamMode success'))
  }

  onSocketData(packet) {
    console.log(packet)
    // const packetType = packet.slice(0, 1).toString().charCodeAt(0)
    // switch(packetType) {
    //   case STREAM_RESPONSE_PACKET: return this.onStreamData(packet)
    // }
  }

  onStreamData(packet) {
    console.log(packet)
  }

}
