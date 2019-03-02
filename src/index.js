import Roomba from './Roomba'

const roomba = new Roomba()

const onShutdown = () => {
  console.warn('Shutting down socket.')
  roomba.disconnect().then(() => {
    console.log('Socket closed.')
    process.exit(0)
  })
}

roomba.on('telemetry', telemetry => console.log({ telemetry }))

roomba.connect().then(() => {
  roomba.startSpammingTelemetry()
})

process.on('SIGINT', onShutdown)
process.on('SIGTERM', onShutdown)
