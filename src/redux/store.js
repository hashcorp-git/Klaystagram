/* import { browserHistory } from 'react-router' */
// import { browserHistory } from 'history'
import browserHistory from 'history/createBrowserHistory'
import { createStore, applyMiddleware, compose } from 'redux'
import thunkMiddleware from 'redux-thunk'
import { routerMiddleware } from 'react-router-redux'
import reducer from 'redux/reducers'


// Redux DevTools
const composeEnhancers = window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__ || compose;

const routingMiddleware = routerMiddleware(browserHistory)

const store = createStore(
  reducer,
  composeEnhancers(applyMiddleware(thunkMiddleware, routingMiddleware))
)

export default store
