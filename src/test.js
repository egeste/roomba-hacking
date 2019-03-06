import Roomba from './Roomba'

const roomba = new Roomba()
roomba.connect().then(() => {

  setTimeout(() => {
    console.log('Toggling safe mode')
    roomba.toggleSafeMode()

    setTimeout(() => {
      console.log('Setting main brush to 1')
      roomba.setMainBrush(1)

      setTimeout(() => {
        console.log('Setting main brush to 0')
        roomba.setMainBrush(0)

        console.log('Setting side brush to 1')
        roomba.setSideBrush(1)

        setTimeout(() => {
          console.log('Setting side brush to 0')
          roomba.setSideBrush(0)
        }, 1000)
      }, 1000)
    }, 1000)
  }, 1000)

  // Add handler for graceful shutdown
  const cleanupRoomba = () => {
    roomba.disconnect().then(() => {
      console.info('Roomba disconnected')
    })
  }

  process.on('SIGINT', cleanupRoomba)
  process.on('SIGTERM', cleanupRoomba)
})
