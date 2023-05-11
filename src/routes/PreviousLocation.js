import React, { useEffect } from 'react';
import { useLastLocation } from 'react-router-last-location';
import isEqual from 'lodash/isEqual';
import usePrevious from '../hooks/usePrevious';
import WithParams from '../components/WrapperComponents/WithParams';

let prevLocation = [];
let usePreviousProps = null;

const PreviousLocation = (props) => {
  const lastLocation = useLastLocation(); // Last Location
  usePreviousProps = usePrevious(props); // Previous Props

  useEffect(() => {
    prevLocation = JSON.parse(sessionStorage.getItem('prevLocationArray'), 10) || []; // Get Previous Location Data
    const navigateIndex =
      parseInt(sessionStorage.getItem('navigateIndex'), 10) === 0
        ? parseInt(sessionStorage.getItem('navigateIndex'), 10)
        : parseInt(sessionStorage.getItem('navigateIndex'), 10) || ''; // Get Click Navigation Index

    // last Location path
    const lastLocationPath = lastLocation?.hash
      ? `${lastLocation?.pathname}${lastLocation?.hash}`
      : lastLocation?.pathname;

    // current Location path
    const currentLocationPath = props?.location?.hash
      ? `${props?.location?.pathname}${props?.location?.hash}`
      : props?.location?.pathname;

    if (navigateIndex !== '') {
      // Click Navigation logic

      const remove = prevLocation.splice(0, navigateIndex); // Remove selected Navigation

      // set Previous Location Data
      sessionStorage.setItem('prevLocationArray', JSON.stringify(remove));

      // remove Previous Navigation Index
      sessionStorage.setItem('navigateIndex', '');
    } else if (lastLocation && !isEqual(lastLocationPath, currentLocationPath)) {
      const title =
        lastLocation?.hash === '#Events'
          ? 'My Events'
          : lastLocation?.hash === '#tickets'
          ? 'My Tickets'
          : lastLocation?.hash === '#Profile'
          ? 'My Profile'
          : lastLocation?.pathname === '/host/eventsetup'
          ? 'Event setup'
          : usePreviousProps
          ? usePreviousProps?.breadcrumbText
          : props.history.location?.state?.title;

      // Store Previous Path and Title
      const obj = {
        path: lastLocationPath,
        title,
      };

      // More Than 30 Data Replace and Set Logic
      prevLocation.push = function (obj) {
        if (this.length >= 30) {
          this.splice(0, 1);
        }
        return [].push.call(this, obj);
      };
      title && prevLocation.push(obj);

      if (prevLocation[prevLocation?.length - 1]?.path === currentLocationPath) {
        prevLocation.pop();
      }

      // Store Previous Location Data
      sessionStorage.setItem('prevLocationArray', JSON.stringify(prevLocation));
    }
  }, [lastLocation]);

  return props.children;
};

export default React.memo(WithParams(PreviousLocation));
