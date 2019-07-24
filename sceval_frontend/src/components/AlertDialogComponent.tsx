import * as React from 'react';
import * as ReactModal from 'react-modal';
const alertIcon = require('../common_images/notifications/critical-red.svg');

export interface AlertDialogComponentProps {
  isOpen: boolean;
  onOkayClick?: () => void;
  closeDialog: () => void;
  isShowCancel?: boolean;
  cancelText?: React.ReactNode;
  okText?: React.ReactNode;
  titleText: React.ReactNode;
  contentText: React.ReactNode;
}

export default class AlertDialogComponent extends React.Component<AlertDialogComponentProps> {
  render() {
    return (
      <ReactModal 
        isOpen={this.props.isOpen}
        contentLabel="Error"
        className="mode-modal mode-modal-alert"
        overlayClassName="mode-overlay"
      >
        <div className="alert-icon-wrapper">
          <img src={alertIcon} alt="Alert" />
        </div>
        <h3>
          {this.props.titleText}
        </h3>
        <div className="content">
          {this.props.contentText}
        </div>
        <div className="buttons-container">
          <button
            type="submit"
            className="btn btn-primary btn-mode" 
            onClick={() => {
              if (this.props.onOkayClick) {
                this.props.onOkayClick();
              }
              this.props.closeDialog();
            }}
          >
            {this.props.okText ? this.props.okText :
              <div
                id="modals.okText"
              >
                OK
              </div>
            }
          </button>
            <button
              type="button"
              className="btn btn-secondary btn-mode"
              onClick={() => { this.props.closeDialog(); }}
            >
              {this.props.cancelText ? this.props.cancelText :
                <div
                  id="modal.cancelText"
                >
                  No, Cancel
                </div>
              }
            </button>
        </div>
      </ReactModal>
    );
  }
}