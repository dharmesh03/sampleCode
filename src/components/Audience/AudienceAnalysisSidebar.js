import React from 'react';
import ReactDOM from 'react-dom';
import { connect } from 'react-redux';
import get from 'lodash/get';
import size from 'lodash/size';
import loadable from '@loadable/component';
import { Col, Row } from 'react-bootstrap';
import { withTranslation } from 'react-i18next';
import moment from 'moment';
import { AETab, AETabs } from '../../Core/Tab';
import {
  getEventsUserAttendedByUserId,
  getEventsUserAttendedByUserIdAndWhiteLabelURL,
  getEventsForAudienceAndOrderByOrganizer,
  getEventsForAudienceAndOrderByWhiteLabel,
} from './action';
import WithParams from '../WrapperComponents/WithParams';
import { getAttendeesAnalyticsProfile, doGetUserOrderDetails } from '../../routes/admin/ticket/action';
import { imgUrl as IMAGE_URL, cloudinary_name } from '../../clientConfig';
import OrderPanel from '../OrderPanel';
import './_audience.scss';

const AESlidePopup = loadable(() => import('../../Core/SlidePopup/index'));
const AESelect = loadable(() => import('../../Core/Select/Select'));
const AELabel = loadable(() => import('../../Core/Label/label'));
const UserActivityTimeline = loadable(() => import('../UserActivityTimeline/UserActivityTimeline'));
const Alerts = loadable(() => import('../Widget/Alerts'));
const AEImageLabel = loadable(() => import('../../Core/ImageWithLabel/ImageWithLabel'));
const AESpinner = loadable(() => import('../../Core/Spinner/Spinner'));
const AETooltip = loadable(() => import('../../Core/Tooltip'));
const AEImage = loadable(() => import('../../Core/Image'));

class AudienceAnalysisSidebar extends React.Component {
  constructor(props) {
    super(props);
    const { t } = this.props;
    const attendeeProfile = [
      { label: t('common:Company'), value: '' },
      { label: t('attendeeDetails:Title'), value: '' },
      { label: t('common:Ticket Type'), value: '' },
      { label: t('common:Email Address'), value: '' },
      { label: t('common:Phone Number'), value: '' },
    ];

    this.labelRef = React.createRef();

    this.state = {
      tab: 1,
      options: [],
      eventsAttendedByUser: [],
      loading: false,
      isEventsLoaded: false,
      message: '',
      isError: false,
      selectedEvent: null,
      attendeeProfile,
      orders: [],
      orderLoading: false,
      isOrderLoaded: false,
      attendee: null,
    };
  }

  componentDidMount() {
    this.setActiveTab(1);
  }

  setActiveTab = (tab) => {
    this.setState({ tab, isOrderLoaded: false });
    if (tab === 1) {
      this.getAttendeeByUserId();
    } else if (tab === 2) {
      this.getEventListByAttendee(true);
    } else if (tab === 3) {
      this.getEventsByAttendeeAttended();
    } else if (tab === 4) {
      this.getOrdersByEventUrlAndAttendeeId(true);
    }
  };

  clearMessage = () => {
    setTimeout(() => this.setState({ message: '', isError: false }), 2000);
  };

  getEventListByAttendee = (isTabChanged) => {
    const { organizer, attendee, t, whiteLabel, isFromWhiteLabel } = this.props;
    const { isEventsLoaded, options, selectedEvent } = this.state;
    const { organizerPageURL } = organizer || {};
    const { whiteLabelUrl } = whiteLabel || {};
    const { userId } = attendee || {};
    return new Promise((resolve) => {
      let firstEvent;
      if (isEventsLoaded) {
        if (size(options) > 0 && isTabChanged) {
          firstEvent = options[0];
          this.setState({ selectedEvent: options[0] });
        } else {
          firstEvent = selectedEvent;
        }
        resolve(firstEvent);
        return;
      }
      if ((organizerPageURL || whiteLabelUrl) && userId) {
        this.setState({ loading: true });
        let message = t('common:Something went wrong');
        let apiCall;
        if (isFromWhiteLabel) {
          apiCall = this.props.getEventsForAudienceAndOrderByWhiteLabel(whiteLabelUrl, userId);
        } else {
          apiCall = this.props.getEventsForAudienceAndOrderByOrganizer(organizerPageURL, userId);
        }
        apiCall
          .then((resp) => {
            let options = [];
            let selectedEvent;
            if (resp && resp.data && !resp.errorMessage && !resp.error) {
              if (Array.isArray(resp.data) && resp.data.length > 0) {
                options = resp.data.map((event) => ({ label: event.name, value: event.eventId, data: event }));
                selectedEvent = options[0];
              }
              this.setState({ isEventsLoaded: true });
            } else {
              if (resp) {
                message = resp.errorMessage || resp.error;
              }
              this.setState({ isError: true, message }, this.clearMessage);
            }
            this.setState({ loading: false, options, selectedEvent });
            resolve(selectedEvent);
          })
          .catch(() => {
            this.setState({ loading: false, isError: true, message });
            resolve(undefined);
          });
      }
    });
  };

  getEventsByAttendeeAttended = () => {
    const { organizer, attendee, t, whiteLabel, isFromWhiteLabel } = this.props;
    const { organizerPageURL } = organizer || {};
    const { whiteLabelUrl } = whiteLabel || {};
    const { userId } = attendee || {};
    if ((organizerPageURL || whiteLabelUrl) && userId) {
      this.setState({ loading: true });
      let apiCall;
      if (isFromWhiteLabel) {
        apiCall = this.props.getEventsUserAttendedByUserIdAndWhiteLabelURL(whiteLabelUrl, userId);
      } else {
        apiCall = this.props.getEventsUserAttendedByUserId(organizerPageURL, userId);
      }
      apiCall
        .then((resp) => {
          let eventsAttendedByUser = [];
          if (resp && resp.data && !resp.errorMessage && !resp.error) {
            eventsAttendedByUser = resp.data;
          } else {
            const message = resp?.errorMessage || resp?.error || t('common:Something went wrong');
            this.setState({ isError: true, message }, this.clearMessage);
          }
          this.setState({ loading: false, eventsAttendedByUser });
        })
        .catch(() => {
          this.setState(
            { loading: false, isError: true, message: t('common:Something went wrong') },
            this.clearMessage,
          );
        });
    }
  };

  getAttendeeByUserId = () => {
    const { attendee, t } = this.props;
    const { attendeeProfile } = this.state;
    const { userId } = attendee || {};
    if (userId) {
      this.setState({ loading: true });
      this.props
        .getAttendeesAnalyticsProfile(userId)
        .then((resp) => {
          if (resp && !resp.errorMessage && !resp.error) {
            attendeeProfile.forEach((item) => {
              if (item.label === t('common:Name')) item.value = `${resp.firstName} ${resp.lastName}`;
              if (item.label === t('common:Company')) item.value = resp.company || 'N/A';
              if (item.label === t('attendeeDetails:Title')) item.value = resp.title || 'N/A';
              if (item.label === t('common:Ticket Type'))
                item.value = size(resp.userTicketTypeName) ? resp.userTicketTypeName[0] : 'N/A';
              if (item.label === t('common:Email Address')) item.value = resp.email || 'N/A';
              if (item.label === t('common:Phone Number')) item.value = resp.phoneNumber || 'N/A';
            });
            this.setState({
              attendeeProfile,
              loading: false,
              attendee: resp,
            });
          } else {
            this.setState(
              { loading: false, isError: true, message: t('common:Something went wrong.') },
              this.clearMessage,
            );
          }
        })
        .catch(() => {
          this.setState(
            { loading: false, isError: true, message: t('common:Something went wrong.') },
            this.clearMessage,
          );
        });
    }
  };

  getOrdersByEventUrlAndAttendeeId = (isTabChanged) => {
    const { attendee, t } = this.props;
    const { userId: attendeeId } = attendee || {};
    this.getEventListByAttendee(isTabChanged).then((selectedEvent) => {
      if (selectedEvent) {
        const eventUrl = get(selectedEvent, 'data.eventURL');
        if (eventUrl) {
          this.setState({ orderLoading: true, isOrderLoaded: false });
          this.props
            .doGetUserOrderDetails(100, 0, attendeeId, eventUrl)
            .then((resp) => {
              if (resp && !resp.errorMessage && !resp.error) {
                this.setState({
                  orders: resp.orders,
                });
              } else {
                this.setState(
                  {
                    isError: true,
                    message: (resp && (resp.errorMessage || resp.error)) || t('common:Something went wrong'),
                  },
                  this.clearMessage,
                );
              }
              this.setState({ orderLoading: false, isOrderLoaded: true });
            })
            .catch(() => this.setState({ orderLoading: false }));
        }
      }
    });
  };

  filterOptions = (option, inputValue) => {
    const label = get(option, 'label');
    if (!label) {
      return false;
    }
    return label.toLowerCase().includes(inputValue.toLowerCase());
  };

  handleSelectOnEventDropdown = (selectedOption) => {
    const { tab } = this.state;
    this.setState({ selectedEvent: selectedOption }, () => {
      if (tab === 4) {
        this.getOrdersByEventUrlAndAttendeeId(false);
      }
    });
  };

  getTargetForName = () => ReactDOM.findDOMNode(this.labelRef.current);

  handleMouseEnterOnName = () => {
    let showTooltip;
    const childElement = document.getElementById('image-label-div');
    const parentElement = document.getElementsByClassName('edit-item-text');
    if (size(parentElement) === 1 && childElement) {
      showTooltip = parentElement[0].clientWidth <= childElement.clientWidth;
    }
    this.setState({ showTooltip });
  };

  handleMouseLeaveOnName = () => {
    this.state.showTooltip && this.setState({ showTooltip: false });
  };

  /*  ---------------Start Render Code--------------- */

  renderMyPhoto = () => {
    const { attendee } = this.state;
    const { firstName, lastName, photo } = attendee || {};
    if (!attendee) {
      return <></>;
    }
    return (
      <div className="d-inline-block" id="image-label-div" ref={this.container}>
        <AEImageLabel
          dpr="auto"
          gravity="face"
          crop="thumb"
          width="100"
          height="100"
          zoom="0.8"
          sizes="100vw"
          fetchFormat="auto"
          quality="auto"
          cloudName={cloudinary_name}
          type="fetch"
          secure
          imageType={'avatar'}
          responsive
          variant={'medium'}
          user={{ firstName: `${firstName}`, lastName: `${lastName}` }}
          publicId={photo ? `${IMAGE_URL}${photo}` : ''}
          lableProps={{
            header: `${firstName} ${lastName}`,
            variant: 'heading3',
            labelClass: 'm-b-0 ml-2 overflow-txt-ellipsis',
            color: '#1e2137',
          }}
          imageClasses="image-wrapper"
          ref={this.labelRef}
          onMouseEnterLabelCallback={this.handleMouseEnterOnName}
          onMouseLeaveLabelCallback={this.handleMouseLeaveOnName}
        />
        <AETooltip
          tooltip={`${firstName} ${lastName}`}
          tooltipProps={{ id: 'people-name-tooltip' }}
          overlayProps={{
            container: this.container,
            target: this.getTargetForName,
            placement: 'bottom',
            show: this.state.showTooltip,
          }}
          useOverlay
        />
      </div>
    );
  };

  renderMyProfile = () => {
    const { loading, attendeeProfile } = this.state;
    if (loading) {
      return (
        <div className="text-center">
          <AESpinner type="SpinnerExtraSmall" />
        </div>
      );
    }
    return (
      <div
        className="add-scrollbar-edit-item pr-3 m-t-30 attendee-analysis-text"
        style={{ height: 'calc(100vh - 240px)', marginRight: '0px' }}
      >
        {attendeeProfile.map((item) => (
          <>
            <Col md={12}>
              <Row>
                <Col md={6} xs={6} className="p-0">
                  <AELabel header={item.label} variant="subtitle2" color="#6D6F7D" labelClass="mb-0" />
                </Col>
                <Col md={6} xs={6} className="text-right p-0">
                  {item.value?.length > 25 ? (
                    <AETooltip tooltip={item.value} overlayProps={{ placement: 'top' }}>
                      <AELabel
                        header={`${item.value?.substring(0, 25)}...`}
                        variant="subtitle"
                        color="#4B4D5F"
                        className="justify-content-end"
                        labelClass="mb-0"
                      />
                    </AETooltip>
                  ) : (
                    <AELabel
                      header={item.value}
                      variant="subtitle"
                      color="#4B4D5F"
                      className="justify-content-end"
                      labelClass="mb-0"
                    />
                  )}
                </Col>
              </Row>
            </Col>
            <Col md={12} className="p-0">
              <hr className="line-space" />
            </Col>
          </>
        ))}
      </div>
    );
  };

  renderMyEvents = () => {
    const { eventsAttendedByUser, loading } = this.state;
    const { language } = this.props.i18n || {};
    if (loading) {
      return (
        <div className="text-center">
          <AESpinner type="SpinnerExtraSmall" />
        </div>
      );
    }
    return (
      <div className="add-scrollbar-edit-item pr-3" style={{ height: 'calc(100vh - 240px)', marginRight: '0px' }}>
        {size(eventsAttendedByUser) > 0
          ? eventsAttendedByUser.map((event) => {
              const { eventStartDate, eventEndDate, equivalentTimezone, name, logoImage } = event || {};
              const equivalentStartDate = moment(eventStartDate).tz(equivalentTimezone).locale(language);
              const equivalentEndDate = moment(eventEndDate).tz(equivalentTimezone).locale(language);
              return (
                <div className="d-flex event-container align-items-center" key={event.eventId}>
                  <AEImage
                    dpr="auto"
                    crop="fill"
                    width="150"
                    height="75"
                    sizes="100vw"
                    fetchFormat="auto"
                    quality="100"
                    cloudName={cloudinary_name}
                    type="fetch"
                    secure
                    responsive
                    publicId={`${IMAGE_URL}${logoImage || 'images/Smooth_AE_Icon_700x350.png'}`}
                    className="image-event"
                  />
                  <div className="ml-3">
                    <AELabel header={name} variant="subtitle2" labelClass="label-ellipsis line-2" color="#1E2137" />
                    <AELabel
                      header={`${moment(equivalentStartDate).format('ddd, MMM D, YYYY')} - ${moment(
                        equivalentEndDate,
                      ).format('ddd, MMM D, YYYY')}`}
                      variant="caption2"
                      color="#4B4D5F"
                    />
                  </div>
                </div>
              );
            })
          : ''}
      </div>
    );
  };

  renderMyOrder = () => {
    const { orders, isEventsLoaded, orderLoading, isOrderLoaded, selectedEvent } = this.state;
    const { t } = this.props;
    const { data } = selectedEvent || {};
    return (
      <>
        {this.renderEventSelect()}
        {isEventsLoaded && data && (
          <div
            className="m-t-20 add-scrollbar-edit-item pr-3"
            style={{ height: 'calc(100vh - 330px)', marginRight: '0px' }}
          >
            {orderLoading && !isOrderLoaded ? (
              <div className="text-center">
                <AESpinner type="SpinnerExtraSmall" />
              </div>
            ) : size(orders) ? (
              <div className="audience-orders">
                {orders.map((item, key) => (
                  <OrderPanel
                    order={item}
                    key={key}
                    isFromAttendeeAnalytics
                    attendeeList={item.attendee}
                    equivalentTimezone={data.equivalentTimezone}
                  />
                ))}
              </div>
            ) : (
              <div className="d-flex justify-content-center">{t('toasterMsg:No Data Available')}</div>
            )}
          </div>
        )}
      </>
    );
  };

  renderEventSelect = () => {
    const { t } = this.props;
    const { selectedEvent, options, loading } = this.state;
    const nodataText = t('No options');
    return (
      <div id="event-select-div">
        <AELabel header={t('myactivity:Select Event')} variant="caption1" />
        <AESelect
          onChange={this.handleSelectOnEventDropdown}
          value={selectedEvent && selectedEvent.value}
          options={options}
          id="selectAll"
          isSearchable
          filterOption={this.filterOptions}
          disabled={loading}
          nodataText={nodataText}
          placeholder={t('common:Select')}
        />
      </div>
    );
  };

  render() {
    const { togglePopup, attendee, t } = this.props;
    const { tab, selectedEvent, isEventsLoaded, isError, message, options } = this.state;
    const eventUrl = get(selectedEvent, 'data.eventURL');
    const equivalentTimezone = get(selectedEvent, 'data.equivalentTimezone');
    const { userId: attendeeId } = attendee || {};
    return (
      <AESlidePopup
        id="audience-analytics-popup"
        toggle={togglePopup}
        title={this.renderMyPhoto()}
        isShowCloseBtn
        onClick={() => {
          this.props.handleTogglePopup(false);
        }}
        isShowOverlay
        className="audience-analytics-sidebar-popup"
        isTitleHaveTooltip={false}
      >
        <Alerts message={message} isError={isError} />
        <div id="portal-content-wrapper" className="width-100-percent p-0">
          <AETabs
            isAdvance
            activeKey={tab}
            defaultActiveKey={1}
            onSelect={this.setActiveTab}
            id="attendee-analytics-tabs"
            className="mt-3"
          >
            <AETab key={1} eventKey={1} title={t('agendaDetails:Profile')}>
              {this.renderMyProfile()}
            </AETab>
            <AETab key={2} eventKey={2} title={t('audience:User Activity')}>
              {this.renderEventSelect()}
              <div
                id="user-activity-scrollable"
                className="add-scrollbar-edit-item mt-3"
                style={{ height: 'calc(100vh - 325px)', marginRight: '0px' }}
              >
                {tab === 2 && eventUrl && equivalentTimezone && attendeeId ? (
                  <Col md={12} className="m-0 p-0">
                    <UserActivityTimeline
                      attendeeId={attendeeId}
                      eventUrl={eventUrl}
                      equivalentTimezone={equivalentTimezone}
                    />
                  </Col>
                ) : isEventsLoaded && size(options) === 0 ? (
                  <AELabel
                    variant={'caption1'}
                    className="justify-content-center"
                    header={'No event is attended by selected attendee'}
                  />
                ) : (
                  ''
                )}
              </div>
            </AETab>
            <AETab key={3} eventKey={3} title={t('audience:Events Attended')}>
              {this.renderMyEvents()}
            </AETab>
            <AETab key={4} eventKey={4} title={t('common:Orders')}>
              {this.renderMyOrder()}
            </AETab>
          </AETabs>
        </div>
      </AESlidePopup>
    );
  }
}

const mapDispatchToProps = {
  getEventsUserAttendedByUserId,
  getAttendeesAnalyticsProfile,
  doGetUserOrderDetails,
  getEventsUserAttendedByUserIdAndWhiteLabelURL,
  getEventsForAudienceAndOrderByOrganizer,
  getEventsForAudienceAndOrderByWhiteLabel,
};

export default connect(
  null,
  mapDispatchToProps,
)(WithParams(withTranslation('audience', 'myactivity', 'toasterMsg')(AudienceAnalysisSidebar)));
