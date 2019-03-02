# RooWiFi hacking.

Just playing around with my Roomba.

### Notes & Observations

```es6
const ROOWIFI_HOST = '192.168.3.254'
const ROOWIFI_USER = 'admin'
const ROOWIFI_PASS = 'roombawifi'

// API specification
const RPC_ROOT = `http://${ROOWIFI_HOST}`
const TELEMETRY_URI = `${RPC_ROOT}/rwr.xml`
const RPC_URI = `${RPC_ROOT}/rwr.cgi?exec=`

// Modes
const TOGGLE_IDLE_MODE = '1' // Toggle idle mode
const TOGGLE_CLEAN_MODE = '4' // Toggle clean mode
const TOGGLE_SPOT_MODE = '5' // Toggle spot mode
const TOGGLE_DOCK_MODE = '6' // Toggle dock mode
const TOGGLE_DRIVER_MODE = 'h' // Toggle driver mode

// Movement
const TOGGLE_MOVEFORWARD = 'a' // Toggle move forward
const TOGGLE_MOVEBACKWARD = 'l' // Toggle move back

const TURN_LEFT_15 = 'b' // Turn left 15˚
const TURN_LEFT_45 = 'c' // Turn left 45˚
const TURN_LEFT_90 = 'd' // Turn left 90˚

const TURN_RIGHT_15 = 'e' // Turn right 15˚
const TURN_RIGHT_45 = 'f' // Turn right 45˚
const TURN_RIGHT_90 = 'g' // Turn right 90˚

// Cleaning
const TOGGLE_INTAKE = 'j' // Toggle intake vacuum/brush
const TOGGLE_SIDEBRUSH = 'k' // Toggle side brush

// Research
// '0' // Possible command?
// '2' // Possible command?
// '3' // Possible command?
// 'i' // Possible command?
// ... More commands?

// Looks like a bitmask
const OBSTRUCTION_NODE = 'r0'
// 0 = none
// 1 = right bumper
// 2 = left bumper
// 3 = 1 + 2 = both bumpers (front)
// 4 = right wheel
// 5 = 4 + 1 = right wheel + right bumper
// 6 = 4 + 2 = right wheel + left bumper
// 7 = 4 + 3 = right wheel + both bumpers
// 8 = left wheel
// 9 = 8 + 1 = left wheel + right bumper
// 10 = 8 + 2 = left wheel + left bumper
// 11 = 8 + 3 = left wheel + both bumpers
// 12 = 4 + 8 = both wheels
// 13 = 12 + 1 = both wheels and right bumper
// 14 = 12 + 2 = both wheels and left bumper
// 15 = 12 + 3 = both wheels and both bumpers

const WALL_SENSOR_NODE = 'r1' // Boolean

const CLIFF_LEFT_SENSOR_NODE = 'r2' // Boolean
const CLIFF_LEFT_FRONT_SENSOR_NODE = 'r3' // Boolean

const CLIFF_RIGHT_SENSOR_NODE = 'r5' // Boolean
const CLIFF_RIGHT_FRONT_SENSOR_NODE = 'r4' // Boolean

const DISTANCE_NODE = 'r12' // mm
const ANGLE_NODE = 'r13' // mm

const CHARGING_STATE_NODE = 'r14'
// 0 = discharging
// 1 = charged
// 2 = charging

const VOLTAGE_NODE = 'r15' // mV
const CURRENT_NODE = 'r16' // mA
const TEMPERATURE_NODE = 'r17' // Celsius
const CHARGE_NODE = 'r18' // mAh
const CAPACITY_NODE = 'r19' // mAh

// Research
// const VIRTUALWALL_NODE = 'r5' ?
// const M_OVER_C_NODE = 'r6' ?
// const LEFT_DIRT_SENSOR_NODE = 'r7' ?
// const RIGHT_DIRT_SENSOR_NODE = 'r8' ?
// const REMOTE_NODE = 'r9' ?
// const BUTTONS_NODE = 'r10' ?
```

lol, screw all that.
The TCP socket interface is way faster & more interesting - and there's source code for it at https://github.com/roowifi/API-Qt
