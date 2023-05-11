import { Col } from 'react-bootstrap';
import { connect } from 'react-redux';
import moment from 'moment-timezone';
import React from 'react';
import AEImage from '../../Core/Image';
import { cloudinary_name as cloudinaryName, imgUrl as IMAGE_URL, serverUrl as SERVER_URL } from '../../clientConfig';
import TimeDuration from '../../components/EventWebside/TimeDuration';
import AESocialShare from '../../Core/SocialShare/index';

class EventList extends React.Component {
  constructor() {
    super();
    this.state = {};
  }

  setEventsByUrl = () => {
    const { event } = this.props;
    const redirectUrl = `/e/${event.eventURL || event.eventUrl}`;
    window.location = redirectUrl;
  };

  getPriceRange = (minPrice, maxPrice, currencySymbol) => {
    const priceLabel = minPrice !== 'Free' ? `${currencySymbol}${minPrice}` : 'Free';
    return minPrice === maxPrice ? priceLabel : `${priceLabel} - ${currencySymbol}${maxPrice} `;
  };

  getEventVenue = (eventLocation) => {
    if (eventLocation) {
      const eventVenueArray = eventLocation.split(',');
      return eventVenueArray.length >= 5
        ? `${eventVenueArray[0]}, ${eventVenueArray[2]}, ${eventVenueArray[3]}`
        : eventLocation;
    }
    return eventLocation;
  };

  render() {
    const { event, eventDetails } = this.props;
    const { eventDesignDetails } = eventDetails || {};
    const { whiteLabelHostBaseUrl } = eventDesignDetails || {};
    const {
      eventEndDate,
      eventStartDate,
      equivalentTimezone,
      recurringEvent,
      eventURL,
      eventUrl,
      eventLogo,
      eventName,
      eventLocation,
    } = event;
    const eventVenue = this.getEventVenue(eventLocation);
    const SocialShareList = [
      {
        title: 'facebook',
        link: `${whiteLabelHostBaseUrl || SERVER_URL}/e/${eventURL || eventUrl}`,
        icon: 'ac-icon-facebook',
      },
      {
        title: 'twitter',
        link: `${whiteLabelHostBaseUrl || SERVER_URL}/e/${eventURL || eventUrl}`,
        icon: 'ac-icon-twitter',
      },
      {
        title: 'email',
        link: `mailto:${''}?subject=${`You\'re invited to ${eventName}`}&body=${"I'd like to share this event with you!"} ${
          whiteLabelHostBaseUrl || SERVER_URL
        }/e/${eventURL || eventUrl}`,
        icon: 'ac-icon-email',
      },
    ];

    return (
      <Col md={12} className="p-0 event-search-result-box cursor" onClick={this.setEventsByUrl}>
        <div className="search-result-box search-xs-logo">
          <div className="">
            <div className="search-event-logo">
              <AEImage
                className="search-event-logo search-xs-logo"
                dpr="auto"
                crop="scale"
                alt={`${eventName} event logo`}
                cloudName={cloudinaryName}
                type="fetch"
                fetchFormat="auto"
                quality="auto"
                secure
                responsive
                publicId={`${IMAGE_URL}${eventLogo}`}
              />
            </div>
            <AESocialShare list={SocialShareList} placement="top" />
          </div>
          <div>
            <div className="event-date-box">
              <div className="date-rectangle align-items-baseline">
                <span className="fa fa-calendar-check-o calendar-box m-r-10" />
                <div className="event-date-text">
                  {!recurringEvent ? (
                    eventStartDate ? (
                      <TimeDuration
                        startDate={eventStartDate}
                        endDate={eventEndDate}
                        equivalentTimezone={equivalentTimezone}
                        tmClass={'date-font-style'}
                        dateFormat="ddd, MMM D, "
                      />
                    ) : (
                      <div className="p-t-10">
                        {moment(eventEndDate).tz(equivalentTimezone).format('ddd, MMM D, YYYY')}
                        {` at `}
                        {moment(eventEndDate).tz(equivalentTimezone).format('h:mm A ')}
                      </div>
                    )
                  ) : (
                    <div>MULTIPLE DATES </div>
                  )}
                </div>
              </div>
              <div className="event-name-text">
                {eventName.length < 100 ? <a>{eventName}</a> : <a>{eventName.substring(0, 100)} ...</a>}
              </div>

              <div className="location-text-width">
                <div className="event-location-text p-0 mt-4">
                  {eventVenue && (
                    <div className="display-inline-flex">
                      <span>
                        <i className="ac-icon-pin" />
                      </span>
                      <div>{eventVenue}</div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </Col>
    );
  }
}

const mapDispatchToProps = {};
const mapStateToProps = (state) => ({
  eventData: state.host && state.host.eventDetails,
  user1: state.session.user,
  eventDetails: state.event && state.event.data,
});
export default connect(mapStateToProps, mapDispatchToProps)(EventList);
