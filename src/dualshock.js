import throttle from 'lodash/throttle'
import dualShock from 'dualshock-controller'
import { scaleLinear } from 'd3-scale'

import Roomba, {
  drivePWMScalar,
  VIRTUAL_WALL_PACKET
} from './Roomba'

const SMOOTHING_COUNT = 256

const analogYFloatScalar = scaleLinear()
  .domain([ 0, 255 ])
  .range([ 1, -1 ])

console.info('Initializing controller')
const controller = dualShock({
  config: 'dualshock4',
  analogStickSmoothing : true, // these are crap.
  accelerometerSmoothing : true // these are crap.
})

controller.on('error', error => {
  console.error('Controller error', error)
})

// Add handler for graceful shutdown
const cleanupController = () => {
  controller.disconnect()
  console.info('Controller disconnected')
}

process.on('SIGINT', cleanupController)
process.on('SIGTERM', cleanupController)

const roomba = new Roomba()
roomba.connect().then(() => {

  // Finally, bind up all of our stuff
  controller.on('psxButton:press', () => roomba.toggleDockMode())

  // dpad buttons
  controller.on('dpadUp:press', () => roomba.toggleSafeMode())
  controller.on('dpadDown:press', () => roomba.toggleCleaningMode())
  controller.on('dpadRight:press', () => roomba.toggleSpotMode())

  // Analog controllers
  const analogInputs = { left: [0], right: [0] }

  // Push the input data into our input buffer
  controller.on('left:move', ({ y }) => {
    analogInputs.left = [ ...analogInputs.left, analogYFloatScalar(y) ]
    setTimeout((() => {
      analogInputs.left.shift()
      if (analogInputs.left.length > SMOOTHING_COUNT) {
        analogInputs.left.splice(0, (analogInputs.left.length - SMOOTHING_COUNT))
      }
    }), 5)
  })

  controller.on('right:move', ({ y }) => {
    analogInputs.right = [ ...analogInputs.right, analogYFloatScalar(y) ]
    setTimeout((() => {
      analogInputs.right.shift()
      if (analogInputs.right.length > SMOOTHING_COUNT) {
        analogInputs.right.splice(0, (analogInputs.right.length - SMOOTHING_COUNT))
      }
    }), 5)
  })

  const driveCommandInterval = setInterval(() => {
    const { left, right } = analogInputs
    const smoothLeft = (left.length ? (left.reduce((a, b) => (a + b)) / left.length) : 0)
    const smoothRight = (right.length ? (right.reduce((a, b) => (a + b)) / right.length) : 0)
    roomba.drivePWM(smoothLeft, smoothRight)
  }, 50)

  // Add handler for graceful shutdown
  const cleanupRoomba = () => {
    clearTimeout(driveCommandInterval)
    roomba.disconnect().then(() => {
      console.info('Roomba disconnected')
    })
  }

  process.on('SIGINT', cleanupRoomba)
  process.on('SIGTERM', cleanupRoomba)
})
