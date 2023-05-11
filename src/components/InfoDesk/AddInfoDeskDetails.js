import React from 'react';
import 'froala-editor/css/froala_style.css';
import 'froala-editor/css/froala_editor.pkgd.min.css';
// eslint-disable-next-line import/extensions
import 'froala-editor/js/plugins.pkgd.min';
import { connect } from 'react-redux';
import { Row, Col } from 'react-bootstrap';
import get from 'lodash/get';
import split from 'lodash/split';
import cloneDeep from 'lodash/cloneDeep';
import isEqual from 'lodash/isEqual';
import FroalaEditor from 'react-froala-wysiwyg';
import { withTranslation } from 'react-i18next';
import froalaConfig from '../../constants/froalaConfig';
import AddDocLink from '../ExhibitorContainer/AddDocLink';
import { DocUploader } from '../ExhibitorContainer/InputContainer';
import { getInfoDeskDetail, saveInfoDeskDetail, deleteInfoDeskDetail } from './action/index';
import AEButton from '../../Core/Button/Button';
import AELabel from '../../Core/Label/label';
import AESlidePopup from '../../Core/SlidePopup/index';
import { showAlert } from '../../routes/event/action/portalAction';
import { storeWarnUserOnPageLeave } from '../../routes/admin/action/index';

class AddInfoDeskDetail extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      infoDeskDetails: {},
      loading: false,
      isSaveDisable: true,
      cancelBtnClicked: false,
      validData: false,
    };
  }

  cancelBtnClicked = (data) => {
    const { validData } = this.state;
    if (!validData) {
      this.setState({
        isSaveDisable: true,
        cancelBtnClicked: data,
      });
    }
  };

  validData = (validData) => {
    this.setState({ validData });
  };

  componentDidMount() {
    this.getInfoDeskDetails();
  }

  componentWillUnmount() {
    this.handleClearTimeout();
  }

  handleClearTimeout = () => {
    if (this.dataTimeout) {
      clearTimeout(this.dataTimeout);
      this.dataTimeout = null;
    }
  };

  getInfoDeskDetails = () => {
    const { eventData } = this.props;
    if (eventData) {
      const { eventURL } = eventData;
      this.props.getInfoDeskDetail(eventURL).then((resp) => {
        if (resp && resp.data) {
          this.setState({
            infoDeskDetails: resp.data,
          });
        }
      });
    }
  };

  isDocOrFaqChanged = (oldData, newData) => !isEqual(oldData, newData);

  handleInputValue = ({ field, value }) => {
    let { infoDeskDetails } = this.state;
    if (field === 'tabList') {
      if (
        this.isDocOrFaqChanged(infoDeskDetails.documentsAndLinks && infoDeskDetails.documentsAndLinks[field], value)
      ) {
        this.props.setStateUpdated();
      }
      const documentsAndLinks = { ...infoDeskDetails.documentsAndLinks, [field]: value };
      infoDeskDetails = { ...infoDeskDetails, documentsAndLinks };
      this.setState({ infoDeskDetails }, () => this.submitInfoDesk());
    } else if (field === 'faq') {
      if (this.isDocOrFaqChanged(infoDeskDetails[field], value)) {
        this.props.setStateUpdated();
      }
      infoDeskDetails = { ...infoDeskDetails, [field]: value };
      this.setState({ infoDeskDetails }, () => this.submitInfoDesk());
    }
  };

  setDescription = (value) => {
    const { infoDeskDetails } = this.state;
    infoDeskDetails.overview = value;
    this.setState({ infoDeskDetails, validData: true, cancelBtnClicked: false }, () => this.submitInfoDesk());
    this.props.setStateUpdated();
  };

  submitInfoDesk = () => {
    const { cancelBtnClicked } = this.state;
    this.handleClearTimeout();
    if (!cancelBtnClicked) {
      this.setState({ isSaveDisable: false });
    }
  };

  handleSaveInfoDesk = () => {
    const { infoDeskDetails } = this.state;
    const { eventData, t, handleInfoDesk } = this.props;
    const { eventURL } = eventData;
    this.handleClearTimeout();
    this.setState({
      loading: true,
    });
    this.props.saveInfoDeskDetail(infoDeskDetails, eventURL).then((resp) => {
      const status = get(resp, 'status');
      const message = get(resp, 'data.message');
      if (status === 200 || message) {
        this.props.resetWarnUserOnStateUpdateForInfoDesk();
        this.showMsg(message || t('toasterMsg:Info-desk details added successfully'));
        this.getInfoDeskDetails();
        this.setState({ loading: false });
        setTimeout(() => {
          handleInfoDesk();
        }, 1000);
      } else {
        this.showMsg(resp && resp.errorMessage, 'error');
        this.setState({ loading: false });
      }
    });
  };

  showMsg = (msg, status = 'Success') => {
    this.props.showAlert({
      message: msg,
      success: status === 'Success',
    });
  };

  handleToggleSwitch = (field, value) => {
    this.handleInputValue({ field, value });
  };

  moveList = (list, oldIndex, newIndex) => {
    this.setState({ isSaveDisable: false, validData: true, cancelBtnClicked: false });
    if (newIndex >= list?.length) {
      let k = newIndex - list?.length;
      while (k-- + 1) {
        list?.push(undefined);
      }
    }
    list?.splice(newIndex, 0, list?.splice(oldIndex, 1)[0]);
    return list;
  };

  onFaqChange = (newList, newIndex, oldIndex) => {
    const { infoDeskDetails } = this.state;
    this.setState({ isSaveDisable: false, validData: true, cancelBtnClicked: false });
    const { faq } = infoDeskDetails || {};
    const movedList = this.moveList(faq, oldIndex, newIndex);
    infoDeskDetails.faq = movedList;
    this.setState({ infoDeskDetails });
    this.props.setStateUpdated();
  };

  docUploaded = (resp, val) => {
    this.props.setStateUpdated();
    const { infoDeskDetails } = this.state;
    this.setState({ isSaveDisable: false, validData: true, cancelBtnClicked: false });
    if (resp?.data) {
      if (val) {
        const data = [...val, { key: resp?.data?.message, value: split(resp?.data?.message, '_')[1] }];
        infoDeskDetails.documentKeyValue = data;
        this.setState({ infoDeskDetails });
      }
    } else if (resp?.removeId !== undefined) {
      if (val) {
        val.splice(resp.removeId, 1);
        infoDeskDetails.documentKeyValue = val;
        this.setState({ infoDeskDetails });
      }
    } else if (resp?.isUpdate) {
      if (val) {
        infoDeskDetails.documentKeyValue = resp?.csvFiles;
        this.setState({ infoDeskDetails });
      }
    } else if (resp?.errorMessage) {
      this.showMsg(resp?.errorMessage, 'error');
    }
  };

  renderAddFaq = (name, value) => (
    <AddDocLink
      name={name}
      docList={cloneDeep(value) || []}
      handleValue={this.handleToggleSwitch}
      onChange={this.onFaqChange}
      isFaq
      isFromInfoDesk
      btnId="add-faq"
      onCancel={(data) => this.cancelBtnClicked(data)}
      validData={(data) => this.validData(data)}
    />
  );

  renderDocUploader = (label, value) => (
    <DocUploader
      label={label}
      uploadURL={'host/upload/document'}
      docList={value}
      uploaded={(res) => this.docUploaded(res, value)}
      isMutiple={false}
      handleValue={this.handleToggleSwitch}
      isFrom="infoDesk"
    />
  );

  renderAddDoc = (name, value) => (
    <AddDocLink
      name={name}
      isInfoDeskDoc
      onCancel={(data) => this.cancelBtnClicked(data)}
      validData={(data) => this.validData(data)}
      docList={cloneDeep(value) || []}
      handleValue={this.handleToggleSwitch}
      btnId="add-document"
    />
  );

  deleteInfoDesk = () => {
    const { eventData, t } = this.props;
    const { eventURL } = eventData || {};
    this.setState({ isSaveDisable: false, validData: true, cancelBtnClicked: false });
    this.props.deleteInfoDeskDetail(eventURL).then((resp) => {
      if (resp && resp.data) {
        this.showMsg(resp.data.message || t('toasterMsg:Info-desk details deleted successfully'));
        this.getInfoDeskDetails();
      } else {
        this.showMsg(resp && resp.errorMessage, 'error');
      }
    });
  };

  render() {
    const { infoDeskDetails, loading, isSaveDisable } = this.state;
    const tabList = get(infoDeskDetails, 'documentsAndLinks.tabList');
    const { handleInfoDesk, data, toggle, t } = this.props;
    return (
      <>
        <Row className="item-row add_info_slide_popup">
          <AESlidePopup
            toggle={toggle}
            isShowOverlay
            title={`${data.eventId ? t('Edit') : t('Add')} ${t('Info Desk')}`}
            onClick={() => handleInfoDesk(true)}
            onKeyPress={!loading ? (e) => e.key === 'Enter' && handleInfoDesk() : false}
            isFullHeight
          >
            <div className={'add-scrollbar-edit-item addon-setup-row'}>
              <Col className="p-0" md={12} sm={12} xs={12}>
                {this.renderAddFaq('faq', infoDeskDetails.faq)}
                {this.renderDocUploader('Upload Document', infoDeskDetails.documentKeyValue || [])}
                {this.renderAddDoc('tabList', tabList)}
                <Row className="m-b-15">
                  <Col xs={12} md={12}>
                    <AELabel variant="body2" header={t('Overview')} />
                  </Col>
                  <Col xs={12} md={12}>
                    <FroalaEditor
                      model={infoDeskDetails.overview}
                      config={froalaConfig(false, 100, '', true, false, '', false, true, false)}
                      onModelChange={(value) => this.setDescription(value)}
                    />
                  </Col>
                </Row>
              </Col>
            </div>
            <div className={'col-md-12 col-xs-12 bottom-buttons p-15 flot-footer-buttons'}>
              <div className="text-center">
                <AEButton
                  onClick={() => {
                    this.handleSaveInfoDesk();
                  }}
                  variant="primary"
                  label={t('Save')}
                  id="save"
                  disabled={loading || isSaveDisable}
                  loading={loading}
                />
                <AEButton
                  className={'ml-3'}
                  onClick={() => {
                    handleInfoDesk(true);
                  }}
                  label={t('Close')}
                  variant="secondary"
                  id="close"
                />
              </div>
            </div>
          </AESlidePopup>
        </Row>
      </>
    );
  }
}

const mapDispatchToProps = {
  getInfoDeskDetail,
  saveInfoDeskDetail,
  deleteInfoDeskDetail,
  showAlert,
  storeWarnUserOnPageLeave,
};
const mapStateToProps = (state) => ({
  eventData: state.event && state.event.data,
  user: state.session.user,
  currencySymbol: state?.event?.data?.currencySymbol || '$',
  authenticated: state.session.authenticated,
  warnUserOnStateUpdate: state.host && state.host.warnUserOnStateUpdate,
});

export default connect(
  mapStateToProps,
  mapDispatchToProps,
)(withTranslation(['common', 'toasterMsg'])(AddInfoDeskDetail));
