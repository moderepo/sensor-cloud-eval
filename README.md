# Sensor-Cloud-Eval

![image](https://github.com/moderepo/sensor-cloud-eval/blob/master/sceval_frontend/src/common_images/mode-logo.png)
Sensor Cloud Eval is a **TSX version** of MODE's Sensor Cloud, developed to be used as an evaluation kit by business partners and app developers. :computer:

## Contents

- [Installation](#installation)
- [Prerequisites](#prerequisites)
- [Quick start](#quick-start)
- [Mode API Reference](https://dev.tinkermode.com/docs/api/)
- [API Examples](#api-examples)
  - [Using REST Endpoints (GET, POST, PUT, PATCH, DELETE)](#using-rest-endpoints)
    - [Updating User Informaiton](#updating-user-info)
    - [Linking / Unlinking Sensor Modules => Gateway](#linking-unlinking-sensor-modules)
    - [Sending Device Commands](#sending-device-commands)
  - [Receiving Device Events (Websocket)](#receiving-device-commands)

## Installation

To begin development off MODE's sensor cloud evaluation kit, first clone the repository to your local machine.
```sh
$ git clone https://github.com/moderepo/sensor-cloud-eval.git
```

## Prerequisites

1. You will need MODE, Inc. to pre-provision the gateway(s) to your project before running the application

2. You will also need to have any sensors you wish to pair with your gateway(s) in your possession.

3. You must have an account with the [Tinkermode Console](https://console.tinkermode.com/console/signup).

4. If you don't already have npm and typescript installed, you will need to install both in order to run the application.

```sh
$ npm install -g npm
$ npm install -g typescript
```

## Quick Start

**Assuming you have met the previously mentioned prerequisites**, follow these steps to get up and running in minutes:

1. `cd` into `sceval_frontend` and run `npm i` or `npm install`. This will install the default app dependencies.

2. Run `npm start` to immediately bring up the application at http://localhost:3000.

3. Navigate to http://localhost:3000 your browser to view the running application.

## API Examples

We've listed most of the useful [endpoints](https://dev.tinkermode.com/docs/api/) useful for building applications with sensor cloud below.

```javascript
const BASEURL = 'https://api.tinkermode.com/'
```

**Endpoint**                                                             | **TYPE**                  |
-------------------------------------------------------------------------|--------------------------:|
/auth/user                                                               | POST                      |
/auth/user/passwordReset/start                                           | POST                      |
/users/{id}                                                              | GET, POST, PATCH, DELETE  |
/homes/{homeId}/members                                                  | GET, POST                 |
/homes/{homeId}/members/{userId}                                         | GET, PATCH, DELETE        |
/homes/{homeId}**                                                        | GET, POST, PATCH, DELETE  |
/homes/{homeId}/kv/{sensorModuleId}                                      | GET, POST, PUT            |  
/homes/{homeId}/smartModules/tsdb/timeSeries/{seriesID}                  | GET                       |
/devices/{deviceId}                                                      | GET, PATCH, DELETE        |
/devices/{homeId}                                                        | GET                       |  
/devices/{deviceId}/command                                              | PUT                       |
/devices/{homeId}                                                        | GET                       |
/devices/{deviceId}/kv/{sensorModuleId}                                  | GET, POST, PUT            |

### Using REST Endpoints

Below are some examples pertaining to the usage of **REST endpoints**.

#### Creating, validating, and updating user information

`/users`
To create [user](https://dev.tinkermode.com/docs/api/models.html#user) a user with an email and password, create a POST request with the following parameters:

```javascript
projectId: {project id},
email: {email},
password: {password},
name: {name}
```

`/auth/users`
To verify a user's credentials, create a POST request with the following parameters to check whether or not the user exists.

```javascript
projectId: {project id},
appId: {app id},
email: {email},
password: {password}
```

`/users/{userId}`
To update a user's name and/or password, create a PATCH request with the following parameters.

```javascript
name: {newName},
password: {newPassword}
```

#### Linking & Unlinking Sensor Modules

`/devices/{deviceId}/kv/{sensorModuleId}`
MODE stores key-value pairs in a given home to manage kinds of data, including sensor data. One can associate or disassociate sensor modules to/from a particular gateway by using a PUT or DELETE request and the following payload parameters. It's worth mentioning that the `arrayOfSensorsActive` can be used to enable/disable sensing of particular sensors within a given sensor module.

```javascript
id: {sensorModuleId},
sensing: 'on',
interval: '30',
sensors: {arrayOfSensorsActive}
```

#### Sending Device Commands

`/devices/{deviceID}/command'`
Sending commands to gateways within a project can allow the user to control the behavior of the targeted gateway. Common commands include `startDiscovery`, which puts the gateway into discovery mode for finding nearby sensor modules. Another example of this is the `listSensorModules`, which lists the sensor modules associated to that particular gateway. A action and (occassionally) a timeout parameter must be provided for this command to work. The timeout specifies how long the action will last for.

- Using the `startDiscovery` command

```javascript
action: 'startDiscovery',
parameters: { timeout: 1000 }
```

- Using the `listSensorModules` command

```javascript
action: 'listSensorModules',
parameters: { timeout: 1000 }
```

- Using the `getSensorModuleStatus` command

<!-- fill in -->

- Using the `syncClock` command

<!-- fill in -->

- Using the `getLog` command

<!-- fill in -->

### Receiving Device Events

The application receives device events in the form of a websocket message. The following information provides insight into the kinds of websocket events that can be received and used by the application.

1. `discoveredSensorModules`: Emitted after recieving the `startDiscovery` command. Contains a list of sensor modules detected by the gateway.

2. `sensorModuleList`: The gateway emits this event periodically to report its current state, or after it receives a `listSensorModules` command. This event contains information like linked sensor modules, services, homeId, and other device-related information.

3. `realtimeData`: The gateway emits this event periodically to report the current value of each active sensor on its sensor modules. The event data is formatted in the schema required by the Time Series Database.

4. `sensorModuleStatus`: The gateway emits this event after receiving the `getSensorModuleStatus` command. The event data contains information about the sensor module’s battery level and signal strength.

5. `sensorModuleClockSynced`: The gateway emits this event after it successfully executed the `syncClock` command on a sensor module. The event data includes a field called `sensorModuleId` which contains the UUID of the affected sensor module.

6. `error`: The gateway emits this event when it has problem executing a command. The event contains a field called `msg` that explains the reason of the error.

7. `sensorModuleStateChange`:

8. `sensorModuleUnregistered`:

9. `statusReport`:

10. `fastSensorData`:

11. `accelerationChangeDetected`:

12. `magneticChangeDetected`:
