import React, { useEffect, useState } from 'react';
import { Col, Row } from 'react-bootstrap';
import { connect } from 'react-redux';
import filter from 'lodash/filter';
import size from 'lodash/size';
import get from 'lodash/get';
import cx from 'classnames';
import i18n from 'i18next';
import { graphql, compose, withApollo } from 'react-apollo';
import moment from 'moment';
import { useTranslation } from 'react-i18next';
import AEImage from '../../../Core/Image';
import { cloudinary_name, imgUrl as IMAGE_URL } from '../../../clientConfig';
import ExpoTabs from './ExpoTabs';
import DocumentLink from './DocumentLink';
import CompRepresent from './CompRepresent';
import {
  getEventExhibitor,
  setUserExpoVisitData,
  isChimeMeetingStarted,
  addDataToKinesis,
  logExpoVisitedData,
  logExpoVisitorLeaveData,
  getCurrentSystemDate,
  getCompanyRepresentatives,
  addDataToKinesisDynamoDbStream,
} from '../../../routes/exhibitorPortal/action';
import { getEventData, getHostEventData } from '../../../routes/event/action/selector';
import { getUserTicketTypeIdsByEventUrl } from '../../../routes/event/action/portalAction';
import { getUserSession } from '../../../routes/login/action/selector';
import { setChannelDetails } from '../../StageDetails/action';
import {
  getUserExpoVisitData,
  selectorVirtualEventSettings,
  getUserRoleDetails,
  getUserTicketTypeIds,
} from '../../../routes/event/action/selectorVirtualEvent';
import { doGetLabelsByLanguageCodeForExpo, storeLanguageCodeLabelsForExpo } from '../../../routes/admin/ticket/action';
import WithParams from '../../WrapperComponents/WithParams';
import { subscribeExpoPushNotification } from '../../../graphql/pushNotifications.query';
import notificationsExpo from '../../WebChat/action/graphql/pushNotificationsExpo';
import BrowserNotificationModel from '../../BrowserNotificationModel/BrowserNotificationModel';
import AELabel from '../../../Core/Label/label';
import AEButton from '../../../Core/Button/Button';
import AEPopup from '../../../Core/Popup';
import AEIcon from '../../../Core/Icon';

let localUserExpoVisitData = {};
let GAIntervalTime = null;
let messageTitle = '';
let messageOptions = null;
let unsubscribeNotification;
function ExhibitorPage({
  compRepStatus,
  exhibitor,
  exhibitorId,
  getEventExhibitor,
  eventDetails,
  setChannelDetails,
  user,
  setUserExpoVisitData,
  activeType,
  virtualEventSettings,
  userRoleDetails,
  isChimeMeetingStarted,
  logExpoVisitedData,
  logExpoVisitorLeaveData,
  props,
  history,
  getUserTicketTypeIdsByEventUrl,
  userTicketTypeIds,
  getCurrentSystemDate,
  getCompanyRepresentatives,
  doGetLabelsByLanguageCodeForExpo,
  userExpoVisitData,
}) {
  const {
    videoURL,
    offer,
    linkToSite,
    documentKeyValue,
    exhibitorDescription,
    exhibitorName,
    expoBannerImage,
    offerLink,
    liveStreamUrl,
    socialLinks,
    autoGenerateLead,
    id,
    staffUserIds,
    externalLiveStreamingEnabled,
    addLinksInJson,
    categoryName,
    exhibitorFieldsInJson,
    chatEnabled,
    streamProvider,
    meetingPassword,
    showStatusIndicator,
    requireApprovalBeforeAttendeesCanJoin,
    meetingEntryExitNotificationOn,
    expoCardImage,
    colorConfig,
    showBoothName,
    autoplayPromoVideo,
  } = exhibitor;
  const defaulColor = expoCardImage ? '#ffffff' : '#000000';
  const { nameColor, categoryColor } = colorConfig || {};
  const nameTextColor = nameColor || defaulColor;
  const categoryTextColor = categoryColor || defaulColor;
  const [userAvailable, setUserAvailable] = useState(false);
  const [isShowOtherDetails, setIsShowOtherDetails] = useState(true);
  const [isShowPopUp, setIsShowPopup] = useState(false);
  const [isErrorMessage, setIsErrorMessage] = useState('');
  const [isShowChimeStream, setIsShowChimeStream] = useState(false);
  const [popupNotification, setPopupNotification] = useState(false);
  const { eventURL, eventId } = eventDetails || {};
  let startTimeOfVisit;
  let endTimeOfVisit;
  let expoVisitTime = 0;
  const isValidSocialLinks = filter(socialLinks, (o) => (o.value && o.value.length ? o : null));
  const isShowDocumentLink =
    linkToSite || size(documentKeyValue) > 0 || size(addLinksInJson) > 0 || size(isValidSocialLinks) > 0;

  const { t } = useTranslation(['exhibitor']);
  const setVideoPlayed = () => {
    if (!localUserExpoVisitData.videoPlayed) {
      localUserExpoVisitData.videoPlayed = true;
      setUserExpoVisitData({ ...localUserExpoVisitData });
    }
  };

  const setRequestMeeting = () => {
    if (!localUserExpoVisitData?.requestMeeting) {
      localUserExpoVisitData.requestMeeting = true;
      setUserExpoVisitData({ ...localUserExpoVisitData });
    }
  };

  const initAmplifyAnalyticsData = () => {
    setUserExpoVisitData({
      eventId,
      userId: user && user.userId,
      gameType: '',
      area: 'EXPO',
      timeInBooth: 0,
      expoId: parseInt(exhibitorId, 10),
      date: moment.utc().format('YYYY-MM-DDTHH:mm:ss'),
    });
  };

  const pushDataToKinesis =
    userRoleDetails && !(userRoleDetails.admin || userRoleDetails.staff || userRoleDetails.exhibitor);

  const trackUserExpoVisitData = (data) => {
    const { eventId } = eventDetails || {};
    const { userId } = user || {};
    const expoId = parseInt(exhibitorId, 10);
    if (pushDataToKinesis && eventId && userId && expoId) {
      const userExpoVisitData = {
        eventId,
        userId,
        gameType: '',
        area: 'EXPO',
        expoId,
        date: moment.utc().format('YYYY-MM-DDTHH:mm:ss'),
        ticketTypeIds: size(userTicketTypeIds) ? userTicketTypeIds : [],
        ...data,
      };
      if (virtualEventSettings && virtualEventSettings.gamificationNewFlow) {
        addDataToKinesis(userExpoVisitData, true);
      }
    }
  };

  const trackProductViewAndExpoVisitEvent = (data, isPassDataForAdminStaff) => {
    const { eventId } = eventDetails || {};
    const { userId } = user || {};
    const expoId = parseInt(exhibitorId, 10);
    // For Visit to the Booth event send data to Kinesis irrespective of all users role
    // For other actions pass data based on user role
    const isSendData = isPassDataForAdminStaff
      ? true
      : userRoleDetails && !(userRoleDetails.admin || userRoleDetails.staff || userRoleDetails.exhibitor);
    if (isSendData && userRoleDetails && eventId && userId && expoId) {
      const userExpoData = {
        eventId,
        userId,
        gameType: '',
        area: 'expo',
        expoId,
        date: moment.utc().format('YYYY-MM-DDTHH:mm:ss'),
        ticketTypeIds: size(userTicketTypeIds) ? userTicketTypeIds : [],
        ...data,
      };
      addDataToKinesis(userExpoData, true);
    }
  };

  const handlePushDataToDynamoDB = (action, details) => {
    const { eventId } = eventDetails || {};
    const { userId } = user || {};
    const expoId = Number(exhibitorId);

    if (eventId && userId && expoId) {
      const data = {
        userId,
        timestamp: moment.utc().valueOf(),
        eventId,
        actionType: action,
        description: {
          exhibitorId: expoId,
          exhibitorName,
          ...details,
        },
      };
      addDataToKinesisDynamoDbStream(data);
    }
  };

  const handleEffect = async () => {
    if (exhibitorId && !isNaN(parseInt(exhibitorId, 10))) {
      const { eventId } = eventDetails || {};
      const { userId } = user || {};
      const expoId = parseInt(exhibitorId, 10);
      const expoVisitCountData = { eventId, userId, expoId };

      if (eventId && userId && expoId) {
        addDataToKinesis(expoVisitCountData, false, false, true);
      }

      if (eventId) {
        logExpoVisitedData(Number(exhibitorId), eventId);
      }
      getUserTicketTypeIdsByEventUrl(eventURL)
        .then((res) => {
          if (!userTicketTypeIds && res && res.data) {
            userTicketTypeIds = res.data;
          }
        })
        .catch(() => {});
      trackProductViewAndExpoVisitEvent({ visitToTheBooth: true }, true);
      doGetLabelsByLanguageCodeForExpo(i18n.language?.toLocaleUpperCase(), eventDetails?.eventURL, Number(exhibitorId));
      getEventExhibitor(eventURL, Number(exhibitorId)).then(async (response) => {
        if (response && !response.errorMessage) {
          const { id, exhibitorName, visitedTime } = response;
          startTimeOfVisit = visitedTime;
          await setChannelDetails({
            id,
            name: exhibitorName,
            activeType,
          });
          initAmplifyAnalyticsData();
        } else if (response?.errorCode === '4040027') {
          setIsErrorMessage(response?.errorMessage);
          setIsShowPopup(true);
        }
      });
    }
  };

  const endBoothVisit = async () => {
    getCurrentSystemDate().then(async (response) => {
      endTimeOfVisit = response;
      const timeInBooth = startTimeOfVisit ? (endTimeOfVisit - startTimeOfVisit) / 1000 : 0;
      const { eventId, expoId, date } = localUserExpoVisitData;
      const { userId } = user || {};
      if (eventId && userId && expoId) {
        if (virtualEventSettings && virtualEventSettings.gamificationNewFlow) {
          const data = {
            eventId,
            userId: user && user.userId,
            gameType: '',
            area: 'EXPO',
            expoId: parseInt(expoId, 10),
            date,
            ticketTypeIds: size(userTicketTypeIds) > 0 ? userTicketTypeIds : [],
          };
          const dataWithTimeInBooth = { ...data, timeInBooth };
          addDataToKinesis(dataWithTimeInBooth, true);
          if (expoVisitTime > 0) {
            const dataWithVideoDuration = { ...data, videoDuration: expoVisitTime };
            addDataToKinesis(dataWithVideoDuration, true);
            expoVisitTime = 0;
          }
        }
      }
    });
  };

  const callBackOfTabChange = (activeTab) => {
    if (activeTab === 'PRODUCTS') {
      setIsShowOtherDetails(false);
    } else {
      setIsShowOtherDetails(true);
    }
  };

  const handleOnCloseNotification = () => {
    messageTitle = '';
    messageOptions = null;
    setPopupNotification(false);
  };

  const unSubSCribePushNotificationData = () => {
    if (unsubscribeNotification) {
      unsubscribeNotification.unsubscribe();
      unsubscribeNotification = null;
    }
  };

  const returnToEventPage = () => {
    setIsShowPopup(false);
    setIsErrorMessage('');
    window.location.href = `/e/${eventURL}`;
  };

  const fetchPushNotificationData = () => {
    unSubSCribePushNotificationData();
    try {
      const moduleType = 'EXPO';
      const moduleTypeId = parseInt(exhibitorId, 10);
      const data = { moduleType, moduleTypeId, eventId };
      unsubscribeNotification = notificationsExpo
        .subscribe({
          query: subscribeExpoPushNotification,
          variables: {
            ...data,
          },
        })
        .subscribe({
          next: (response) => {
            if (response && response.data) {
              const notificationData = response.data.onCreateAttendeeNotifications;
              if (notificationData.userId !== user.userId) {
                if (messageTitle) {
                  handleOnCloseNotification();
                }
                const payloadData = notificationData.payload && JSON.parse(notificationData.payload);
                let body = '';
                if (payloadData.type === 'ENTER_BOOTH') {
                  body = t('{{userName}} has entered booth {{exhibitorName}}', {
                    userName: payloadData.otherData.userFullName,
                    exhibitorName: exhibitorName || '',
                  });
                }
                if (payloadData.type === 'LEAVE_BOOTH') {
                  body = t('{{userName}} has left booth {{exhibitorName}}', {
                    userName: payloadData.otherData.userFullName,
                    exhibitorName: exhibitorName || '',
                  });
                }
                const options = {
                  title: exhibitorName,
                  body,
                  tag: `${notificationData.autoId}`,
                  silent: true,
                  data: { silentNotification: true },
                };
                messageTitle = exhibitorName;
                messageOptions = options;
                setPopupNotification(true);
              }
            }
          },
          error: (error) => {
            console.log(error);
          },
        });
    } catch (error) {
      console.log(error);
    }
  };

  const checkCloseTab = () => {
    unSubSCribePushNotificationData();
    if (userRoleDetails && !(userRoleDetails.admin || userRoleDetails.staff || userRoleDetails.exhibitor)) {
      if (localUserExpoVisitData) {
        setTimeout(() => {
          endBoothVisit();
        }, 500);
      }
      if (eventId && exhibitorId && !isNaN(parseInt(exhibitorId, 10))) {
        logExpoVisitorLeaveData(exhibitorId, eventId);
      }
    }
  };

  useEffect(() => {
    if (eventId && exhibitorId && !isNaN(parseInt(exhibitorId, 10)) && userRoleDetails && userRoleDetails.exhibitor) {
      getCompanyRepresentatives(exhibitorId, eventId).then((resp) => {
        if (resp && !resp.errorMessage && size(resp)) {
          const compRepIds = resp.map((compRep) => compRep.userId);
          if (compRepIds.indexOf(user && user.userId) > -1) fetchPushNotificationData();
        }
      });
    }
    handleEffect();
    return () => {
      unSubSCribePushNotificationData();
      if (userRoleDetails && !(userRoleDetails.admin || userRoleDetails.staff || userRoleDetails.exhibitor)) {
        if (localUserExpoVisitData) {
          setTimeout(() => {
            endBoothVisit();
          }, 500);
        }
        if (eventId && exhibitorId && !isNaN(parseInt(exhibitorId, 10))) {
          logExpoVisitorLeaveData(exhibitorId, eventId);
        }
      }
    };
  }, []);

  useEffect(() => {
    window.addEventListener('beforeunload', (e) => {
      e = e || window.event;
      if (window?.location?.pathname?.indexOf(`/portal/expo/${exhibitorId}`) > -1) {
        e.preventDefault();
        checkCloseTab();
      }
    });
  }, []);

  useEffect(() => {}, popupNotification);

  useEffect(() => {
    const isModerator =
      userRoleDetails && (userRoleDetails.admin || userRoleDetails.staff || userRoleDetails.exhibitor);
    if (isModerator) {
      setIsShowChimeStream(true);
    } else if (exhibitorId && streamProvider && streamProvider === 'ACCELEVENTS') {
      isChimeMeetingStarted(eventDetails.eventId, Number(exhibitorId)).then((response) => {
        if (response && !response.errorMessage) {
          setIsShowChimeStream(response.data);
        }
      });
    }
  }, [streamProvider]);

  useEffect(() => {
    if (userExpoVisitData) {
      localUserExpoVisitData = { ...userExpoVisitData };
    }
  }, [userExpoVisitData]);

  useEffect(() => {
    if (showStatusIndicator) setUserAvailable(size(filter(compRepStatus.users, { online: true })) > 0);
  }, [compRepStatus]);

  useEffect(() => {
    if (GAIntervalTime) {
      clearInterval(GAIntervalTime);
      GAIntervalTime = null;
    }
    GAIntervalTime = setInterval(() => {
      if (typeof window.ga === 'function') {
        window.ga('set', 'page', window.location.pathname + window.location.hash);
        window.ga('send', 'pageview');
      }
    }, 240000);
    return () => {
      if (GAIntervalTime) {
        clearInterval(GAIntervalTime);
        GAIntervalTime = null;
      }
    };
  }, []);

  const data = {
    exhibitorId: id,
    streamProvider,
    videoURL,
    exhibitorDescription,
    offer,
    liveStreamUrl,
    offerLink,
    externalLiveStreamingEnabled,
    exhibitorFieldsInJson,
    meetingPassword,
    isShowChimeStream,
    requireApprovalBeforeAttendeesCanJoin,
    meetingEntryExitNotificationOn,
    userRoleDetails,
    localUserExpoVisitData,
  };

  const updateExpoVisitTime = (visitTime) => {
    expoVisitTime = visitTime;
  };

  return (
    <>
      {size(exhibitor) && (
        <div className="exhibitor_portal">
          <div className="content-wrapper-front">
            <Row>
              <Col
                className={cx(
                  `col-md-12 expo`,
                  expoBannerImage && 'expo-banner-available',
                  categoryName && 'expo-category-available',
                )}
                id="people_tab_all-tab"
              >
                <Col>
                  <Col className={cx('exhibitor-logo-box', !expoBannerImage && 'white-box')}>
                    <div className={cx('expo-profile')}>
                      {expoBannerImage && (
                        <AEImage
                          rootClassName="expo-banner-image"
                          dpr="auto"
                          crop="fill"
                          sizes="100vw"
                          fetchFormat="auto"
                          quality="auto"
                          cloudName={cloudinary_name}
                          type="fetch"
                          secure
                          responsive
                          publicId={`${IMAGE_URL}${expoBannerImage}`}
                        />
                      )}
                      <div className="expo-profile-inner">
                        <div>
                          <AEButton
                            onClick={() => history.push(`/e/${eventURL}/portal/expo`)}
                            id="angleLeft"
                            size="small"
                            className="secondary hover_focus_effect_1 custom-btn-icon"
                            aria-label="Back"
                            color={'#1E2137'}
                          >
                            <AEIcon svgIcon="icon-arrow-left" viewBox={'0 0 18 12'} />
                          </AEButton>
                        </div>
                        {!expoBannerImage ? (
                          <div className="user-name">
                            {showBoothName && (
                              <AELabel
                                variant={'subtitle'}
                                color={nameTextColor}
                                labelClass="label-ellipsis line-3 ex-title-name"
                                header={exhibitorName}
                              />
                            )}
                            {categoryName && (
                              <>
                                <br />
                                <AELabel
                                  variant={'captions'}
                                  color={categoryTextColor}
                                  labelClass="label-ellipsis ex-tag-line"
                                  header={categoryName}
                                />
                              </>
                            )}
                          </div>
                        ) : (
                          ''
                        )}
                      </div>
                    </div>
                  </Col>
                  <Col className="exhibitor-tabs main-content-layout">
                    {userTicketTypeIds && (
                      <ExpoTabs
                        data={data}
                        callBackOfTabChange={(data) => callBackOfTabChange(data)}
                        setVideoPlayed={setVideoPlayed}
                        pushDataToKinesis={pushDataToKinesis}
                        updateExpoVisitTime={updateExpoVisitTime}
                        languageCodeLabelsforExpo={get(
                          props,
                          'languageLabelprops.data.host.languageCodeLabelsforExpo',
                          [],
                        )}
                        trackUserExpoVisitData={trackUserExpoVisitData}
                        exhibitorFieldsInJson={exhibitorFieldsInJson}
                        setRequestMeeting={setRequestMeeting}
                        trackProductViewAndExpoVisitEvent={trackProductViewAndExpoVisitEvent}
                        handlePushDataToDynamoDB={handlePushDataToDynamoDB}
                        id={id}
                        autoPlayPromoVideo={autoplayPromoVideo}
                      />
                    )}
                  </Col>
                  {isShowOtherDetails ? (
                    <>
                      {isShowDocumentLink && (
                        <Col className="doc-link-box white-box clear-both">
                          <DocumentLink
                            data={{
                              linkToSite: exhibitor && exhibitor.linkToSite,
                              socialLinks,
                              documentKeyValue,
                              addLinksInJson,
                            }}
                            exhibitorId={Number(exhibitorId)}
                            eventId={eventDetails.eventId}
                            pushDataToKinesis={pushDataToKinesis}
                            setUserExpoVisitData={setUserExpoVisitData}
                            userExpoVisitData={localUserExpoVisitData}
                            virtualEventSettings={virtualEventSettings}
                            handlePushDataToDynamoDB={handlePushDataToDynamoDB}
                          />
                        </Col>
                      )}
                      <Col className="comp-represent-list white-box clear-both">
                        {chatEnabled && showStatusIndicator && (
                          <div className="exp-status pull-right">
                            <span className={cx('ex-status-label', userAvailable ? 'available' : 'away')}>
                              <span>{userAvailable ? t('common:available') : t('common:away')}</span>
                            </span>
                          </div>
                        )}
                        <CompRepresent
                          data={{
                            exhibitorId: id,
                            autoGenerateLead,
                            staffUserIds,
                            chatEnabled,
                            compRepresentativeTitle: get(exhibitorFieldsInJson, 'companyRepresentativeTitle'),
                          }}
                          pushDataToKinesis={pushDataToKinesis}
                          setUserExpoVisitData={setUserExpoVisitData}
                          userExpoVisitData={localUserExpoVisitData}
                          showStatusIndicator={showStatusIndicator}
                          virtualEventSettings={virtualEventSettings}
                        />
                      </Col>
                    </>
                  ) : (
                    ''
                  )}
                </Col>
              </Col>
            </Row>
          </div>
          <BrowserNotificationModel
            messageTitle={messageTitle}
            messageOptions={messageOptions}
            handleOnCloseNotification={() => handleOnCloseNotification()}
          />
        </div>
      )}
      <AEPopup
        id="session-authentication-error"
        showModal={isShowPopUp}
        headerText={'Error'}
        headerClass="m-b-30"
        onCloseFunc={() => returnToEventPage()}
        backdrop="static"
        modelFooter={
          <div>
            <AEButton variant="danger" onClick={() => returnToEventPage()}>
              Close
            </AEButton>
          </div>
        }
      >
        <div className="text-align-center">{isErrorMessage}</div>
      </AEPopup>
    </>
  );
}
const mapDispatchToProps = {
  getEventExhibitor,
  setChannelDetails,
  setUserExpoVisitData,
  isChimeMeetingStarted,
  logExpoVisitedData,
  doGetLabelsByLanguageCodeForExpo,
  logExpoVisitorLeaveData,
  getUserTicketTypeIdsByEventUrl,
  getCurrentSystemDate,
  getCompanyRepresentatives,
};
const mapStateToProps = (state) => ({
  compRepStatus: state.exhibitor.compRepStatus,
  exhibitor: state.exhibitor.exhibitor,
  eventDetails: getEventData(state) || getHostEventData(state),
  user: getUserSession(state),
  userExpoVisitData: getUserExpoVisitData(state),
  languageLabelprops: storeLanguageCodeLabelsForExpo(state),
  virtualEventSettings: selectorVirtualEventSettings(state),
  userRoleDetails: getUserRoleDetails(state),
  userTicketTypeIds: getUserTicketTypeIds(state),
});

export default compose(
  withApollo,

  graphql(subscribeExpoPushNotification, {
    options: () => ({ client: notificationsExpo }),

    name: 'subscribeExpoPushNotification',
  }),

  connect(mapStateToProps, mapDispatchToProps),
)(WithParams(ExhibitorPage));
