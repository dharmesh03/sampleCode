import React from 'react';
import { connect } from 'react-redux';
import cx from 'classnames';
import isEmpty from 'lodash/isEmpty';
import { Helmet } from 'react-helmet/es/Helmet';
import { sessionService } from 'redux-react-session';
import { imgUrl as IMAGE_URL, cloudinary_name, TOP_LOGO_IMAGE_BLACK } from '../../clientConfig';
import AEImage from '../../Core/Image';
import { whiteLabelURL, storeEventData } from '../event/action/index';
import { storeLoginData, storeToken } from '../login/action/index';
import LoginModal from '../../components/LoginModal/index';
import PopupModal from '../../components/PopupModal';
import { createNewEventRegular } from '../admin/event/action/index';
import EventListingFooter from '../../components/EventListingFooter/EventListingFooter';
import AEButton from '../../Core/Button/Button';

import WithParams from '../../components/WrapperComponents/WithParams';
import { clearLocalStorage, getLocalStorage } from '../../components/Widget/Utility/Utility';

class WLInformation extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      showCreateEventConfirmationPopup: false,
      message: '',
      isError: false,
      title: null,
    };
  }

  componentDidMount() {
    this.initializeEventInfo();
  }

  initializeEventInfo = async () => {
    const data = {};
    const { type } = this.props;
    const title =
      type === 'termsOfService'
        ? 'Terms of Services'
        : type === 'privacyPolicy'
        ? 'Privacy Policy'
        : type === 'aboutUs'
        ? 'About Us'
        : type === 'sellTickets'
        ? 'Sell Tickets'
        : 'Event Search';
    if (!isEmpty(getLocalStorage('userId')) && !isEmpty(getLocalStorage('token'))) {
      this.props.storeLoginData(getLocalStorage('user'));
      this.props.storeToken(getLocalStorage('token'));
      sessionService.saveSession(getLocalStorage('token'));
      sessionService.saveUser(getLocalStorage('user'));
      this.setState({
        userSignedIn: true,
      });
    } else {
      this.setState({
        userSignedIn: false,
      });
    }
    await this.props.storeEventData(data);
    this.setState({ title });
  };

  toggleSignInPopup = () => {
    const { showSignIn } = this.state;
    this.setState({
      showSignIn: !showSignIn,
    });
    if (!isEmpty(getLocalStorage('userId')) && !isEmpty(getLocalStorage('token'))) {
      this.setState({
        userSignedIn: true,
      });
    } else {
      this.setState({
        userSignedIn: false,
      });
    }
  };

  signOut = () => {
    clearLocalStorage();
    sessionService.deleteSession();
    sessionService.deleteUser();
    this.setState({
      userSignedIn: false,
    });
    window.location.reload();
  };

  createEvent = () => {
    const { whiteLabelUrl } = this.props;
    if (whiteLabelUrl) {
      this.props.history.push(`/u/wl-signup/${whiteLabelUrl}`);
    } else {
      this.props.history.push(`/u/signup`);
    }
  };

  redirectToEventsPage = () => {
    const { whiteLabelUrl } = this.props;
    const redirectUrl = whiteLabelUrl ? `/events/${whiteLabelUrl}` : `/events`;
    window.location = redirectUrl;
  };

  toggleCreateEventConfirmationPopup = () => {
    const { showCreateEventConfirmationPopup, userSignedIn } = this.state;
    if (userSignedIn) {
      this.setState({
        showCreateEventConfirmationPopup: !showCreateEventConfirmationPopup,
      });
    } else {
      this.redirectToSignUpPage();
    }
  };

  redirectToSignUpPage = () => {
    const { whiteLabelUrl } = this.props || {};
    const url = whiteLabelUrl ? `/u/wl-signup/${whiteLabelUrl}` : `/u/signup`;
    window.location = url;
  };

  clearMessage() {
    setTimeout(() => {
      this.setState({
        message: '',
        isError: false,
      });
    }, 3000);
  }

  createNewEventRegular = () => {
    const { whiteLabelUrl } = this.props || {};
    this.setState({ isCreateEventButtonLoading: true });
    const { isCreateEventButtonLoading } = this.state;
    if (whiteLabelUrl && !isCreateEventButtonLoading) {
      this.props.createNewEventRegular(whiteLabelUrl).then((resp) => {
        this.setState({ isCreateEventButtonLoading: false });
        if (resp && resp.message) {
          this.setState(
            {
              message: resp.message,
              isError: false,
            },
            () => {
              this.clearMessage();
              const path = `/host/eventsetup?utm_source=Web App&utm_medium=Referral&utm_term=${
                document.title || ''
              }&utm_campaign=''&utm_content=Is Participant`;
              window.location.replace(path);
            },
          );
        } else if (resp && resp.errorCode === '4010101') {
          window.location.replace(
            `/u/signup??utm_source=Web App&utm_medium=Referral&utm_term=${
              document.title || ''
            }&utm_campaign=''&utm_content=Is Participant`,
          );
        } else {
          this.setState(
            {
              message: (resp && resp.errorMessage) || 'Something went to Wrong',
              isError: true,
            },
            () => {
              this.clearMessage();
            },
          );
        }
      });
    }
  };

  getInformation = () => {
    const { type, whiteLabelInformation } = this.props;
    const { termsOfService, privacyPolicy, aboutUs, sellEventTicketsPage } = whiteLabelInformation || {};
    switch (type) {
      case 'termsOfService':
        return termsOfService;
      case 'privacyPolicy':
        return privacyPolicy;
      case 'aboutUs':
        return aboutUs;
      case 'sellTickets':
        return sellEventTicketsPage;
      default:
        return '';
    }
  };

  render() {
    const { whiteLabelUrl, iswhiteLabelEventList, authenticated, whiteLabelInformation } = this.props;
    const {
      headerLogoImage: eventLogo,
      firmName,
      termsOfService,
      privacyPolicy,
      aboutUs,
      facebookShare,
      twitterShare,
      sellEventTicketsPage,
      isHeaderLogoAvailabel,
      hideCreateEventButton,
    } = whiteLabelInformation || {};
    const information = this.getInformation();
    const {
      showSignIn,
      showCreateEventConfirmationPopup,
      message,
      isError,
      title,
      isCreateEventButtonLoading,
    } = this.state;
    if (!isHeaderLogoAvailabel) {
      return null;
    }

    return (
      <div className="wl-info-page-background">
        {title ? (
          <Helmet>
            <meta property="og:title" content={title} />
            <meta property="og:image:alt" content={title} />
            <meta name="twitter:title" content={title} />
            <title>{title}</title>
          </Helmet>
        ) : (
          ''
        )}
        <div className="wl-info-body">
          <div className="col-md-12 p-t-20 m-b-60">
            <div className="col-xs-4 col-lg-8">
              {isHeaderLogoAvailabel && !authenticated ? (
                <AEImage
                  className={cx(
                    'normal-logo cursor',
                    eventLogo ? 'header-logo-custome-height' : 'default-accelevents-header-logo',
                  )}
                  dpr="auto"
                  crop="scale"
                  sizes="100vw"
                  cloudName={cloudinary_name}
                  type="fetch"
                  fetchFormat="auto"
                  quality="auto"
                  secure
                  responsive
                  publicId={`${IMAGE_URL}${eventLogo || TOP_LOGO_IMAGE_BLACK}`}
                  onClick={() => this.redirectToEventsPage()}
                />
              ) : (
                ''
              )}
            </div>
            <div className={cx(authenticated && 'hidden')}>
              {!hideCreateEventButton && (
                <AEButton
                  className="fution-btn"
                  onClick={() => {
                    this.toggleCreateEventConfirmationPopup();
                  }}
                  id="createEventbtn"
                >
                  Create Event
                </AEButton>
              )}
              {!authenticated && (
                <AEButton id="signInbtn" className="fution-btn m-l-50" onClick={this.toggleSignInPopup}>
                  Sign In
                </AEButton>
              )}
              {authenticated && (
                <AEButton id="signOutbtn" className="fution-btn m-l-50" onClick={this.signOut}>
                  Sign Out
                </AEButton>
              )}
            </div>
          </div>
          <div>
            <div dangerouslySetInnerHTML={{ __html: information }} />
          </div>
        </div>
        <div>
          {whiteLabelInformation && (
            <EventListingFooter
              eventLogo={eventLogo}
              firmName={firmName}
              iswhiteLabelEventList={iswhiteLabelEventList}
              termsOfService={termsOfService}
              privacyPolicy={privacyPolicy}
              aboutUs={aboutUs}
              facebookShare={facebookShare}
              twitterShare={twitterShare}
              whiteLabelUrl={whiteLabelUrl}
              sellEventTicketsPage={sellEventTicketsPage}
              isHeaderLogoAvailabel={isHeaderLogoAvailabel}
              whiteLabelInformation={whiteLabelInformation}
            />
          )}
        </div>
        {showSignIn && (
          <div>
            <LoginModal
              showModal={showSignIn}
              showPhoneNumModal={this.showPhoneNumModal}
              showType="login"
              onCloseFunc={this.toggleSignInPopup}
              isEventSearch
              whiteLabelUrlProps={whiteLabelUrl}
              modelFooter={
                <AEButton
                  block
                  data-dismiss="modal"
                  onClick={() => {
                    this.toggleSignInPopup();
                  }}
                >
                  Close
                </AEButton>
              }
            />
          </div>
        )}
        <PopupModal
          id="createEventConfirmationPopup"
          showModal={showCreateEventConfirmationPopup}
          headerText={<p>Please confirm</p>}
          onCloseFunc={this.toggleCreateEventConfirmationPopup}
          modelFooter={
            <div>
              <AEButton
                variant="success"
                className="m-r-5"
                onClick={() => {
                  this.createNewEventRegular();
                }}
                loading={isCreateEventButtonLoading}
              >
                Create New Event
              </AEButton>
              <AEButton variant="danger" onClick={this.toggleCreateEventConfirmationPopup}>
                Close
              </AEButton>
            </div>
          }
        >
          <div className="modal-body">
            {message && (
              <div className={cx('alert text-center mrg-b-lg', isError ? 'alert-danger' : 'alert-success')}>
                {message}
              </div>
            )}
            <p>
              {`Are you hosting another event? Clicking`}
              <strong> Create New Event </strong>
              {`will create a brand new event.`}
            </p>
          </div>
        </PopupModal>
      </div>
    );
  }
}

const mapDispatchToProps = {
  whiteLabelURL: (url) => whiteLabelURL(url),
  createNewEventRegular: (whiteLabelUrl) => createNewEventRegular(whiteLabelUrl),
  storeEventData,
  storeLoginData,
  storeToken,
};
const mapStateToProps = (state) => ({
  authenticated: state?.session?.authenticated,
  whiteLabelInformation: state?.whiteLablesetting?.whiteLabelInformation,
});

export default connect(mapStateToProps, mapDispatchToProps)(WithParams(WLInformation));
