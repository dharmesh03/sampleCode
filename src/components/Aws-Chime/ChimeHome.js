import React from 'react';
import BreakoutRoom from './components/BreakoutRoom';
import Classroom from './components/Classroom';

class ChimeCommon extends React.Component {
  render() {
    const { isFrom, params, session, isBreakoutRoom } = this.props;
    return (
      <div>
        {isBreakoutRoom ? (
          <BreakoutRoom session={session} params={params} isFrom={isFrom} />
        ) : (
          <Classroom session={session} params={params} isFrom={isFrom} />
        )}
      </div>
    );
  }
}
export default ChimeCommon;
