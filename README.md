# Sensor-Cloud-Eval 

![image](https://github.com/moderepo/sensor-cloud-eval/blob/master/sceval_frontend/src/common_images/mode-logo.png)
Sensor Cloud Eval is a TSX version of MODE's Sensor Cloud, developed to be used as an evaluation kit by business partners and app developers. :computer:

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

Assuming you have met the previously mentioned prerequisites, follow these steps to get up and running in minutes:

1. `cd` into `sceval_frontend` and run `npm i` or `npm install`. This will install the default app dependencies.

2. Run `npm start` to immediately bring up the application at http://localhost:3000.

3. Navigate to http://localhost:3000 your browser to view the running application.

## API Examples

We've listed most of the useful [endpoints](https://dev.tinkermode.com/docs/api/) useful for building applications with sensor cloud below.

```javascript
const BASEURL = 'https://api.tinkermode.com/'
```

Endpoint                                                                 | TYPE                      |
-------------------------------------------------------------------------|--------------------------:|
**/auth/user**                                                           | POST                      |
**/auth/user/passwordReset/start**                                       | POST                      |
**/users/{id}**                                                          | GET, POST, PATCH, DELETE  |
**/homes/{homeId}/members**                                              | GET, POST                 |
**/homes/{homeId}/members/{userId}**                                     | GET, PATCH, DELETE        |
**/homes/{homeId}**                                                      | GET, POST, PATCH, DELETE  |
**/homes/{homeId}/kv/{sensorModuleId}**                                  | GET, POST, PUT            |  
**/homes/{homeId}/smartModules/tsdb/timeSeries/{seriesID}**              | GET                       |
**/devices/{deviceId}**                                                  | GET, PATCH, DELETE        |
**/devices/{homeId}**                                                    | GET                       |  
**/devices/{deviceId}/command**                                          | PUT                       |
**/devices/{homeId}**                                                    | GET                       |
**/devices/{deviceId}/kv/{sensorModuleId}**                              | GET, POST, PUT            |

### Using REST Endpoints

Below are some examples pertaining to the usage of REST endpoints.

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

#### Linking & Unlinking Sensor Modules

#### Sending Device Commands

### Receiving Device Commands
