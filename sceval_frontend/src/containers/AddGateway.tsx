import React, { Component, Fragment, useState, useContext, useEffect } from 'react';
import { withRouter, RouteComponentProps } from 'react-router-dom';
import { makeStyles } from '@material-ui/core/styles';
import Table from '@material-ui/core/Table';
import TableBody from '@material-ui/core/TableBody';
import TableCell from '@material-ui/core/TableCell';
import TableHead from '@material-ui/core/TableHead';
import TableRow from '@material-ui/core/TableRow';
import Paper from '@material-ui/core/Paper';
import { Context, context } from '../context/Context';
import modeAPI from '../controllers/ModeAPI';
import { LoginInfo } from '../components/entities/User';
import AppContext from '../controllers/AppContext';
import { Home, Device } from '../components/entities/API';
import { Toolbar, Typography } from '@material-ui/core';
import  { Input, Button } from 'antd';

const connect = require('../common_images/devices/1-plug.svg');
const claimMode = require('../common_images/devices/device_logo.png');

const createData = (
    id: number,  name: string, classId: string, tag: string, status: boolean) => {
    return { id, name, classId, tag, status };
};

const AddGateway = withRouter((props: RouteComponentProps) => {
    const sensorContext: Context = useContext(context);
    const [home, setHome] = useState<number>();
    const [pairedDevices, setPairedDevices] = useState<Array<any>>();
    const [claimCodeDDVisible, setClaimCodeDDVisible] = useState<boolean>(false);
    const [claimCode, setClaimCode] = useState<string>();
    const [addDeviceError, setAddDeviceError] = useState<boolean>(false);
    const [rows, setRows] = useState();
    const initialize = async () => {
        const loginInfo: LoginInfo =  await AppContext.restoreLogin();
        // get home associated with project
        const homeObj: Home = await modeAPI.getHome(loginInfo.user.id);
        setHome(homeObj.id);
        const devices: Array<Device> = await modeAPI.getDevices(homeObj.id);
        setPairedDevices(devices);
        let rowData: any = [];
        devices.forEach((device: Device, index: any) => {
            const newData = createData(
                device.id, device.name ? device.name : '', 
                device.deviceClass, device.tag, device.isConnected);
            rowData.push(newData);
            if (index === devices.length - 1) {
                setRows(rowData);
            }
        });
    };

    const submitClaimCode = async () => {
        if (home && claimCode) {
            const status = await modeAPI.addDevice(home, claimCode);
            if (status === 201) {
                initialize();
                setClaimCodeDDVisible(false);
                setClaimCode('');
            } else {
                setAddDeviceError(true);
            }
        }
    };

    const renderClaimCodeDropdown = () => {
        setClaimCodeDDVisible(true);
    };

    const handleClaimCodeEntry = (event: React.ChangeEvent<HTMLInputElement>) => {
        event.preventDefault();
        setClaimCode(event.target.value);
    };

    const EnhancedTableToolbar = () => {      
        return (
          <Toolbar>
            <div className="table-header">
                <Typography variant="h6" id="tableTitle">
                    Devices
                </Typography>
                <button
                    className="add-gateway"
                    disabled={claimCodeDDVisible}
                    onClick={() => renderClaimCodeDropdown()}
                >
                New
                </button>
                {
                    claimCodeDDVisible &&
                    <div className="claim-code-section">
                        <Input 
                            className="claim-code-entry"
                            placeholder="Claim code"
                            value={claimCode}
                            onChange={handleClaimCodeEntry}
                        />
                        <Button
                            className="add-button"
                            onClick={() => submitClaimCode()}
                            disabled={claimCode === ''}
                        >Add
                        </Button>
                        <Button
                            className="cancel-button"
                            onClick={() => setClaimCodeDDVisible(false)}
                        >Cancel
                        </Button>
                    </div>
                }
            </div>
          </Toolbar>
        );
      };

    useEffect(
        () => {
            initialize();
        },
        []
    );

    return (
        <>
        <div className="directions">
            <div>
            <span className="circled-number">1</span>
            <img className="direction-image" src={connect} />
            <p>Make sure your device is connected to power and wifi.</p>
            </div>
            <div>
            <span className="circled-number">2</span>
            <img className="direction-image" src={claimMode} />
            <p>Turn your device into claim mode.</p>
            </div>
            <div>
            <span className="circled-number">3</span>
            <img className="direction-image" src={claimMode} />
            <p>Enter the claim code found on your device and click 'Add' to add the device.</p>
            </div>
        </div>
        <Paper className="device-table">
        {EnhancedTableToolbar()}
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>ID</TableCell>
            <TableCell align="right">Name</TableCell>
            <TableCell align="right">Class ID&nbsp;</TableCell>
            <TableCell align="right">Tag&nbsp;</TableCell>
            <TableCell align="right">Status&nbsp;</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          { rows &&
            rows.map((row: any) => (
            <TableRow 
                key={row.id}
                className="device-row"
            >
              <TableCell component="th" scope="row">
                {row.id}
              </TableCell>
              <TableCell align="right">{row.name}</TableCell>
              <TableCell align="right">{row.classId.toString()}</TableCell>
              <TableCell align="right">{row.tag}</TableCell>
              <TableCell 
                align="right" 
                className={row.status ? 'connected' : 'disconnected'}
              >
              {row.status ? 'Connected' : 'Disconnected'}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Paper>
    </>
    );
});

export default AddGateway;