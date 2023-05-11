import React, { useEffect } from 'react';
import { connect } from 'react-redux';
import get from 'lodash/get';
import { Helmet } from 'react-helmet';
import { useTranslation } from 'react-i18next';
import cx from 'classnames';
import { doGetEventData } from '../../../routes/event/action';
import { getEventExhibitor } from '../../../routes/exhibitorPortal/action/index';
import { toggleWebChatSitebar } from '../../Widget/Utility/jsFunction';
import { getUserRoleAndAllowAttendee } from '../../../routes/event/action/portalAction';
import { getUserRoleDetails, selectorVirtualEventSettings } from '../../../routes/event/action/selectorVirtualEvent';
import { getUserSession, isAuthenticated } from '../../../routes/login/action/selector';
import { getEventData } from '../../../routes/event/action/selector';
import WithParams from '../../WrapperComponents/WithParams';
import { setChannelDetails } from '../../StageDetails/action/index';
import WebChat from '../../WebChat';
import { cloudinary_name, imgUrl as IMAGE_URL } from '../../../clientConfig';
import Exhibitorroom from '../../Aws-Chime/components/Exhibitorroom';
import GAFacebookTrackHOC from '../../WrapperComponents/GAFacebookTrackHOC';
import AEIcons from '../../../Core/Icon/index';
import AESpinner from '../../../Core/Spinner/Spinner';
import AELabel from '../../../Core/Label/label';
import AEImage from '../../../Core/Image';
import { getAttendeeDetails } from '../../../routes/event/portal/Lobby/AttendeeDetails/action';
import connectFeed from '../../../hoc/connectFeed';
import AEButton from '../../../Core/Button/Button';
import { getVirtualEventSettingsFromCache } from '../../../routes/event/action/cache';

let GAIntervalTime = null;
function ExhibitorStudio(props) {
  const { i18n } = useTranslation();
  const {
    params,
    user,
    eventData,
    activeType,
    exhibitor,
    exhibitorId,
    userRoleDetails,
    authenticated,
    virtualEventSettings,
  } = props;

  const getEventExhibitor = () => {
    props.getEventExhibitor(params.params, Number(exhibitorId)).then(async (resp) => {
      const exhibitor = resp;
      if (exhibitor) {
        await props.setChannelDetails({
          id: exhibitor.id,
          name: exhibitor.exhibitorName,
          activeType,
        });
      } else {
        await props.setChannelDetails({
          id: '',
          name: '',
          activeType,
        });
      }
    });
  };

  useEffect(() => {
    if (params) {
      if (!userRoleDetails) {
        props.getUserRoleAndAllowAttendee(params.params);
      }
      props.doGetEventData(params.params).then(async () => {
        getEventExhibitor();
        await props.getAttendeeDetails(params.params).then((attende) => {
          if (attende && attende.data && !attende.data.errorMessage) {
            if (!virtualEventSettings) {
              props.getVirtualEventSettingsFromCache(params.params).then((resp) => {
                if (resp && !resp.errorMessage) {
                  const languageCode = attende.data?.languageCode || resp?.labelLanguageCode || 'EN';
                  i18n.changeLanguage(languageCode?.toLowerCase() || 'en');
                }
              });
            }
          }
        });
        props.initializeFeedClient(params.params);
      });
    }
  }, [params]);

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

  return (
    <div className="exhibitor-studio video-custom">
      <Helmet
        style={[
          {
            cssText: `#mainSiteLoader {display: none !important}`,
          },
        ]}
      />
      {authenticated ? (
        <div className="portal-layout-main">
          <div className="fix-content-width">
            {exhibitor && userRoleDetails ? (
              <Exhibitorroom exhibitorId={exhibitorId} exhibitor={exhibitor} params={params} isExhibitoreStudio />
            ) : (
              <div className="text-align-center">
                <AESpinner type="SpinnerSmall" />
              </div>
            )}
          </div>
          {eventData && exhibitor && (
            <div className={'inherit-height-sticky-sidebar chat-side-bar-z-index'}>
              <div id={'webChatSidebar'} className={`web-chat-sidebar`}>
                <div className={'hidden-webchat-toggle'}>
                  <AEIcons type="fa fa-angle-left" onClick={toggleWebChatSitebar} />
                </div>

                <div className={cx('active-hide', exhibitor.logo ? 'set-sidebar-toggle' : 'hide-sponsor-slide')}>
                  <div className={'postal-profile-dropdown'}>
                    {exhibitor.logo && (
                      <AEImage
                        className={'item-image-inner item-image-inner-img inner-img'}
                        width="350"
                        height="175"
                        dpr="auto"
                        crop="pad"
                        fetchFormat="auto"
                        quality="100"
                        cloudName={cloudinary_name}
                        type="fetch"
                        secure
                        responsive
                        publicId={`${IMAGE_URL}${exhibitor.logo}`}
                      />
                    )}
                    <div className="right-toggle">
                      <AEButton
                        icon="virtual-icon-arrow-right"
                        className={'white-background'}
                        size="exsmall"
                        variant="secondary"
                        onClick={toggleWebChatSitebar}
                      />
                    </div>
                  </div>
                  {user && user.userId && (
                    <WebChat channelName={eventData && eventData.eventId} params={params} activeType={activeType} />
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div>
          <Helmet>
            <meta name="robots" content="noindex" />
            <meta name="googlebot" content="noindex" />
          </Helmet>
          <AELabel header={'Unauthorized'} variant={'heading2'} className="justify-content-center" />
        </div>
      )}
    </div>
  );
}
const mapDispatchToProps = {
  doGetEventData,
  getUserRoleAndAllowAttendee,
  getEventExhibitor,
  setChannelDetails,
  getAttendeeDetails,
  getVirtualEventSettingsFromCache,
};
const mapStateToProps = (state) => ({
  exhibitor: get(state, 'exhibitor.exhibitor'),
  eventData: getEventData(state),
  userRoleDetails: getUserRoleDetails(state),
  user: getUserSession(state),
  authenticated: isAuthenticated(state),
  virtualEventSettings: selectorVirtualEventSettings(state),
});

export default connect(
  mapStateToProps,
  mapDispatchToProps,
)(GAFacebookTrackHOC(WithParams(connectFeed(ExhibitorStudio)), 'PORTAL'));
