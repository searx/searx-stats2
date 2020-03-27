import createStore from 'unistore'
import { Provider, connect } from 'unistore/preact'

let initialStore = {
    version: '',
    tls_grade: '',
    csp_grade: '',
    html_grade: '',
    ipv6: false,
    asn_privacy: false,
    query: false,
    query_google: false
};

let store = createStore(initialStore);

let actions = {

    setVersion: (_, newVersion) => { return { version: newVersion } },
    setTlsGrade: (_, newTlsGrade) => { return { tls_grade: newTlsGrade } }

}

/*
const AppWithStore = connect(Object.keys(initialStore), actions)(
    <Provider store={store}>
      <App />
    </Provider>
)
*/