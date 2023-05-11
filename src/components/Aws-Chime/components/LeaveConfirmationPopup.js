import React, { Component } from 'react';
import { connect } from 'react-redux';
import { withRouter } from 'react-router';
import { withTranslation } from 'react-i18next';
import { storeWarnUserOnPageLeave, storeNavigationData } from '../../../routes/admin/action';
import AEButton from '../../../Core/Button/Button';
import AEPopup from '../../../Core/Popup';

let isWarnUserPopupOpen = false;
class LeaveConfirmationPopup extends Component {
  constructor(props) {
    super(props);
    this.state = {
      showModal: false,
    };
    this.startLeaveHandler = this.startLeaveHandler.bind(this);
  }

  UNSAFE_componentWillReceiveProps() {
    setTimeout(() => {
      const { warnUserOnStateUpdate, isFromZoomEmbed } = this.props;
      const { showPopupForSaveSetting } = warnUserOnStateUpdate || {};
      if (!isWarnUserPopupOpen && showPopupForSaveSetting) {
        if (isFromZoomEmbed) {
          const joinAudioByComputerPopup = document.getElementsByClassName('close-jd tab-button');
          if (joinAudioByComputerPopup && joinAudioByComputerPopup[0]) {
            joinAudioByComputerPopup[0].click();
          }
        }
        isWarnUserPopupOpen = true;
        this.setState({
          showModal: true,
        });
      }
    }, 250);
  }

  startLeaveHandler = () => {
    const { warnUserOnStateUpdate, alertType } = this.props;
    if (alertType === 'success') {
      setTimeout(() => {
        if (warnUserOnStateUpdate && warnUserOnStateUpdate.selectedLink) {
          this.props.history.push(warnUserOnStateUpdate.selectedLink);
        }
        this.props.storeWarnUserOnPageLeave({
          stateUpdated: false,
          showPopupForSaveSetting: false,
          selectedLink: '',
        });
        this.close();
      }, 1000);
    }
  };

  closeModal = () => {
    isWarnUserPopupOpen = false;
    this.props.storeWarnUserOnPageLeave({
      stateUpdated: true,
      showPopupForSaveSetting: false,
      selectedLink: '',
    });
    this.props.storeNavigationData({ path: window.location.pathname });
    this.setState({ showModal: false });
  };

  close = () => {
    const { warnUserOnStateUpdate } = this.props;
    isWarnUserPopupOpen = false;
    this.setState({ showModal: false });
    if (warnUserOnStateUpdate && warnUserOnStateUpdate.selectedLink) {
      this.props.history.push(warnUserOnStateUpdate.selectedLink);
    }
  };

  UNSAFE_componentWillMount() {
    if (this.props.onRef) {
      this.props.onRef(this);
    }
  }

  componentWillUnmount() {
    this.props.storeWarnUserOnPageLeave({
      stateUpdated: false,
      showPopupForSaveSetting: false,
      selectedLink: '',
    });
  }

  render() {
    const { showModal } = this.state;
    const { id, onLeaveFunc, headerText, leaveText, t } = this.props;
    return (
      <div className="static-modal" id={`${id}-containter`}>
        <AEPopup
          id="saveSettings"
          showModal={showModal}
          headerText={<p className="transcription-modal-header">{headerText || t('Leave Session')}</p>}
          onCloseFunc={this.closeModal}
          isFromAccessPortalPage
          modelFooter={
            <div className="m-t-48">
              <AEButton
                onClick={this.closeModal}
                id="btnPopupConfirm"
                label={t('Stay')}
                variant="secondary"
                className="width-141 m-r-10 height-48"
              />
              <AEButton
                variant="primary"
                className="m-l-10 width-141 height-48"
                id="btnPopupClose"
                onClick={onLeaveFunc}
                label={t('Leave')}
              />
            </div>
          }
        >
          <div className="leave-confirmation-popup">
            <div>{leaveText || t('toasterMsg:Do you really want to leave this session?')}</div>
          </div>
        </AEPopup>
      </div>
    );
  }
}

const mapDispatchToProps = {
  storeWarnUserOnPageLeave: (stateChanged) => storeWarnUserOnPageLeave(stateChanged),
  storeNavigationData,
};
const mapStateToProps = (state) => ({
  warnUserOnStateUpdate: state.host && state.host.warnUserOnStateUpdate,
});

export default connect(
  mapStateToProps,
  mapDispatchToProps,
)(withRouter(withTranslation(['common', 'toasterMsg'])(LeaveConfirmationPopup)));
