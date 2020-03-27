if (process.env.NODE_ENV === 'development') {
    require('preact/debug');
}

import './style';
import App from './components/app';

export default App;
