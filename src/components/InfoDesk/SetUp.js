import React from 'react';
import { connect } from 'react-redux';
import map from 'lodash/map';
import get from 'lodash/get';
import size from 'lodash/size';
import cx from 'classnames';
import { Row, Col } from 'react-bootstrap';
import { withTranslation } from 'react-i18next';
import moment from 'moment';
import DocumentLink from '../Expo/ExhibitorPage/DocumentLink';
import AddInfoDeskDetail from './AddInfoDeskDetails';
import { getInfoDeskDetail } from './action/index';
import { getEventData } from '../../routes/event/action/selector';
import { getUserRoleDetails } from '../../routes/event/action/selectorVirtualEvent';
import AEButton from '../../Core/Button/Button';
import AELabel from '../../Core/Label/label';
import AEIcons from '../../Core/Icon/index';
import { addDataToKinesisDynamoDbStream } from '../../routes/exhibitorPortal/action';
import { getUserData } from '../../routes/login/action/selector';
import { checkApiTime } from '../../utils/common';
import { storeWarnUserOnPageLeave } from '../../routes/admin/action/index';
import LeaveWithoutSavingPopup from '../../routes/event/portal/LeaveWithoutSavePopup/LeaveWithoutSavingPopup';

class SetUp extends React.Component {
  constructor() {
    super();
    this.state = {
      faqAnswer: false,
      selectedQue: null,
      infoDeskDetails: {},
      showAddInfoDeskForm: false,
    };
  }

  componentDidMount = () => {
    this.getInfoDeskDetails();
  };

  getInfoDeskDetails = (data = false) => {
    const { eventData, apiRequestInfo, infoDeskData } = this.props;
    const { eventURL } = eventData || {};
    let infoPresent = false;
    if (apiRequestInfo?.length > 0) {
      infoPresent = checkApiTime(apiRequestInfo, 'INFODESK');
    }

    if (infoPresent && infoDeskData && !data) {
      this.setState({
        infoDeskDetails: infoDeskData,
      });
    } else if (eventURL) {
      this.props.getInfoDeskDetail(eventURL, apiRequestInfo).then((resp) => {
        if (resp && resp.data) {
          this.setState({
            infoDeskDetails: resp.data,
          });
        }
      });
    }
  };

  resetWarnUserOnStateUpdateForInfoDesk = () => {
    const { warnUserOnStateUpdate } = this.props;
    this.props.storeWarnUserOnPageLeave({
      ...warnUserOnStateUpdate,
      infoDeskStateUpdated: false,
      showPopupForInfoDesk: false,
    });
  };

  setStateUpdated = () => {
    const { warnUserOnStateUpdate } = this.props;
    this.props.storeWarnUserOnPageLeave({
      ...warnUserOnStateUpdate,
      infoDeskStateUpdated: true,
      showPopupForInfoDesk: false,
    });
  };

  handleKeepEditingInfoDeskPopupButton = () => {
    const { warnUserOnStateUpdate } = this.props;
    this.props.storeWarnUserOnPageLeave({ ...warnUserOnStateUpdate, showPopupForInfoDesk: false });
  };

  handleLeaveInfoDeskPopupButton = () => {
    const { warnUserOnStateUpdate } = this.props;
    this.props.storeWarnUserOnPageLeave({
      ...warnUserOnStateUpdate,
      infoDeskStateUpdated: false,
      showPopupForInfoDesk: false,
    });
    const { showAddInfoDeskForm } = this.state;
    this.toggleInfoDesk(showAddInfoDeskForm);
  };

  handleInfoDesk = (data) => {
    const { showAddInfoDeskForm } = this.state;
    if (showAddInfoDeskForm) {
      this.getInfoDeskDetails(data);
      const { warnUserOnStateUpdate } = this.props;
      const { infoDeskStateUpdated } = warnUserOnStateUpdate || {};
      if (infoDeskStateUpdated) {
        this.props.storeWarnUserOnPageLeave({ ...warnUserOnStateUpdate, showPopupForInfoDesk: true });
      } else {
        this.toggleInfoDesk(showAddInfoDeskForm);
      }
    } else {
      this.toggleInfoDesk(showAddInfoDeskForm);
    }
  };

  toggleInfoDesk = (showAddInfoDeskForm) => {
    this.setState({
      showAddInfoDeskForm: !showAddInfoDeskForm,
    });
  };

  toggleFaqAnswer = (index) => {
    const { faqAnswer, selectedQue } = this.state;
    this.setState({
      selectedQue: index,
    });
    if (selectedQue === index) {
      this.setState({ faqAnswer: !faqAnswer });
    } else {
      this.setState({ faqAnswer: true });
    }
  };

  removeHtmlTag = (value) => {
    if (value !== undefined && value !== null) {
      return value.replace(/<(.|\n)*?>/g, '');
    }
    return value;
  };

  handlePushDataToKinesis = (actionType, description) => {
    const { eventData, loggedInUser } = this.props;
    const { eventId } = eventData || {};
    const { userId } = loggedInUser || {};

    if (!userId || !eventId || !description) {
      return;
    }
    const dataToDynamoDb = {
      userId,
      timestamp: moment.utc().valueOf(),
      eventId,
      actionType,
      description: { ...description },
    };
    addDataToKinesisDynamoDbStream(dataToDynamoDb);
  };

  render() {
    const { selectedQue, showAddInfoDeskForm, infoDeskDetails, faqAnswer } = this.state;
    const { userRoleDetails, warnUserOnStateUpdate, t } = this.props;
    const { documentsAndLinks, faq, overview, documentKeyValue } = infoDeskDetails || {};
    const faqs = faq?.filter((i) => i?.key.trim() !== '' || i?.value.trim() !== '');
    const addLinksInJson = get(documentsAndLinks, 'tabList');
    const isAdmin = get(userRoleDetails, 'admin');
    const isUpdate = size(documentsAndLinks) > 0;

    window.addEventListener('resize', () => {
      setTimeout(() => {
        const windowWidth = window.innerWidth * window.devicePixelRatio;
        const windowHeight = window.innerHeight * window.devicePixelRatio;
        const screenWidth = window.screen.width;
        const screenHeight = window.screen.height;
        if (!(windowWidth / screenWidth >= 0.95 && windowHeight / screenHeight >= 0.95)) {
          document.activeElement?.scrollIntoView({ block: 'center' });
        }
      }, 100);
    });
    return (
      <div className="exhibitor_portal">
        <div className="content-wrapper-front">
          <Row>
            <Col className="col-md-12 expo">
              <Col>
                <Col className="doc-link-box white-box clear-both">
                  <Col className="title-link">
                    <h2 className="ae-heading4 setUp_title">{t('FAQs')}</h2>
                  </Col>
                  <Row>
                    <Col md={12} sm={12} xs={12}>
                      {map(
                        faq,
                        (item, index) =>
                          item &&
                          item.key &&
                          item.value && (
                            <div key={index} onClick={() => this.toggleFaqAnswer(index)}>
                              <div className="setUp-faq d-flex justify-content-between">
                                <AELabel
                                  variant={'subtitle2'}
                                  header={item.key}
                                  labelClass="m-b-0"
                                  color={index === selectedQue && faqAnswer ? '#406AE8' : '#4B4D5F'}
                                />
                                <span className="float-right que_expend_arrow">
                                  <AEIcons
                                    className={cx(
                                      'vertical-align-middle',
                                      index === selectedQue && faqAnswer
                                        ? 'ac-icon-arrow-up-xs faq-answer-open'
                                        : 'ac-icon-arrow-down-xs faq-answer-close',
                                    )}
                                    color={index === selectedQue && faqAnswer ? '#406AE8' : '#6D6F7D'}
                                  />
                                </span>
                              </div>
                              {index === selectedQue && faqAnswer && (
                                <span
                                  className="setup-faq-answer info-desk-update"
                                  dangerouslySetInnerHTML={{
                                    __html: item.value,
                                  }}
                                />
                              )}
                              {faq && index < size(faqs) - 1 && <hr className="setUp-hr-line" />}
                            </div>
                          ),
                      )}
                    </Col>
                  </Row>
                </Col>
                <Col className="doc-link-box white-box clear-both">
                  <DocumentLink
                    data={{ documentKeyValue, addLinksInJson }}
                    isSetup
                    handlePushDataToDynamoDB={this.handlePushDataToKinesis}
                  />
                </Col>
                <Col className="doc-link-box white-box clear-both">
                  <Col className="title-link">
                    <h2 className="ae-heading4 m-0" tabIndex="0" role="tabpanel">
                      {t('Overview')}
                    </h2>
                  </Col>
                  <div
                    className="info-desk-overview fr-view clearfix"
                    dangerouslySetInnerHTML={{
                      __html: overview,
                    }}
                  />
                </Col>
                {isAdmin && (
                  <Col className="text-right m-b-16">
                    <AEButton
                      isPrevIcon
                      icon={isUpdate ? 'virtual-icon-edit' : 'virtual-icon-add'}
                      onClick={() => this.handleInfoDesk()}
                      label={`${isUpdate ? t('Update') : t('Add')} ${t('Info Desk')}`}
                      id="labelButton"
                    />
                  </Col>
                )}
              </Col>
            </Col>
          </Row>
        </div>
        {showAddInfoDeskForm && (
          <AddInfoDeskDetail
            handleInfoDesk={this.handleInfoDesk}
            toggle={showAddInfoDeskForm}
            data={infoDeskDetails}
            setStateUpdated={this.setStateUpdated}
            resetWarnUserOnStateUpdateForInfoDesk={this.resetWarnUserOnStateUpdateForInfoDesk}
          />
        )}
        <LeaveWithoutSavingPopup
          isUnSavedPopupLoaded={warnUserOnStateUpdate && warnUserOnStateUpdate.showPopupForInfoDesk}
          handleKeepEditing={this.handleKeepEditingInfoDeskPopupButton}
          handleLeaveWithoutSaving={this.handleLeaveInfoDeskPopupButton}
        />
      </div>
    );
  }
}
const mapDispatchToProps = {
  getInfoDeskDetail,
  storeWarnUserOnPageLeave,
};
const mapStateToProps = (state) => ({
  eventData: getEventData(state),
  userRoleDetails: getUserRoleDetails(state),
  loggedInUser: getUserData(state),
  apiRequestInfo: state?.virtualEvent?.apiRequestInfo,
  infoDeskData: state?.virtualEvent?.infoDeskData,
  warnUserOnStateUpdate: state.host && state.host.warnUserOnStateUpdate,
});
export default connect(mapStateToProps, mapDispatchToProps)(withTranslation(['common'])(SetUp));
