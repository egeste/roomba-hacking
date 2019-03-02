import { Socket } from 'net'
import EventEmitter from 'events'

export const TCP_SESSION_TIMEOUT = (1000 * 30) // 30 sec
export const TELEMETRY_POLLING_INTERVAL = (1000 / 20) // One/nth of a second

export const ROOWIFI_DEFAULT_HOST = '10.0.0.2'
export const ROOWIFI_DEFAULT_PORT = '9001'

// Number of sensors in SCI specification
export const SCI_NUMBER_OF_SENSORS = 26

// Byte postion for each sensor in response frame
export const BUMPWHEELDROPS_SENSOR = 0
export const WALL_SENSOR = 1
export const CLIFFT_LEFT_SENSOR = 2
export const CLIFFT_FRONT_LEFT_SENSOR = 3
export const CLIFFT_FRONT_RIGHT_SENSOR = 4
export const CLIFFT_RIGHT_SENSOR = 5
export const VIRTUAL_WALL_SENSOR = 6
export const MOTOR_OVERCURRENTS_SENSOR = 7
export const DIRT_DETECTOR_LEFT_SENSOR = 8
export const DIRT_DETECTOR_RIGHT_SENSOR = 9
export const REMOTE_OPCODE_SENSOR = 10
export const BUTTONS_SENSOR = 11
export const DISTANCE_MSB_SENSOR = 12
export const DISTANCE_LSB_SENSOR = 13
export const ANGLE_MSB_SENSOR = 14
export const ANGLE_LSB_SENSOR = 15
export const CHARGING_STATE_SENSOR = 16
export const VOLTAGE_MSB_SENSOR = 17
export const VOLTAGE_LSB_SENSOR = 18
export const CURRENT_MSB_SENSOR = 19
export const CURRENT_LSB_SENSOR = 20
export const TEMPERATURE_SENSOR = 21
export const CHARGE_MSB_SENSOR = 22
export const CHARGE_LSB_SENSOR = 23
export const CAPACITY_MSB_SENSOR = 24
export const CAPACITY_LSB_SENSOR = 25

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
export const LED_STATUS_AMBAR = 0x30
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
  [BUMPWHEELDROPS_SENSOR]: decimalFromBuffer,
  [WALL_SENSOR]: booleanFromBuffer,
  [CLIFFT_LEFT_SENSOR]: booleanFromBuffer,
  [CLIFFT_FRONT_LEFT_SENSOR]: booleanFromBuffer,
  [CLIFFT_FRONT_RIGHT_SENSOR]: booleanFromBuffer,
  [CLIFFT_RIGHT_SENSOR]: booleanFromBuffer,
  [VIRTUAL_WALL_SENSOR]: booleanFromBuffer,
  [MOTOR_OVERCURRENTS_SENSOR]: stringFromBuffer,
  [DIRT_DETECTOR_LEFT_SENSOR]: stringFromBuffer,
  [DIRT_DETECTOR_RIGHT_SENSOR]: stringFromBuffer,
  [REMOTE_OPCODE_SENSOR]: stringFromBuffer,
  [BUTTONS_SENSOR]: stringFromBuffer,
  [DISTANCE_MSB_SENSOR]: decimalFromBuffer,
  [DISTANCE_LSB_SENSOR]: decimalFromBuffer,
  [ANGLE_MSB_SENSOR]: decimalFromBuffer,
  [ANGLE_LSB_SENSOR]: decimalFromBuffer,
  [CHARGING_STATE_SENSOR]: decimalFromBuffer,
  [VOLTAGE_MSB_SENSOR]: decimalFromBuffer,
  [VOLTAGE_LSB_SENSOR]: decimalFromBuffer,
  [CURRENT_MSB_SENSOR]: decimalFromBuffer,
  [CURRENT_LSB_SENSOR]: decimalFromBuffer,
  [TEMPERATURE_SENSOR]: decimalFromBuffer,
  [CHARGE_MSB_SENSOR]: decimalFromBuffer,
  [CHARGE_LSB_SENSOR]: decimalFromBuffer,
  [CAPACITY_MSB_SENSOR]: decimalFromBuffer,
  [CAPACITY_LSB_SENSOR]: decimalFromBuffer
}

export default class Roomba extends EventEmitter {

  constructor(...args) {
    super(...args)

    this.socket = new Socket()
    this.socket.setTimeout(TCP_SESSION_TIMEOUT)

    // Event handlers
    this.ready = false
    this.socket.on('timeout', () => this.connect())

    this.spammingTelemetry = false
    this.socket.on('data', (...args) => this.onSocketData(...args))
    this.telemetry = {}
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

  disconnect() {
    this.stopSpammingTelemetry()
    return new Promise(resolve => {
      this.socket.end(undefined, undefined, () => {
        console.info('End socket')
        resolve(this.socket.destroy())
      })
    })
  }

  requestTelemetry() {
    return new Promise((resolve, reject) => {
      if (this.socket.pending) {
        console.warn('Requested telemetry on pending socket')
        return reject(this.socket)
      }

      this.socket.write(Buffer.from([
        COMMAND_SENSORS, 0
      ]), () => resolve(this.socket))
    })
  }

  onSocketData(dataBuffer) {
    if (dataBuffer.length != SCI_NUMBER_OF_SENSORS) return

    const sensors = Object.keys(SENSOR_BUFFER_FORMATTERS)
    this.telemetry = sensors.reduce((memo, sensor) => {
      const sensorFormatter = SENSOR_BUFFER_FORMATTERS[sensor]
      return { ...memo, [sensor]: sensorFormatter(dataBuffer, parseInt(sensor)) }
    }, {})

    this.emit('telemetry', this.telemetry)
  }

  startSpammingTelemetry() {
    if (!this.spammingTelemetryTimeout) {
      console.info('Start telemetry spamming')
      this.spammingTelemetryTimeout = setInterval(() => {
        this.requestTelemetry()
      }, TELEMETRY_POLLING_INTERVAL)
    }

    return this
  }

  stopSpammingTelemetry() {
    if (this.spammingTelemetryTimeout) {
      console.info('Stop telemetry spamming')
      clearTimeout(this.spammingTelemetryTimeout)
      delete this.spammingTelemetryTimeout
    }

    return this
  }

}
