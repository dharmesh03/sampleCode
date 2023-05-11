/* eslint-disable jsx-a11y/no-noninteractive-element-interactions */
/* eslint-disable no-undef,no-new-func */
import React from 'react';
import cx from 'classnames';
import { connect } from 'react-redux';
import { Helmet } from 'react-helmet';
import { sessionService } from 'redux-react-session';
import concat from 'lodash/concat';
import isEmpty from 'lodash/isEmpty';
import map from 'lodash/map';
import InfiniteScroll from 'react-infinite-scroll-component';
import moment from 'moment-timezone';
import {
  imgUrl as IMAGE_URL,
  cloudinary_name,
  cloudinary_url as CLOUDINARY_URL,
  APP_ENV,
  GOOGLE_TRACKING_ID,
  TOP_LOGO_IMAGE_WHITE,
} from '../../clientConfig';
import { storeLoginData, storeToken } from '../login/action/index';
import AEImage from '../../Core/Image';
import AutoComplete from '../../components/GoogleMaps/AutoComplete';
import GoogleMap from '../../components/GoogleMaps/GoogleMap';
import LoginModal from '../../components/LoginModal/index';
import EventList from './EventList';
import EventSearchMetaTags from './EventSearchMetaTags';
import searchEvents from './action/index';
import { createNewEventRegular } from '../admin/event/action/index';
import { storeEventData, setFooterText, whiteLabelURL } from '../event/action/index';
import PopupModal from '../../components/PopupModal';
import EventListingFooter from '../../components/EventListingFooter/EventListingFooter';
import WithParams from '../../components/WrapperComponents/WithParams';
import AEButton from '../../Core/Button/Button';
import AESpinner from '../../Core/Spinner/Spinner';
import { clearLocalStorage, getLocalStorage } from '../../components/Widget/Utility/Utility';

class EventSearch extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      page: 0,
      fetchedRecords: 0,
      size: 20,
      mapApiLoaded: false,
      mapInstance: null,
      mapApi: null,
      categoryType: '',
      eventTypeList: [
        { lable: 'All type', value: '', iconClass: 'fa fa-th-large' },
        { lable: 'Today', value: 'TODAY', iconClass: 'fa fa-calendar-check-o' },
        { lable: 'This Weekend', value: 'WEEKEND', iconClass: 'fa fa-calendar' },
        { lable: 'Music', value: 'MUSIC', iconClass: 'fa fa-music' },
        { lable: 'Fundraiser', value: 'FUNDRAISER', iconClass: 'ac-icon-fund' },
        { lable: 'Sports', value: 'SPORTS', iconClass: 'fa fa-futbol-o' },
        { lable: 'Business & Professional', value: 'BUSINESS_AND_PROFESSIONAL', iconClass: 'fa fa-briefcase' },
        { lable: 'Food & Drink', value: 'FOOD_AND_DRINK', iconClass: 'fa fa-glass' },
        { lable: 'Other', value: 'OTHER', iconClass: 'fa fa-lightbulb-o' },
      ],
      userSignedIn: false,
      showCreateEventConfirmationPopup: false,
      message: '',
      isError: false,
      fetchedData: {},
    };
  }

  componentDidMount() {
    if (APP_ENV === 'production' || APP_ENV === 'stage') {
      if (typeof ga === 'function') {
        const userId = getLocalStorage('userId');
        ga('create', GOOGLE_TRACKING_ID, 'auto');
        ga('set', '&uid', userId);
        ga('send', 'pageview');
      }
    }
    this.initializeEventInfo();
  }

  componentDidUpdate() {
    if (APP_ENV === 'production' || APP_ENV === 'stage') {
      if (typeof ga === 'function' && window.ga && typeof ga.getByName === 'function') {
        ga('set', 'page', window.location.pathname + window.location.hash);
        ga('send', 'pageview');
        if (ga && ga.getByName('user') && ga.getByName('user') !== null) {
          ga('user.set', 'page', window.location.pathname + window.location.hash);
          ga('set', '&uid', getLocalStorage('userId'));
          ga('user.send', 'pageview');
        }
      }
    }
  }

  initializeEventInfo = () => {
    const url = window.location.href;
    const data = {};
    const userid = getLocalStorage('userId');
    if (localStorage && !isEmpty(userid?.toString()) && !isEmpty(getLocalStorage('token'))) {
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
    this.props.storeEventData(data);
    let urlSegments = '';
    if (url.indexOf('#') !== -1) {
      urlSegments = url.split('#');
      urlSegments =
        urlSegments && urlSegments[urlSegments.length - 1] !== 'all' ? urlSegments[urlSegments.length - 1] : '';
    }
    this.setState(
      {
        categoryType: urlSegments.toUpperCase(),
      },
      () => {
        this.searchEvent();
      },
    );
  };

  searchEvent = () => {
    const searchString = this.searchInput.value.toString();
    const { whiteLabelUrl, isFrom } = this.props;
    const { size, categoryType, longitude, latitude } = this.state;
    this.setState({ isLoading: true, fetchedData: {} });
    let date;
    let isFromToday;
    let hostBaseUrl = '';
    if (isFrom === 'homePage') {
      /*  const url = window.location.hostname.replace(/^(?:https?:\/\/)?(?:www\.)?/i, '').split('/')[0];
      const isSubDomain = subDomain(url);
      const domain = isSubDomain ? `${url}` : `www.${url}`; */
      hostBaseUrl = `&hostBaseUrl=${encodeURIComponent(window.location.origin)}`;
    }
    if (categoryType === 'TODAY') {
      date = `${moment().format('YYYY-MM-DD')} 00:00:00 ,${moment().format('YYYY-MM-DD')} 23:59:59`;
      isFromToday = true;
    } else if (categoryType === 'WEEKEND') {
      const weekStart = moment().startOf('isoweek');
      date = `${moment(weekStart).add(5, 'days').format('YYYY-MM-DD')} 00:00:00 ,${moment(weekStart)
        .add(6, 'days')
        .format('YYYY-MM-DD')} 23:59:59`;
      isFromToday = false;
    }
    this.props
      .searchEvents(
        0,
        size,
        searchString,
        categoryType,
        whiteLabelUrl,
        longitude,
        latitude,
        date,
        isFromToday,
        hostBaseUrl,
      )
      .then((resp) => {
        if (resp && resp.data) {
          this.setState({
            searchString,
            eventList: resp && resp.data,
            page: 1,
            fetchedRecords: resp.recordsFiltered,
            hasMoreItem: resp.recordsFiltered > 0 && resp.recordsTotal > resp.recordsFiltered,
            isLoading: false,
            fetchedData: resp.data,
          });
        } else {
          this.setState({
            eventList: [],
            fetchedRecords: 0,
            hasMoreItem: false,
            isLoading: false,
          });
        }
      });
  };

  fetchMoreEvents = () => {
    const { whiteLabelUrl, isFrom } = this.props;
    const { searchString, page, eventList, fetchedRecords, size, categoryType, latitude, longitude } = this.state;
    this.setState({ isLoading: true, fetchedData: {} });
    let hostBaseUrl = '';
    if (isFrom === 'homePage') hostBaseUrl = `&hostBaseUrl=${encodeURIComponent(window.location.origin)}`;
    let date;
    let isFromToday;
    if (categoryType === 'TODAY') {
      date = `${moment().format('YYYY-MM-DD')} 00:00:00 ,${moment().format('YYYY-MM-DD')} 23:59:59`;
      isFromToday = true;
    } else if (categoryType === 'WEEKEND') {
      const weekStart = moment().startOf('isoweek');
      date = `${moment(weekStart).add(5, 'days').format('YYYY-MM-DD')} 00:00:00 ,${moment(weekStart)
        .add(6, 'days')
        .format('YYYY-MM-DD')} 23:59:59`;
      isFromToday = false;
    }
    this.props
      .searchEvents(
        page,
        size,
        searchString,
        categoryType,
        whiteLabelUrl,
        latitude,
        longitude,
        date,
        isFromToday,
        hostBaseUrl,
      )
      .then((resp) => {
        if (resp && resp.data) {
          this.setState({
            eventList: concat(eventList, resp.data),
            page: page + 1,
            fetchedRecords: fetchedRecords + resp.recordsFiltered,
            hasMoreItem: resp.recordsFiltered > 0 && resp.recordsTotal > fetchedRecords,
            isLoading: false,
            fetchedData: resp.data,
          });
        } else {
          this.setState({
            hasMoreItem: false,
            isLoading: false,
          });
        }
      });
  };

  openEventPage = (row) => {
    this.props.history.push(`/e/${row.url}`);
  };

  handleKeyPress = (event) => {
    if (event.key === 'Enter') {
      this.searchEvent();
    }
  };

  signIn = () => {
    this.toggleSignInPopup();
  };

  redirectToSignUpPage = () => {
    const { whiteLabelUrl, whiteLabelInformation } = this.props || {};
    const whiteLabelSignupUrl = whiteLabelUrl || whiteLabelInformation.whiteLabelUrl;
    const url =
      whiteLabelUrl || whiteLabelInformation.whiteLabelUrl ? `/u/wl-signup/${whiteLabelSignupUrl}` : `/u/signup`;
    this.props.history.replace(url);
  };

  handleChangeLocation = (_, latitude, longitude) => {
    this.setState(
      {
        longitude,
        latitude,
      },
      () => {
        this.searchEvent();
      },
    );
  };

  selectCategory = (e) => {
    const categoryType = e.target.value;
    const { whiteLabelUrl, isFrom } = this.props;
    const categoryTypeInLower = categoryType.toLowerCase();
    let url = whiteLabelUrl ? `/events/${whiteLabelUrl}` : `/events`;
    if (isFrom === 'homePage') {
      url = '';
    }
    categoryTypeInLower
      ? this.props.history.replace(`${url}#${categoryTypeInLower}`)
      : this.props.history.replace(`${url}#all`);
    this.setState(
      {
        categoryType,
      },
      () => {
        this.searchEvent();
      },
    );
  };

  handleCategory = (selectedCategory) => {
    this.setState({ selectedCategory, categoryType: selectedCategory.value }, () => {
      this.searchEvent();
    });
  };

  apiHasLoaded = (map, maps) => {
    if (map && maps) {
      this.setState({
        mapApiLoaded: true,
        mapInstance: map,
        mapApi: maps,
      });
    }
  };

  toggleMobileViewCat = () => {
    const { mobileViewCatExpand } = this.state;
    setTimeout(() => {
      this.setState({
        mobileViewCatExpand: !mobileViewCatExpand,
      });
    }, 200);
  };

  toggleSignInPopup = () => {
    const { showSignIn } = this.state;
    this.setState({
      showSignIn: !showSignIn,
    });
    if (localStorage && !isEmpty(getLocalStorage('userId')) && !isEmpty(getLocalStorage('token'))) {
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
    setTimeout(() => {
      window.location.reload();
    }, 1000);
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

  createNewEventRegular = () => {
    const { whiteLabelUrl, whiteLabelInformation } = this.props;
    const whitelableCreateEventUrl = whiteLabelUrl || (whiteLabelInformation && whiteLabelInformation.whiteLabelUrl);
    this.setState({ isCreateEventButtonLoading: true });
    const { isCreateEventButtonLoading } = this.state;
    if (!isCreateEventButtonLoading) {
      this.props.createNewEventRegular(whitelableCreateEventUrl).then((resp) => {
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
              this.props.history.replace(path);
            },
          );
        } else if (resp && resp.errorCode === '4010101') {
          this.props.history.replace(
            `/u/signup?utm_source=Web App&utm_medium=Referral&utm_term=${
              document.title || ''
            }&utm_campaign='&utm_content=Is Participant`,
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

  render() {
    const { iswhiteLabelEventList, authenticated, whiteLabelInformation } = this.props;
    const {
      headerLogoImage,
      eventListingSiteBannerImage,
      firmName,
      termsOfService,
      privacyPolicy,
      aboutUs,
      facebookShare,
      twitterShare,
      sellEventTicketsPage,
      hideCreateEventButton,
      isHeaderLogoAvailabel,
    } = whiteLabelInformation || {};
    const metaDescription = firmName
      ? `${firmName} brings people together through live experiences. Discover events that match your passions, or create your own with online ticketing tools.`
      : '';
    const {
      page,
      fetchedRecords,
      hasMoreItem,
      eventList,
      isLoading,
      mapInstance,
      mapApi,
      mapApiLoaded,
      categoryType,
      eventTypeList,
      selectedCategory,
      mobileViewCatExpand,
      showSignIn,
      showCreateEventConfirmationPopup,
      message,
      isError,
      fetchedData,
      isCreateEventButtonLoading,
    } = this.state;
    return (
      <div className="content-wrapper theam-background">
        {iswhiteLabelEventList && firmName && (
          <Helmet>
            <meta name="description" content={metaDescription} />
            <meta property="og:description" content={metaDescription} />
            <meta name="twitter:description" content={metaDescription} />
          </Helmet>
        )}
        <Helmet>
          <meta property="og:url" content={window.location} />
          <meta
            property="og:image"
            content={`${CLOUDINARY_URL}/${IMAGE_URL}${headerLogoImage || TOP_LOGO_IMAGE_WHITE}`}
          />
        </Helmet>
        <EventSearchMetaTags eventData={fetchedData} />
        <div
          className="event-listing-site-banner-image"
          style={{
            backgroundImage: eventListingSiteBannerImage
              ? `url(${CLOUDINARY_URL}/${IMAGE_URL}${eventListingSiteBannerImage})`
              : `url(${CLOUDINARY_URL}/w_1440,f_auto/${IMAGE_URL}default_event_search_page_banner.jpg)`,
            backgroundSize: 'cover',
          }}
        >
          <div className="edit-organizer-wrap container landing-page-wrapper">
            <div className="p-r-0 m-t-25">
              <div className="p-l-0 col-xs-4 col-md-8 col-lg-8 event-search-page-accelevents-logo">
                {isHeaderLogoAvailabel && !authenticated ? (
                  <AEImage
                    className={cx('normal-logo', headerLogoImage ? 'header-logo-custome-height' : 'accel-events-logo')}
                    dpr="auto"
                    crop="scale"
                    sizes="100vw"
                    cloudName={cloudinary_name}
                    type="fetch"
                    fetchFormat="auto"
                    quality="auto"
                    secure
                    responsive
                    publicId={`${IMAGE_URL}${headerLogoImage || TOP_LOGO_IMAGE_WHITE}`}
                  />
                ) : (
                  ''
                )}
              </div>
              <div
                className={cx(
                  'text-right col-xs-8 col-md-4 col-lg-4 m-b-10 event-search-page-header-buttons',
                  authenticated && 'hidden',
                )}
              >
                {!hideCreateEventButton && (
                  <div className="display-inline-block m-b-10">
                    <AEButton
                      onClick={() => {
                        this.toggleCreateEventConfirmationPopup();
                      }}
                      id="createEvent"
                      className="m-t-0"
                    >
                      Create Event
                    </AEButton>
                  </div>
                )}
                <div className="display-inline-block m-l-10">
                  {!authenticated && (
                    <AEButton onClick={this.signIn} id="signIn" className="m-t-0">
                      Sign In
                    </AEButton>
                  )}
                  {authenticated && (
                    <AEButton onClick={this.signOut} id="signOut">
                      Sign Out
                    </AEButton>
                  )}
                </div>
              </div>
            </div>
            <div className="discover-events-description">
              <div className="discover-amazing-events">Upcoming Events</div>
              {!hideCreateEventButton && (
                <AEButton
                  size="large"
                  className="m-t-50"
                  onClick={() => {
                    this.toggleCreateEventConfirmationPopup();
                  }}
                  id="createYourEvent"
                >
                  Create your Event
                </AEButton>
              )}
            </div>
            <div className="col-lg-12 col-sm-12 col-xs-12 event-search-box">
              <div>
                <label className="col-xs-12 search-for-an-event-label">Search for an event</label>
              </div>
              <div className="col-xs-12 col-sm-6 col-lg-6 search-form">
                <input
                  className="search-here-form  form-control"
                  type="text"
                  ref={(ref) => {
                    this.searchInput = ref;
                  }}
                  id="searchHere"
                  onKeyPress={this.handleKeyPress}
                  placeholder="Search"
                />
                <span className="colors-grey-dark-search-icon">
                  <i className="ac-icon-search " />
                </span>
              </div>
              <div className="col-xs-12 col-sm-6 col-lg-3 location-search-width">
                {mapApiLoaded && (
                  <AutoComplete
                    map={mapInstance}
                    mapApi={mapApi}
                    onChange={this.handleChangeLocation}
                    onBlur={this.handleChangeLocation}
                    isEventSearch
                  />
                )}
                <GoogleMap
                  defaultZoom={15}
                  defaultCenter={{
                    lat: 42.353109,
                    lng: -71.076867,
                  }}
                  style={{ display: 'none' }}
                  yesIWantToUseGoogleMapApiInternals
                  onGoogleApiLoaded={({ map, maps }) => this.apiHasLoaded(map, maps)}
                />
              </div>
              <div className="col-xs-12 col-sm-6 col-lg-3 event-search-button-prime">
                <AEButton label="Search" id="searchEvent" onClick={this.searchEvent} />
              </div>
            </div>
            <div className="p-0 col-lg-12 col-xs-12 discover-events-group m-t-b-50">
              <label className="discover-events">Discover Events</label>
              <div className="search-category-list search-category-event">
                <div className="search-category hidden-xs">
                  <div className="p-1 col-md-2 category-rectengale">
                    <input
                      type="radio"
                      value=""
                      id="a25"
                      onChange={this.selectCategory}
                      checked={categoryType === ''}
                      name="allType"
                    />
                    <label
                      htmlFor="a25"
                      className={categoryType === '' ? 'search-category-checked' : 'search-category-unchecked'}
                    >
                      <i className="fa fa-th-large" /> All type
                    </label>
                  </div>
                  <div className="p-1 col-md-2 category-rectengale">
                    <input
                      type="radio"
                      id="a50"
                      value="TODAY"
                      onChange={this.selectCategory}
                      checked={categoryType === 'TODAY'}
                      name="today"
                    />
                    <label
                      htmlFor="a50"
                      className={categoryType === 'TODAY' ? 'search-category-checked' : 'search-category-unchecked'}
                    >
                      <i className="fa fa-calendar-check-o" /> Today
                    </label>
                  </div>
                  <div className="p-1 col-md-2 category-rectengale weekend-btn">
                    <input
                      type="radio"
                      id="a75"
                      value="WEEKEND"
                      onChange={this.selectCategory}
                      checked={categoryType === 'WEEKEND'}
                      name="weekend"
                    />
                    <label
                      htmlFor="a75"
                      className={categoryType === 'WEEKEND' ? 'search-category-checked' : 'search-category-unchecked'}
                    >
                      <i className="fa fa-calendar" /> This Weekend
                    </label>
                  </div>
                  <div className="p-1 col-md-2 category-rectengale">
                    <input
                      type="radio"
                      id="a100"
                      value="MUSIC"
                      onChange={this.selectCategory}
                      checked={categoryType === 'MUSIC'}
                      name="music"
                    />
                    <label
                      htmlFor="a100"
                      className={categoryType === 'MUSIC' ? 'search-category-checked' : 'search-category-unchecked'}
                    >
                      <i className="fa fa-music" /> Music
                    </label>
                  </div>
                  <div className="p-1 col-md-2 category-rectengale">
                    <input
                      type="radio"
                      id="a125"
                      name="fundraiser"
                      value="FUNDRAISER"
                      onChange={this.selectCategory}
                      checked={categoryType === 'FUNDRAISER'}
                    />
                    <label
                      htmlFor="a125"
                      className={
                        categoryType === 'FUNDRAISER' ? 'search-category-checked' : 'search-category-unchecked'
                      }
                    >
                      <i className="ac-icon-fund" /> Fundraiser
                    </label>
                  </div>
                  <div className="p-1 col-md-2 category-rectengale">
                    <input
                      type="radio"
                      id="a150"
                      name="sports"
                      value="SPORTS"
                      onChange={this.selectCategory}
                      checked={categoryType === 'SPORTS'}
                    />
                    <label
                      htmlFor="a150"
                      className={categoryType === 'SPORTS' ? 'search-category-checked' : 'search-category-unchecked'}
                    >
                      <i className="fa fa-futbol-o" /> Sports
                    </label>
                  </div>
                  <div className="p-1 col-md-2 category-rectengale">
                    <input
                      type="radio"
                      id="a175"
                      name="business"
                      value="BUSINESS_AND_PROFESSIONAL"
                      onChange={this.selectCategory}
                      checked={categoryType === 'BUSINESS_AND_PROFESSIONAL'}
                    />
                    <label
                      htmlFor="a175"
                      className={
                        categoryType === 'BUSINESS_AND_PROFESSIONAL'
                          ? 'search-category-checked'
                          : 'search-category-unchecked'
                      }
                    >
                      <i className="fa fa-briefcase" /> Business
                    </label>
                  </div>
                </div>
              </div>
              <div className="search-category-list">
                <div className="search-category hidden-xs">
                  <div className="p-1 col-md-2 entertainment-rectangle">
                    <input
                      type="radio"
                      id="a200"
                      name="art"
                      value="FOOD_AND_DRINK"
                      onChange={this.selectCategory}
                      checked={categoryType === 'FOOD_AND_DRINK'}
                    />
                    <label
                      htmlFor="a200"
                      className={
                        categoryType === 'FOOD_AND_DRINK' ? 'search-category-checked' : 'search-category-unchecked'
                      }
                    >
                      <i className="fa fa-glass" /> {`Food & Drink`}
                    </label>
                  </div>
                  <div className="p-1 col-md-2 category-rectengale">
                    <input
                      type="radio"
                      id="a225"
                      name="other"
                      value="OTHER"
                      onChange={this.selectCategory}
                      checked={categoryType === 'OTHER'}
                    />
                    <label
                      htmlFor="a225"
                      className={categoryType === 'OTHER' ? 'search-category-checked' : 'search-category-unchecked'}
                    >
                      <i className="fa fa-lightbulb-o" /> Other
                    </label>
                  </div>
                </div>
                <div className="visible-xs">
                  <div className="category-section">
                    <div id="divItemCategories" className="item-categories ">
                      <div className={cx('dropdown', mobileViewCatExpand && 'open')}>
                        <AEButton
                          className="btn-drop-box btn btn-block dropdown-toggle pointer"
                          data-toggle="dropdown"
                          aria-expanded={mobileViewCatExpand}
                          onClick={this.toggleMobileViewCat}
                          onBlur={this.toggleMobileViewCat}
                          id="mobileViewCatExpand"
                        >
                          <span className="text drop-text-colour">
                            <i className={cx(selectedCategory ? selectedCategory.iconClass : 'fa fa-th-large')} />
                            &nbsp; &nbsp; {selectedCategory ? selectedCategory.lable : 'All type'}
                          </span>
                          <span className="caret" />

                          <i className="ac-icon-arrow-down-xs xs-carer-place" />
                        </AEButton>
                        <ul className="dropdown-menu category-list">
                          {map(eventTypeList, (eventType) => (
                            <li
                              onClick={() => {
                                this.handleCategory(eventType);
                              }}
                            >
                              <a className="category-switcher pointer category-switcher-padding" id={eventType.lable}>
                                <i className={cx(eventType.iconClass, 'm-r-5')} />
                                <span className="cat-name">{eventType.lable}</span>
                              </a>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            {eventList && eventList.length > 0 ? (
              <div className="p-0 col-lg-12 col-xs-12 discover-events-group">
                <InfiniteScroll
                  scrollThreshold={window.self !== window.top ? 0.7 : 0.6}
                  next={this.fetchMoreEvents}
                  dataLength={fetchedRecords}
                  hasMore={hasMoreItem}
                >
                  <div className="event-search">
                    <div className="tab-pane fade active in tab_wrapper grid-search-view">
                      {eventList &&
                        eventList.map((event, index) => (
                          <EventList event={event} key={index} className="tab-wrapper-shadow" />
                        ))}
                    </div>
                  </div>
                </InfiniteScroll>
                <div>
                  {isLoading && (
                    <div className="text-center p-t-20 p-b-50">
                      <AESpinner type="SpinnerSmall" />
                    </div>
                  )}
                </div>
              </div>
            ) : (
              page > 0 && (
                <div className="col-lg-12 col-xs-12">
                  <h5 className="text-center mrg-t-lg mrg-b-0 alert alert-danger">No events found.</h5>
                </div>
              )
            )}
          </div>
          <div>
            <EventListingFooter
              whiteLabelInformation={whiteLabelInformation}
              firmName={firmName}
              iswhiteLabelEventList={iswhiteLabelEventList}
              termsOfService={termsOfService}
              privacyPolicy={privacyPolicy}
              aboutUs={aboutUs}
              facebookShare={facebookShare}
              twitterShare={twitterShare}
              whiteLabelUrl={whiteLabelInformation && whiteLabelInformation.whiteLabelUrl}
              sellEventTicketsPage={sellEventTicketsPage}
              isHeaderLogoAvailabel={isHeaderLogoAvailabel}
            />
          </div>
        </div>
        {showSignIn && (
          <div>
            <LoginModal
              showModal={showSignIn}
              showPhoneNumModal={this.showPhoneNumModal}
              onSuccessFbLogin={this.onSuccessFbLogin}
              showType="login"
              headerText={<p />}
              onCloseFunc={this.toggleSignInPopup}
              isEventSearch
              whiteLabelUrlProps={whiteLabelInformation && whiteLabelInformation.whiteLabelUrl}
              isFrom="landing"
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
                id="createNewEvent"
                onClick={() => {
                  this.createNewEventRegular();
                }}
                loading={isCreateEventButtonLoading}
              >
                Create New Event
              </AEButton>
              <AEButton variant="danger" id="close" onClick={this.toggleCreateEventConfirmationPopup}>
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
  searchEvents: (
    page,
    size,
    search,
    categoryType,
    whiteLabelUrl,
    longitude,
    latitude,
    date,
    isFromToday,
    hostBaseUrl,
  ) =>
    searchEvents(page, size, search, categoryType, whiteLabelUrl, longitude, latitude, date, isFromToday, hostBaseUrl),
  setFooterText: (val) => setFooterText(val),
  storeEventData: (data) => storeEventData(data),
  whiteLabelURL: (url) => whiteLabelURL(url),
  storeLoginData: (data) => storeLoginData(data),
  storeToken: (data) => storeToken(data),
  createNewEventRegular: (whiteLabelUrl) => createNewEventRegular(whiteLabelUrl),
};
const mapStateToProps = (state) => ({
  whiteLabelInformation: state?.whiteLablesetting?.whiteLabelInformation,
  eventList: state.eventList,
  authenticated: state?.session?.authenticated,
});

export default connect(mapStateToProps, mapDispatchToProps)(WithParams(EventSearch));
