import React, { Component } from 'react';
import { Helmet } from 'react-helmet';
import moment from 'moment-timezone';
import { imgUrl as IMAGE_URL, cloudinary_url as CLOUDINARY_URL } from '../../clientConfig';

let allEvent = [];

class EventSearchMetaTags extends Component {
  constructor(props) {
    super(props);
    this.state = {};
  }

  shouldComponentUpdate(nextProps) {
    const { eventData } = this.props;
    return !(nextProps.eventData === eventData);
  }

  render() {
    const { eventData } = this.props;
    allEvent = [];
    if (eventData && eventData.length > 0) {
      eventData.map((event) => {
        const offer = [];
        const eventLocationData = event.eventLocation || {};
        let metaDesc = String(event.eventDescription).replace(/<\/?[^>]+(>|$)/g, '');
        metaDesc = metaDesc.replace(/(\r\n|\n|\r)/gm, '');
        if (event.ticketingTypeList) {
          event.ticketingTypeList.map((ticketType) => {
            offer.push({
              '@type': 'Offer',
              name: ticketType.name,
              price: ticketType.price,
              validFrom: moment(ticketType.startDate).utc().format('YYYY-MM-DDTHH:mm:ss.SSS[Z]'),
              availability:
                ticketType.remaniningTickets > 0 ? 'http://schema.org/InStock' : 'http://schema.org/SoldOut',
              url: `${window.location.origin}/e/${event.eventUrl || event.eventURL}`,
              priceCurrency: event.currency,
            });
          });
        }
        allEvent.push({
          '@context': 'http://schema.org',
          '@type': 'Event',
          name: event.eventName || event.name,
          startDate: moment(event.eventStartDate).utc().format('YYYY-MM-DDTHH:mm:ss.SSS[Z]'),
          endDate: moment(event.eventEndDate).utc().format('YYYY-MM-DDTHH:mm:ss.SSS[Z]'),
          url: `${window.location.origin}/e/${event.eventUrl || event.eventURL}`,
          image: `${CLOUDINARY_URL}/${IMAGE_URL}${event.eventLogo}`,
          offers: offer,
          location: {
            '@type': 'Place',
            name: eventLocationData,
            address: {
              '@type': 'PostalAddress',
              addressLocality: '',
              addressRegion: '',
              streetAddress: event.eventLocation,
              addressCountry: {
                name: event.eventLocation,
              },
            },
          },
          organizer: {
            url: `${window.location.origin}/e/${event.eventUrl || event.eventURL}`,
            '@type': 'Organization',
            name: event.eventName,
          },
          description: metaDesc,
        });
      });
    }
    return (
      <Helmet>
        <script type="application/ld+json">{JSON.stringify(allEvent).toString()}</script>
      </Helmet>
    );
  }
}
export default EventSearchMetaTags;
