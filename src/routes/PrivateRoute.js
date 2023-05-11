import React from 'react';
import { Route, Redirect } from 'react-router-dom';
import { withRouter } from 'react-router';

function PrivateRoute({ children, ...rest }) {
  return (
    <Route
      {...rest}
      exact
      strict
      render={({ location }) =>
        rest.authenticated ? (
          children
        ) : (
          <Redirect
            to={{
              pathname: '/u/login',
              state: { from: location },
            }}
          />
        )
      }
    />
  );
}
export default withRouter(PrivateRoute);
