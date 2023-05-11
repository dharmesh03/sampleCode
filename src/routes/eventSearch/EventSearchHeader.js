import React from 'react';
import $ from 'jquery';
import cx from 'classnames';
import get from 'lodash/get';
import { sessionService } from 'redux-react-session';
import { MenuItem } from 'react-bootstrap';
import Navbar, { Brand } from 'react-bootstrap/lib/Navbar';
import { connect } from 'react-redux';
import {
  imgUrl as IMAGE_URL,
  cloudinary_name,
  cloudinary_url as CLOUDINARYURL,
  imgUrl as IMG_URL,
  TOP_LOGO_IMAGE_BLACK,
} from '../../clientConfig';
import AEImage from '../../Core/Image';
import PopupModal from '../../components/PopupModal';
import { createNewEventRegular } from '../admin/event/action/index';
import { getTranslations } from '../../components/Widget/systemData/selectors';
import { getWhiteLabelDetailsByHostBaseUrl, whiteLabelURL } from '../event/action/index';
import { setWhiteLabelInformation } from './action/index';
import { isAuthenticated, getUserSession } from '../login/action/selector';
import WithParams from '../../components/WrapperComponents/WithParams';
import AEHeaderNavMenu from '../../Core/HeaderNavMenu';
import AEButton from '../../Core/Button/Button';
import AESpinner from '../../Core/Spinner/Spinner';
import AEIcon from '../../Core/Icon';
import { clearLocalStorage } from '../../components/Widget/Utility/Utility';

const baseDomainUrl =
  window &&
  window.location &&
  `${window.location.protocol}//${window.location.hostname}${window.location.port ? `:${window.location.port}` : ''}`;

class EventSearchHeader extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      showCreateEventConfirmationPopup: false,
      textColor: '#3f69e8',
    };
  }

  UNSAFE_componentWillMount() {
    const { isFrom } = this.props;
    if (
      isFrom === 'homePage' &&
      !(
        baseDomainUrl === 'http://localhost:3000' ||
        baseDomainUrl === 'https://www.devaccel.com' ||
        baseDomainUrl === 'https://www.stagingaccel.com' ||
        baseDomainUrl === 'https://www.accelevents.com'
      )
    ) {
      this.props.getWhiteLabelDetailsByHostBaseUrl(encodeURIComponent(window.location.origin)).then((resp) => {
        if (resp && !resp.errorMessage) {
          const faviconUrl = `${CLOUDINARYURL}/${IMG_URL}${resp.faviconDirectory}`;
          document.getElementById('favicon')?.setAttribute('href', faviconUrl);
        }
        this.props.setWhiteLabelInformation(resp);
        this.setState({
          isLoading: false,
        });
      });
    }
  }

  componentDidMount() {
    const { iswhiteLabelEventList, whiteLabelUrl, isFrom } = this.props;
    let data = {};
    if (
      isFrom === 'homePage' &&
      !(
        baseDomainUrl === 'http://localhost:3000' ||
        baseDomainUrl === 'https://www.devaccel.com' ||
        baseDomainUrl === 'https://www.stagingaccel.com' ||
        baseDomainUrl === 'https://www.accelevents.com'
      )
    ) {
      this.setState({
        isLoading: true,
      });
    }
    if (iswhiteLabelEventList && isFrom !== 'homePage') {
      this.props.whiteLabelURL(whiteLabelUrl).then((resp) => {
        if (resp && !resp.errorMessage) {
          this.setState({
            isHeaderLogoAvailabel: true,
            isLoading: false,
          });
          data = resp;
        }
        if (resp && resp.errorCode === '4040201') {
          window.location.replace('/notFound');
        }
        data.isHeaderLogoAvailabel = true;
        data.isListingBannerImageAvailabel = true;
        this.props.setWhiteLabelInformation(data);
      });
    } else {
      this.setState({
        isHeaderLogoAvailabel: true,
      });
      data.isHeaderLogoAvailabel = true;
      data.isListingBannerImageAvailabel = true;
      this.props.setWhiteLabelInformation(data);
    }
  }

  toggleMenu = () => {
    $('.profile-dropdown').toggleClass('open');
    $(window).scroll(() => {
      const scroll = $(window).scrollTop();
      if (scroll >= 100) {
        $('.profile-dropdown').removeClass('open');
      } else {
        $('.profile-dropdown').removeClass('open');
      }
    });
  };

  redirectToProfile = (path) => {
    this.props.history.push(path);
  };

  logout = () => {
    clearLocalStorage();
    sessionService.deleteSession();
    sessionService.deleteUser();
    setTimeout(() => {
      window.location.reload();
    }, 1000);
  };

  toggleCreateEventConfirmationPopup = () => {
    const { showCreateEventConfirmationPopup } = this.state;
    this.setState({
      showCreateEventConfirmationPopup: !showCreateEventConfirmationPopup,
    });
  };

  createNewEventRegular = () => {
    const { whiteLabelUrl, whiteLabelInformation, user } = this.props;
    const whitelableUrlForCreateEvent = whiteLabelUrl || (whiteLabelInformation && whiteLabelInformation.whiteLabelUrl);
    this.setState({ isCreateEventButtonLoading: true });
    const { isCreateEventButtonLoading } = this.state;
    if (!isCreateEventButtonLoading) {
      this.props.createNewEventRegular(whitelableUrlForCreateEvent).then((resp) => {
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
              }&utm_campaign=''&utm_content=${
                user?.admin ? 'Is Admin' : user?.hasStaffAccess ? 'Is Staff' : 'Is Participant'
              }`;
              window.location.replace(path);
            },
          );
        } else if (resp && resp.errorCode === '4010101') {
          window.location.replace(
            `/u/signup?utm_source=Web App&utm_medium=Referral&utm_term=${
              document.title || ''
            }&utm_campaign=''&utm_content=${
              user?.admin ? 'Is Admin' : user?.hasStaffAccess ? 'Is Staff' : 'Is Participant'
            }`,
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

  clearMessage() {
    setTimeout(() => {
      this.setState({
        message: '',
        isError: false,
      });
    }, 3000);
  }

  getName = (Name) => {
    const dotproperty = '...';
    if (Name && Name.length > 20) {
      return Name.slice(0, 15).concat(dotproperty);
    }
    return Name;
  };

  renderHeaderNavMenu = () => {
    const { user, translations, whiteLabelInformation } = this.props;
    const { hideCreateEventButton } = whiteLabelInformation || {};
    const firstName = get(user, 'firstName');
    const lastName = get(user, 'lastName');
    const profileImage = (user && get(user, 'userProfilePhoto')) || '';
    const navDropDownLinks = { accountDropDownLinks: [], moreDropDownLinks: [] };
    navDropDownLinks.accountDropDownLinks = [
      {
        title: translations.headerActivity,
        icon: 'ac-icon-activity',
        callHandle: () => {
          this.redirectToProfile('/u/my-activity');
        },
      },
      {
        title: 'My Tickets',
        svgIcon: 'my-ticket-icon',
        callHandle: () => {
          this.redirectToProfile('/u/myprofile#tickets');
        },
      },
      {
        title: translations.headerManageEvents,
        svgIcon: 'my-event-icon',
        callHandle: () => {
          this.redirectToProfile('/u/myprofile#Events');
        },
      },
      {
        title: translations.headerProfile,
        svgIcon: 'my-profile-icon',
        callHandle: () => {
          this.redirectToProfile('/u/myprofile#Profile');
        },
      },
    ];

    if (!hideCreateEventButton) {
      navDropDownLinks.moreDropDownLinks.push({
        title: translations.createEvent,
        svgIcon: 'ac-icon-outline-plus',
        callHandle: this.toggleCreateEventConfirmationPopup,
      });
    }

    navDropDownLinks.moreDropDownLinks.push({
      title: translations.headerManageOrganizer,
      svgIcon: 'ac-icon-organiser',
      callHandle: () => {
        this.props.history.push('/o/edit');
      },
    });

    navDropDownLinks.moreDropDownLinks.push({
      title: translations.logout,
      svgIcon: 'ac-logout-icon',
      isLogout: true,
      callHandle: this.logout,
    });
    const getName = (Name) => {
      if (Name === undefined || Name === null) return '';
      const dotproperty = '...';
      if (Name && Name.length > 20) {
        return Name.slice(0, 15).concat(dotproperty);
      }
      return Name;
    };

    const menuItemsObj = {
      userData: {
        name: `${getName(firstName)} ${getName(lastName)}`,
        photo: profileImage,
        firstName,
        lastName,
      },
      navDropDownLinks,
    };
    return <AEHeaderNavMenu label="" menuItemsObj={menuItemsObj} />;
  };

  render() {
    const { authenticated, translations, children, whiteLabelInformation, iswhiteLabelEventList } = this.props;
    const {
      showCreateEventConfirmationPopup,
      message,
      isError,
      textColor,
      isHeaderLogoAvailabel,
      isLoading,
      isCreateEventButtonLoading,
    } = this.state;
    const { headerLogoImage, hideCreateEventButton } = whiteLabelInformation || {};

    return this.props.whiteLabelInformation || !iswhiteLabelEventList ? (
      <>
        {!isLoading ? (
          <div>
            <div>
              <div className="top-header-wrap">
                {authenticated && (
                  <Navbar fluid style={{ margin: 0, padding: 0 }} className="event-search-header">
                    <Brand className={!authenticated ? 'border-mobile-right-none' : ''}>
                      <span>
                        {isHeaderLogoAvailabel ? (
                          <div className="">
                            <AEImage
                              className={cx(
                                'normal-logo  has-custom',
                                headerLogoImage ? 'header-logo-custome-height' : 'accel-events-logo',
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
                              publicId={`${IMAGE_URL}${headerLogoImage || TOP_LOGO_IMAGE_BLACK}`}
                            />
                          </div>
                        ) : (
                          ''
                        )}
                      </span>
                    </Brand>
                    <div className="nav navbar-top-links ml-auto">
                      {!hideCreateEventButton && (
                        <MenuItem className="hidden-xs" eventKey="10" onClick={this.toggleCreateEventConfirmationPopup}>
                          <AEIcon svgIcon="ac-icon-outline-plus" viewBox="0 -3 20 20" />
                          <span
                            className="hidden-xs m-l-8"
                            style={{ color: textColor }}
                            onClick={this.toggleCreateEventConfirmationPopup}
                            id={translations.createEvent}
                          >
                            {translations.createEvent}
                          </span>
                        </MenuItem>
                      )}
                      {this.renderHeaderNavMenu()}
                    </div>
                  </Navbar>
                )}
              </div>
              {children}
            </div>
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
                    id="createNewEventButton"
                    loading={isCreateEventButtonLoading}
                  >
                    Create New Event
                  </AEButton>
                  <AEButton id="closeEvent" variant="danger" onClick={this.toggleCreateEventConfirmationPopup}>
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
        ) : (
          <div className="text-center">
            <AESpinner type="SpinnerTiny" />
          </div>
        )}
      </>
    ) : (
      <div />
    );
  }
}

const mapDispatchToProps = {
  createNewEventRegular: (whiteLabelUrl) => createNewEventRegular(whiteLabelUrl),
  whiteLabelURL: (url) => whiteLabelURL(url),
  getWhiteLabelDetailsByHostBaseUrl: (url) => getWhiteLabelDetailsByHostBaseUrl(url),
  setWhiteLabelInformation: (data) => setWhiteLabelInformation(data),
};
const mapStateToProps = (state) => ({
  whiteLabelInformation: get(state, 'whiteLablesetting.whiteLabelInformation'),
  translations: getTranslations(state),
  authenticated: isAuthenticated(state),
  user: getUserSession(state),
});

export default connect(mapStateToProps, mapDispatchToProps)(WithParams(EventSearchHeader));
