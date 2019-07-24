import React, { Component, Fragment } from 'react';
import LeftNav from '../components/LeftNav';
import { NavLink, withRouter, Redirect, RouteComponentProps } from 'react-router-dom';
import { any } from 'prop-types';
import ModeConnection from '../controllers/ModeConnection';
import AppContext from '../controllers/AppContext';
import modeAPI from '../controllers/ModeAPI';

const addModule1 = require('../common_images/add-module-1.svg');
const addModule2 = require('../common_images/add-module-2.svg');
interface AddSensorModuleProps extends React.Props<any> {
    isLoggedIn: boolean;
    onLogIn: () => void;
    }
    
interface AddSensorModuleState {

}

export class AddSensorModule extends Component<AddSensorModuleProps & RouteComponentProps<any>, AddSensorModuleState> {
    constructor(props: AddSensorModuleProps & RouteComponentProps) {
        super(props);
        this.state = {

        };
        this.cancelScan = this.cancelScan.bind(this);
    }

    cancelScan(event: React.MouseEvent<HTMLButtonElement>): void {
        this.props.history.push('/devices');
    }

    startScan(): void {
        AppContext.restoreLogin();
        ModeConnection.openConnection();
        const UID = AppContext.getLoginInfo();

        if (UID !== null) {
            let gateway = '';
            modeAPI.getHome(UID.user.id).then((response: any) => {
                modeAPI.getDevices(response.id).then((deviceResponse: any) => {
                    gateway = deviceResponse[0].id;
                });
                let requestCount = 5;
                let interval = setInterval(
                    () => {
                        requestCount--;
                        ModeConnection.searchForSensorModules(gateway);
                        if (requestCount < 1) {
                            clearInterval(interval);
                        }
                    },
                    1000
                );
            });
        }
    }

    render() {
        return (
            <Fragment>
            <LeftNav />
                <div className="scan-container">
                    <div className="page-header">
                        Add Sensor Modules
                    </div>
                    <div className="scan-section">
                        <div className="scan-header">Scan for available sensor modules</div>
                        <div className="directions">
                            <div className="step-1">
                                <span className="circled-number">1</span>
                                <div className="direction">
                                    <img src={addModule1} />
                                    <p>Turn on all sensor modules.</p>
                                </div>
                            </div>
                            <div className="step-2">
                                <span className="circled-number">2</span>
                                <div className="direction">
                                    <img src={addModule2} />
                                    <p>
                                        Place the sensor modules you want to connect to within 5ft of the gateway.
                                    </p>
                                </div>
                            </div>
                        </div>
                        <div className="button-section">
                            <button 
                                className="cancel-scan"
                                onClick={this.cancelScan}
                            >Cancel
                            </button>
                            <button 
                                className="start-scan"
                                onClick={this.startScan}
                            >Start Scanning
                            </button>
                        </div>
                    </div>
                </div>
            </Fragment>
        );
    }
}
export default withRouter(AddSensorModule);