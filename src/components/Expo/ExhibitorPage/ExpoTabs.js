import React, { useEffect, useState } from 'react';
import { Col } from 'react-bootstrap';
import ReactPlayer from 'react-player';
import { connect } from 'react-redux';
import cx from 'classnames';
import get from 'lodash/get';
import map from 'lodash/map';
import filter from 'lodash/filter';
import cloneDeep from 'lodash/cloneDeep';
import forEach from 'lodash/forEach';
import size from 'lodash/size';
import moment from 'moment';
import { useTranslation } from 'react-i18next';
import { VIDEO_PROGRESS_INTERVAL_CALL } from '../../../clientConfig';
import { getEventData } from '../../../routes/event/action/selector';
import { getExhibitorProduct } from '../../../routes/event/portal/mybooth/action';
import { getUserSession, getExpoProducts } from '../../../routes/login/action/selector';
import { addDataToKinesis } from '../../../routes/exhibitorPortal/action';
import { defaultExhibitorDefaultSettings } from '../../../constants/constData';
import ExpoProducts from './ExpoProducts';
import ZoomEmbed from '../../EmbededVideoStream/ZoomEmbed';
import {
  selectorVirtualEventSettings,
  getUserTicketTypeIds,
  isPipMode as isPipModeVideoDetail,
} from '../../../routes/event/action/selectorVirtualEvent';
import { isPipMode } from '../../../routes/event/action/portalAction';
import Exhibitorroom from '../../Aws-Chime/components/Exhibitorroom';
import CreateLead from './CreateLead';
import AEButton from '../../../Core/Button/Button';
import { AETabs, AETab } from '../../../Core/Tab';
import AEIcons from '../../../Core/Icon/index';
import { storeWarnUserOnPageLeave } from '../../../routes/admin/action';
import {
  EXHIBITOR_OFFER_LINK_CLICK,
  JOIN_EXPO_MEETING,
  PLAYED_EXPO_VIDEO,
} from '../../../routes/exhibitorPortal/action/userActivityEventConstant';
import AEPopup from '../../../Core/Popup';
import FacebookPlayer from '../../EmbededVideoStream/VideoPlayer/FacebookPlayer';

let videoDurationCounter = 0;
let isVideoPlayed = false;
const VIDEO_PROGRESS_INTERVAL = parseInt(VIDEO_PROGRESS_INTERVAL_CALL, 10);
function ExpoTabs(props) {
  const { pipModeVideo } = props || {};
  const { showPipModeVideo } = pipModeVideo || {};
  const { t } = useTranslation(['exhibitor', 'common', 'chime']);
  const [activeTab, setActiveTab] = useState('');
  const [hasLiveTabActived, setHasLiveTabActived] = useState(false);
  const [preventTabChage, setPreventTabChage] = useState(false);
  const [tabList, setTabList] = useState(null);
  const [joinMeeting, setJoinMeeting] = useState(false);
  const [confirmationPopup, setConfirmationPopup] = useState(false);
  const [confirmationMessage, setConfirmationMessage] = useState('');
  const {
    data,
    user,
    userTicketTypeIds,
    callBackOfTabChange,
    eventData,
    pushDataToKinesis,
    virtualEventSettings,
    setRequestMeeting,
    languageCodeLabelsforExpo,
    id,
    expoProducts,
    autoPlayPromoVideo,
  } = props || {};

  const {
    videoURL,
    exhibitorDescription,
    offer,
    offerLink,
    externalLiveStreamingEnabled,
    exhibitorFieldsInJson,
    streamProvider,
    liveStreamUrl,
    meetingPassword,
    exhibitorId,
    isShowChimeStream,
    userRoleDetails,
    localUserExpoVisitData,
  } = data;
  const { buttonTextColorConfiguration } = virtualEventSettings || {};
  const { virtualHubTabTextColor } = buttonTextColorConfiguration || {};
  useEffect(
    () => () => {
      if (
        userRoleDetails &&
        !(userRoleDetails.admin || userRoleDetails.staff || userRoleDetails.exhibitor) &&
        localUserExpoVisitData
      ) {
        props.updateExpoVisitTime(videoDurationCounter);
        isVideoPlayed = false;
      }
    },
    [],
  );

  const handleExpoVisitData = (videoDurationCounter) => {
    if (virtualEventSettings && virtualEventSettings.gamificationNewFlow) {
      const { eventId } = eventData || {};
      const { userId } = user || {};
      const expoId = parseInt(exhibitorId, 10);
      const userExpoVisitData = {
        eventId,
        userId,
        gameType: '',
        area: 'EXPO',
        expoId,
        date: moment.utc().format('YYYY-MM-DDTHH:mm:ss'),
        videoDuration: videoDurationCounter,
        ticketTypeIds: size(userTicketTypeIds) > 0 ? userTicketTypeIds : [],
      };
      if (eventId && userId && expoId) {
        addDataToKinesis(userExpoVisitData, true);
      }
    }
  };

  const generateExpoVisitData = (videoDuration) => {
    if (videoDuration > 0 && videoDuration < VIDEO_PROGRESS_INTERVAL && pushDataToKinesis) {
      handleExpoVisitData(videoDuration);
      videoDurationCounter = 0;
    }
  };

  const changeTab = (key) => {
    if (activeTab === 'VIDEO' && key !== 'VIDEO') {
      generateExpoVisitData(videoDurationCounter);
    }
    if (preventTabChage) {
      return;
    }
    setActiveTab(key);
    if (key === 'LIVE' && !hasLiveTabActived) setHasLiveTabActived(true);
    callBackOfTabChange(key);
  };

  const videoPause = () => {
    generateExpoVisitData(videoDurationCounter);
  };

  const storeVideoPlayback = () => {
    videoDurationCounter += 1;
    if (videoDurationCounter >= VIDEO_PROGRESS_INTERVAL && pushDataToKinesis) {
      props.setVideoPlayed && props.setVideoPlayed();
      handleExpoVisitData(videoDurationCounter);
      videoDurationCounter = 0;
    }
  };

  const handleExpoVideoPlayed = () => {
    if (virtualEventSettings && virtualEventSettings.gamificationNewFlow && pushDataToKinesis) {
      const { eventId } = eventData || {};
      const { userId } = user || {};
      const expoId = parseInt(exhibitorId, 10);
      const userExpoVisitData = {
        eventId,
        userId,
        gameType: '',
        area: 'EXPO',
        expoId,
        date: moment.utc().format('YYYY-MM-DDTHH:mm:ss'),
        videoPlayed: true,
        ticketTypeIds: size(userTicketTypeIds) > 0 ? userTicketTypeIds : [],
      };
      if (eventId && userId && expoId) {
        addDataToKinesis(userExpoVisitData, true);
        isVideoPlayed = true;
      }
    }
  };

  const videoPlay = () => {
    videoDurationCounter = 0;
    if (!isVideoPlayed) {
      handleExpoVideoPlayed();
      props.handlePushDataToDynamoDB(PLAYED_EXPO_VIDEO, { link: window.location.href });
    }
  };

  const videoEnded = () => {
    generateExpoVisitData(videoDurationCounter);
  };
  const checkFacebookUrl = videoURL?.includes('facebook.com') || videoURL?.includes('/fb.watch');
  const videoTab = () => (
    <Col className={cx('white-box fix-height')}>
      {checkFacebookUrl ? (
        <div className={'expo-videoPlayer'}>
          <FacebookPlayer
            videoId={videoURL}
            id={'facebook'}
            loop={false}
            parentClassName={'expo-videoPlayer'}
            appId={'1309697205772819'}
            onLoaded={() => {}}
            data-autoplay={'true'}
            className="react-player "
            autoplay
            onError={(e, data) => {
              console.log('Video FACEBOOK player Error ', e, data);
            }}
            playsinline
            controls
          />
        </div>
      ) : (
        <div className={'expo-videoPlayer'}>
          <ReactPlayer
            url={videoURL}
            width="100%"
            volume={1}
            controls
            className={cx('react-player')}
            playing={autoPlayPromoVideo}
            onPlay={videoPlay}
            onProgress={storeVideoPlayback}
            onPause={videoPause}
            onEnded={videoEnded}
            stopOnUnmount
            config={{ youtube: { playerVars: { start: 0 } } }}
          />
        </div>
      )}
    </Col>
  );

  const closePopup = () => {
    setConfirmationMessage('');
    setConfirmationPopup(false);
  };

  const allowToJoin = async () => {
    await props.isPipMode({ isChimeMeetingPipMode: false, showPipModeVideo: false });
    closePopup();
    setJoinMeeting(true);
  };

  const joinZoomMeeting = (value) => {
    if (showPipModeVideo) {
      setConfirmationMessage(t('chime:Joining this session will close your Picture in Picture window.'));
      setConfirmationPopup(true);
    } else {
      setJoinMeeting(value);
      props.handlePushDataToDynamoDB(JOIN_EXPO_MEETING, { meeting: 'ZOOM', link: window.location.href });
    }
  };

  const setUrl = (url) => (url.startsWith('http') ? url : `https://${url}`);

  const handleOfferLinkClick = () => {
    props.handlePushDataToDynamoDB(EXHIBITOR_OFFER_LINK_CLICK, { link: offerLink });
  };

  const liveStreamTab = () =>
    streamProvider === 'ACCELEVENTS' ? (
      <div className="fix-height">
        {activeTab === 'LIVE' && (
          <Exhibitorroom
            exhibitorId={exhibitorId}
            exhibitor={data}
            params={{ params: eventData.eventURL }}
            isFrom={'EXHIBITOR-PORTAL'}
            trackUserExpoVisitData={props.trackUserExpoVisitData}
            handlePushDataToDynamoDB={props.handlePushDataToDynamoDB}
          />
        )}
      </div>
    ) : liveStreamUrl && joinMeeting ? (
      <div className={'livestream fix-height'}>
        <Col className=" videoWrapper">
          <ZoomEmbed
            zoomMeetingPassword={meetingPassword}
            key={liveStreamUrl}
            meetingNumber={liveStreamUrl}
            isFrom={'booth'}
            exhibitorId={exhibitorId}
            eventUrl={eventData.eventURL}
            user={user}
            joinZoomMeeting={() => {
              joinZoomMeeting(false);
            }}
            preventTabChange={() => setPreventTabChage(true)}
          />
        </Col>
      </div>
    ) : (
      <Col className="white-box fix-height">
        <AEButton
          onClick={() => {
            joinZoomMeeting(true);
          }}
          label={t('common:Join Meeting')}
          id="mettinJoinButton"
        />
      </Col>
    );

  const descTab = () => (
    <Col
      className="white-box fr-view fix-height clearfix"
      dangerouslySetInnerHTML={{
        __html: exhibitorDescription,
      }}
    />
  );
  const offerTab = () => (
    <div className="white-box fr-view fix-height">
      {offer && (
        <Col
          className="clearfix fr-view"
          dangerouslySetInnerHTML={{
            __html: offer,
          }}
        />
      )}
      {offerLink && (
        <Col className="m-t-25">
          <ul className="doc-list p-0">
            <li className="doc-box">
              <a
                role="button"
                target="_blank"
                rel="noopener noreferrer"
                className="outline_offset_2 d-flex doc-data"
                onClick={handleOfferLinkClick}
                href={setUrl(offerLink)}
                id="offerLink"
              >
                <AEIcons type="icon fa fa-link" />
                <span id="link">{t('Offer Link')}</span>
              </a>
            </li>
          </ul>
        </Col>
      )}
    </div>
  );

  const renderTabContent = (tabItem) => {
    switch (tabItem.key) {
      case 'LIVE':
        return (
          externalLiveStreamingEnabled &&
          streamProvider &&
          ((streamProvider === 'ZOOM' && liveStreamUrl) || (streamProvider === 'ACCELEVENTS' && isShowChimeStream)) && (
            <AETab
              key={tabItem.key}
              eventKey={tabItem.key}
              title={t(`common:${tabItem.value}`)}
              id={`${tabItem && tabItem.value && tabItem.value.replace(' ', '_')}`}
              role="tabpanel"
              tabIndex="0"
            >
              {(hasLiveTabActived || activeTab === 'LIVE') && (
                <div className={'tab-content m-t-10'}>{liveStreamTab()}</div>
              )}
            </AETab>
          )
        );
      case 'VIDEO':
        return (
          videoURL && (
            <AETab
              key={tabItem.key}
              eventKey={tabItem.key}
              title={t(`common:${tabItem.value}`)}
              id={`${tabItem && tabItem.value && tabItem.value.replace(' ', '_')}`}
              role="tabpanel"
              tabIndex="0"
            >
              {activeTab === 'VIDEO' && <div className={'tab-content m-t-10'}>{videoTab()}</div>}
            </AETab>
          )
        );
      case 'COMPANY_DETAILS':
        return (
          exhibitorDescription && (
            <AETab
              key={tabItem.key}
              eventKey={tabItem.key}
              title={t(`common:${tabItem.value}`)}
              id={`${tabItem && tabItem.value && tabItem.value.replace(' ', '_')}`}
              role="tabpanel"
              tabIndex="0"
            >
              {activeTab === 'COMPANY_DETAILS' && <div className={'tab-content m-t-10'}>{descTab()}</div>}
            </AETab>
          )
        );
      case 'OFFER':
        return (
          (offer || offerLink) && (
            <AETab
              key={tabItem.key}
              eventKey={tabItem.key}
              title={t(`common:${tabItem.value}`)}
              id={`${tabItem && tabItem.value && tabItem.value.replace(' ', '_')}`}
              role="tabpanel"
              tabIndex="0"
            >
              <div className={'tab-content m-t-10'}>{offerTab()}</div>
            </AETab>
          )
        );
      case 'PRODUCTS':
        if (!size(expoProducts)) return false;
        return (
          <AETab
            key={tabItem.key}
            eventKey={tabItem.key}
            title={t(`common:${tabItem.value}`)}
            id={`${tabItem && tabItem.value && tabItem.value.replace(' ', '_')}`}
            role="tabpanel"
            tabIndex="0"
          >
            {activeTab === 'PRODUCTS' && (
              <div className={'tab-content m-t-10'}>
                <ExpoProducts
                  exhibitorId={exhibitorId}
                  tabTitle={t(`common:${tabItem.value}`)}
                  trackProductViewAndExpoVisitEvent={props.trackProductViewAndExpoVisitEvent}
                  handlePushDataToDynamoDB={props.handlePushDataToDynamoDB}
                />
              </div>
            )}
          </AETab>
        );
      default:
        return false;
    }
  };

  const setDefaultActiveTab = (tabList) => {
    let defaultActiveTab = '';
    tabList &&
      map(tabList, (tabItem, key) => {
        switch (tabItem.key) {
          case 'LIVE':
            if (
              !defaultActiveTab &&
              externalLiveStreamingEnabled &&
              streamProvider &&
              (streamProvider === 'ACCELEVENTS' || liveStreamUrl)
            ) {
              defaultActiveTab = tabItem.key;
            }
            break;
          case 'VIDEO':
            if (!defaultActiveTab && videoURL) {
              defaultActiveTab = tabItem.key;
            }
            break;
          case 'COMPANY_DETAILS':
            if (!defaultActiveTab && exhibitorDescription) {
              defaultActiveTab = tabItem.key;
            }
            break;
          case 'OFFER':
            if (!defaultActiveTab && (offer || offerLink)) {
              defaultActiveTab = tabItem.key;
            }
            break;
          case 'PRODUCTS':
            if (!defaultActiveTab && expoProducts && size(expoProducts) > 0) {
              defaultActiveTab = tabItem.key;
            }
            break;
          default:
            break;
        }
        if (size(tabList) - 1 === key) {
          changeTab(defaultActiveTab);
        }
      });
  };

  useEffect(() => {
    if (
      expoProducts &&
      size(expoProducts) > 0 &&
      !(
        externalLiveStreamingEnabled &&
        streamProvider &&
        ((streamProvider === 'ZOOM' && liveStreamUrl) || (streamProvider === 'ACCELEVENTS' && isShowChimeStream))
      ) &&
      !videoURL &&
      !exhibitorDescription &&
      !(offer || offerLink)
    ) {
      setDefaultActiveTab(tabList);
    }
  }, [expoProducts]);

  useEffect(() => {
    if (data) {
      const { eventURL } = eventData;
      const { exhibitorId } = data;
      if (eventURL && exhibitorId) {
        props.getExhibitorProduct(exhibitorId, eventURL);
      }
    }
  }, [data.exhibitorId]);

  useEffect(() => {
    const tabData = cloneDeep(exhibitorFieldsInJson);
    const tablistarray = [];
    forEach(tabData?.tabList, (element) => {
      const tab = languageCodeLabelsforExpo?.find((e) => e.label === element.key && e.expoId === data?.id);
      tab && tablistarray.push({ key: tab.label, value: tab.customLabel });
    });
    exhibitorFieldsInJson && exhibitorFieldsInJson.tabList === tablistarray;
    const tempTabList =
      exhibitorFieldsInJson && size(exhibitorFieldsInJson.tabList) > 0
        ? exhibitorFieldsInJson.tabList
        : defaultExhibitorDefaultSettings && defaultExhibitorDefaultSettings.tabList;
    const checkProductExist = filter(tempTabList, { key: 'PRODUCTS' });
    if (size(checkProductExist) === 0) tempTabList.push({ key: 'PRODUCTS', value: 'Products' });
    setTabList(tempTabList);
    setDefaultActiveTab(tempTabList);
  }, [exhibitorFieldsInJson]);

  return (
    <>
      <div className="create-lead-btn">
        {!get(exhibitorFieldsInJson, 'requestMeeting.hide') && (
          <CreateLead
            data={{ exhibitorId: id, exhibitorFieldsInJson }}
            pushDataToKinesis={pushDataToKinesis}
            setRequestMeeting={setRequestMeeting}
          />
        )}
      </div>
      <AETabs
        onSelect={(data) => changeTab(data)}
        tabColor={virtualHubTabTextColor || '#6D6F7D'}
        preventTabChage={preventTabChage}
        warnUserOnStateUpdate={props.warnUserOnStateUpdate}
        storeWarnUserOnPageLeave={props.storeWarnUserOnPageLeave}
        className={cx(
          liveStreamUrl && videoURL && exhibitorDescription && (offer || offerLink) ? 'mob-layout-portal-tabs' : '',
          'portal-class expo-company-details',
        )}
        isAdvance
        activeKey={activeTab}
        tabListAriaLabel="Exhibitor Tabs"
      >
        {map(tabList, (tabItem, key) => renderTabContent(tabItem, key))}
      </AETabs>
      <AEPopup
        onCloseFunc={() => closePopup()}
        id="confirmationPopup"
        showModal={confirmationPopup}
        headerText={t('common:Confirm')}
        headerClass="m-b-30"
        modelFooter={
          <div>
            <AEButton
              className="m-r-5"
              onClick={() => {
                allowToJoin();
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  allowToJoin();
                }
              }}
              aria-label={`${confirmationMessage}`}
            >
              {t('common:Join Anyway')}
            </AEButton>
            <AEButton
              variant="danger"
              onClick={() => {
                closePopup();
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  closePopup();
                }
              }}
              aria-label={`${confirmationMessage}`}
            >
              {t('common:Cancel')}
            </AEButton>
          </div>
        }
      >
        <div className="center-align">
          <p className="text-center">{confirmationMessage}</p>
        </div>
      </AEPopup>
    </>
  );
}

const mapStateToProps = (state) => ({
  user: getUserSession(state),
  eventData: getEventData(state),
  expoProducts: getExpoProducts(state),
  virtualEventSettings: selectorVirtualEventSettings(state),
  userTicketTypeIds: getUserTicketTypeIds(state),
  warnUserOnStateUpdate: state.host && state.host.warnUserOnStateUpdate,
  pipModeVideo: isPipModeVideoDetail(state),
});
const mapDispatchToProps = {
  getExhibitorProduct,
  storeWarnUserOnPageLeave: (stateChanged) => storeWarnUserOnPageLeave(stateChanged),
  isPipMode,
};
export default connect(mapStateToProps, mapDispatchToProps)(ExpoTabs);
