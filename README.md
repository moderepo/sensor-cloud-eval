<img align="right" src="https://github.com/moderepo/sensor-cloud-eval/blob/master/sceval_frontend/src/common_images/mode-logo.png">

# Sensor-Cloud-Eval

Sensor Cloud Eval is a **TSX version** of MODE's Sensor Cloud, developed to be used as an evaluation kit by business partners and app developers. The codebase outlines the latest SPA development design from React / Typescript, including Context and flux-style data flow, Hooks, Websockets, and more.

## Contents

- [Features](#features)
- [Installation and Setup](#installation-and-setup)
- [Prerequisites](#prerequisites)
- [Quick start](#quick-start)
- [Mode API Reference](https://dev.tinkermode.com/docs/api/)
- [App Navigation](#app-navigation)
  -[Link and Unlink Sensor Modules to and from a Gateway](#link-and-unlink-sensor-modules-to-and-from-a-gateway)
  -[Viewing and Manipulating the Sensor Module](#viewing-and-manipulating-the-sensor-module)
- [API Examples](#api-examples)
  - [Using REST Endpoints (GET, POST, PUT, PATCH, DELETE)](#using-rest-endpoints)
    - [Handling User Information](#handling-user-information)
    - [Linking / Unlinking Sensor Modules](#linking-and-unlinking-sensor-modules)
    - [Sending Device Commands](#sending-device-commands)
  - [Receiving Device Events (Websocket)](#receiving-device-events)
- [Links](#links)

## Features

- Management of sensor modules and their device associations from within the application. :electric_plug:

- Ability to view real-time sensor data in multiple sensor modules across multiple devices. :chart_with_upwards_trend:

- Ability to view time-series sensor data and toggle between various time-horizons as well as sensing intervals. :clock10:

- Configuration of sensor module sensing and general settings. :arrows_counterclockwise:

## Installation and Setup

To begin development off MODE's sensor cloud evaluation kit, first clone the repository to your local machine.
```sh
$ git clone https://github.com/moderepo/sensor-cloud-eval.git
```

## Prerequisites

1. You will need MODE, Inc. to pre-provision the gateway(s) to your project before running the application

2. You will also need to have any sensors you wish to pair with your gateway(s) in your possession.

3. You must have an account with the [Tinkermode Console](https://console.tinkermode.com/console/signup).

4. If you don't already have npm and typescript installed, you will need to install both in order to run the application. You will also need at least `Node 8.16.0` or `Node 10.16.0` or later version on your local development machine. If you don't already have node, please navigate [here](https://nodejs.org/en/download/) to download the source code compatible with your machine.

```sh
$ npm install -g npm
$ npm install -g typescript
$ npm install -g node
```

## Quick Start

**Assuming you have met the previously mentioned prerequisites**, follow these steps to get up and running in minutes:

1. Create a `.env` file with the `REACT_APP_API_KEY` and `REACT_APP_PROJECT_ID` variables associated with your project.

2. `cd` into `sceval_frontend` and run `npm i` or `npm install`. This will install the default app dependencies.

3. Run `npm start` to immediately bring up the application at http://localhost:3000.

4. Navigate to http://localhost:3000 your browser to view the running application.

## App Navigation

### Link and Unlink Sensor Modules to and from a Gateway

Linking and unlinking sensor modules to and from a gateway is simple. Assuming you have the sensor module(s) on hand, make sure they are within 5 feet of the gateway, and press the start scanning button.

<img src="https://github.com/moderepo/sensor-cloud-eval/blob/app/readme/sceval_frontend/src/common_images/screenshots/add_sensor_instructions.png" alt="Size Limit CLI" width="738">

Once you press the start scanning button, the device will go into `discovery mode` and begin looking for sensors either available to connect via Bluetooth or USB.

<img src="https://github.com/moderepo/sensor-cloud-eval/blob/app/readme/sceval_frontend/src/common_images/screenshots/add_sensor_modules.png" alt="Size Limit CLI" width="738">

If the gateway discovers any sensor modules `currently not paired` to itself or any other gateways, they will be listed in the format below. Selecting any available module will allow you to add the sensor module to your desired gateway.

<img src="https://github.com/moderepo/sensor-cloud-eval/blob/app/readme/sceval_frontend/src/common_images/screenshots/sensor_modules_discovered.png" alt="Size Limit CLI" width="738">

In the gateway view, you will be able to see all sensor module(s) associated with your gateway(s). To unlink a particular sensor module from the gateway, click the settings icon and then press the `Unlink Sensor Modules` button that appears.

<img src="https://github.com/moderepo/sensor-cloud-eval/blob/app/readme/sceval_frontend/src/common_images/screenshots/toggle_gateway_settings.png" alt="Size Limit CLI" width="738">

After selecting the `Unlink Sensor Modules` button, the gateway will go into edit mode. It's worth mentioning you can put multiple gateways in edit mode.

<img src="https://github.com/moderepo/sensor-cloud-eval/blob/app/readme/sceval_frontend/src/common_images/screenshots/gateway_edit_mode.png" alt="Size Limit CLI" width="738">

Selecting a particular sensor module in this mode will trigger a unlink confirmation of the selected module, and clicking okay will disassociate it from the gateway.

<img src="https://github.com/moderepo/sensor-cloud-eval/blob/app/readme/sceval_frontend/src/common_images/screenshots/confirm_unlink.png" alt="Size Limit CLI" width="738">

Clicking on a sensor module in a gateway that is not in `edit mode` will show sensor module details. This page contains real-time data, time-series graphs, adjustments, and the general settings of the sensor module.

<img src="https://github.com/moderepo/sensor-cloud-eval/blob/app/readme/sceval_frontend/src/common_images/screenshots/sensor_module.png" alt="Size Limit CLI" width="738">

Clicking the settings icon and then clicking the `Edit Settings` button will display the sensor module settings, including the name of the module and the currently active sensors. To modify this, edit the name and select or deselect sensors to activate or inactive the sensors respectively.

<img src="https://github.com/moderepo/sensor-cloud-eval/blob/app/readme/sceval_frontend/src/common_images/screenshots/sensor_module_settings.png" alt="Size Limit CLI" width="738">

The active sensor time-series graphs and real-time data will be updated accordingly.

## Viewing and Manipulating the Sensor Module

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
/homes/{homeId}                                                          | GET, POST, PATCH, DELETE  |
/homes/{homeId}/kv/{sensorModuleId}                                      | GET, POST, PUT            |  
/homes/{homeId}/smartModules/tsdb/timeSeries/{seriesID}                  | GET                       |
/devices/{deviceId}                                                      | GET, PATCH, DELETE        |
/devices/{homeId}                                                        | GET                       |  
/devices/{deviceId}/command                                              | PUT                       |
/devices/{homeId}                                                        | GET                       |
/devices/{deviceId}/kv/{sensorModuleId}                                  | GET, POST, PUT            |

### Using REST Endpoints

Below are some examples pertaining to the usage of **REST endpoints**.

#### Handling User Information

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

#### Linking and Unlinking Sensor Modules

`/devices/{deviceId}/kv/{sensorModuleId}`  
MODE stores key-value pairs in a given home to manage kinds of data, including sensor data. One can associate or disassociate sensor modules to/from a particular gateway by using a PUT or DELETE request and the following payload parameters. It's worth mentioning that the `arrayOfSensorsActive` can be used to enable/disable sensing of particular sensors within a given sensor module.

```javascript
id: {sensorModuleId},
sensing: 'on',
interval: '30',
sensors: {arrayOfSensorsActive}
```

#### Sending Device Commands

`/devices/{deviceID}/command`  
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

```javascript
action: 'getSensorModuleStatus',
parameters: { sensorId: {sensorId} }
```

- Using the `syncClock` command

```javascript
action: 'syncClock',
parameters: { sensorId: {sensorId} }
```

- Using the `getLog` command

```javascript
action: 'getLog',
parameters: { sensorId: {sensorId} }
```

### Receiving Device Events

The application receives device events in the form of a websocket message. The following information provides insight into the kinds of websocket events that can be received and used by the application.

1. `discoveredSensorModules`: Emitted after recieving the `startDiscovery` command. Contains a list of sensor modules detected by the gateway.

2. `sensorModuleList`: The gateway emits this event periodically to report its current state, or after it receives a `listSensorModules` command. This event contains information like linked sensor modules, services, homeId, and other device-related information.

3. `realtimeData`: The gateway emits this event periodically to report the current value of each active sensor on its sensor modules. The event data is formatted in the schema required by the Time Series Database.

4. `sensorModuleStatus`: The gateway emits this event after receiving the `getSensorModuleStatus` command. The event data contains information about the sensor module’s battery level and signal strength.

5. `sensorModuleClockSynced`: The gateway emits this event after it successfully executed the `syncClock` command on a sensor module. The event data includes a field called `sensorModuleId` which contains the UUID of the affected sensor module.

6. `error`: The gateway emits this event when it has problem executing a command. The event contains a field called `msg` that explains the reason of the error.

7. `sensorModuleStateChange`: The gateway emits this event whenever a sensor module changes its connection state and/or sensing state.

## Links

* [Corp Site](https://www.tinkermode.com/)
* [Developer Site](https://dev.tinkermode.com/)
* [Developer Docs](https://dev.tinkermode.com/docs/)
* [Tinkermode Console](https://console.tinkermode.com/console/login)
* [SCEVAL Source Code](https://github.com/moderepo/sensor-cloud-eval)