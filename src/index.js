import throttle from 'lodash/throttle'
import dualShock from 'dualshock-controller'
import { scaleLinear } from 'd3-scale'

import Roomba, {
  VIRTUAL_WALL_PACKET
} from './Roomba'

console.info('Initializing controller')
const controller = dualShock({
  config: 'dualshock4-generic-driver',
  analogStickSmoothing : true,
  accelerometerSmoothing : true
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

const analogYFloatScalar = scaleLinear()
  .domain([ 0, 255 ])
  .range([ 1, -1 ])

const roomba = new Roomba()
roomba.connect().then(() => {
  // Add handler for graceful shutdown
  const cleanupRoomba = () => {
    roomba.disconnect().then(() => {
      console.info('Roomba disconnected')
    })
  }

  process.on('SIGINT', cleanupRoomba)
  process.on('SIGTERM', cleanupRoomba)

  // // Start the data stream
  // roomba.toggleStreamMode([
  //   VIRTUAL_WALL_PACKET
  // ])

  // Finally, bind up all of our stuff
  controller.on('psxButton:press', () => roomba.toggleDockMode())

  // dpad buttons
  controller.on('dpadUp:press', () => roomba.toggleSafeMode())
  controller.on('dpadDown:press', () => roomba.toggleCleaningMode())
  controller.on('dpadRight:press', () => roomba.toggleSpotMode())

  // Analog controllers
  const wheelSpeed = { left: 0, right: 0 }

  controller.on('left:move', ({ y }) => {
    wheelSpeed.left = analogYFloatScalar(y)
    roomba.drivePWM(wheelSpeed.left, wheelSpeed.right)
  })

  controller.on('right:move', ({ y }) => {
    wheelSpeed.right = analogYFloatScalar(y)
    roomba.drivePWM(wheelSpeed.left, wheelSpeed.right)
  })

  // roomba.toggleSafeMode()
    // .then(() => roomba.drive(1, 0))
    // .then(() => roomba.disconnect())
    // .then(() => process.exit(0))
})

// controller.on('left:move', data => console.log('left Moved: ' + data.x + ' | ' + data.y))
// controller.on('right:move', data => console.log('right Moved: ' + data.x + ' | ' + data.y))
// controller.on('square:press', ()=> console.log('square press'))
// controller.on('square:release', () => console.log('square release'))


