import { Fragment, Component, h } from 'preact';
import style from './style';
import linkState from 'linkstate';
import UrlComponent from '../../components/instance-url';
import { usePrerenderData } from '@preact/prerender-data-provider';
import { compareFunctionCompose, SORT_CRITERIAS } from '../../sort';


function applyStrFilter(r, filterValue, f) {
	if (typeof filterValue === 'undefined' || filterValue === null) {
		return r;
	}
	const filterValueStriped = filterValue.trim().toLowerCase();
	if (filterValueStriped === '') {
		return r;
	}
	return r.filter((instance) => f(filterValueStriped, instance));
}

function filterIndexOf(filterValue, value) {
	return (value || '').toLowerCase().indexOf(filterValue) >= 0;
}

function filterStartsWith(filterValue, value) {
	return (value || '').toLowerCase().startsWith(filterValue);
}

const debounce = (cb, wait) => {
	let timeout;
  
	return function() {
	  let callback = () => cb.apply(this, arguments);
	  
	  clearTimeout(timeout);
	  timeout = setTimeout(callback, wait);
	}
  }
  


export default class Online extends Component {

	state = {
		version: '',
		tlsGrade: '',
		cspGrade: '',
		htmlGrade: '',
		ipv6: false,
		asnPrivacy: false,
		networkCountry: '',
		networkName: '',
		query: false,
		queryGoogle: false
	};

	renderLabels() {
		return <Fragment>
			<h4 id="help-tls-grade">TLS grade</h4>
			<p>Grade from <a href="https://cryptcheck.fr/">cryptcheck.fr</a> (source code: <a href="https://github.com/aeris/cryptcheck">aeris/cryptcheck</a> and <a href="https://github.com/dalf/cryptcheck-backend">dalf/cryptcheck-backend</a>).</p>

			<h4 id="help-csp-grade">CSP grade</h4>
			<p>Grade from <a href="https://observatory.mozilla.org/faq.html">Observatory by mozilla</a>.</p>

			<h4 id="help-http-grade">HTTP grade</h4>
			<p>When the page is loaded by Firefox, are the scripts well-known ?</p>
			<ul>
				<li>V - Vanilla instance: all static files comes from the searx git repository.</li>
				<li>C - Some static files have been modified, but the Javascripts comes from the searx git repository.</li>
				<li>Cjs - Some static files have been modified including Javascript files.</li>
				<li>E - The instance includes file from another domain.</li>
			</ul>
			<p>Be aware that only inline and external ( &lt;script src="...") scripts are checked.
			There are many other ways to leak information.</p>

			<h4 id="help-ipv6">IPv6</h4>
			<p>Yes if at least one IPv6 is valid and has the HTTPS port opened</p>

			<h4 id="help-country">Country</h4>
			<p>From whois information of the IPs</p>

			<h4 id="help-responsetime">Response time colums</h4>
			<ul>
				<li>Search response time - response time of a query with the default engines.</li>
				<li>Google response time - respones time of the Google engine.</li>
				<li>Wikipedia response time - response time of the Wikipedia engine.</li>
				<li>Initial response time - response time of the front time without prior existing connection.</li>
			</ul>

			<h4 id="help-timing">Displayed time</h4>
			<ul>
				<li>Total time - client time</li>
				<li>Server time - on the searx instance, time to serve the page</li>
				<li>Load time - on the searx instance, time to load the third party page (wikipedia, google)</li>
				<li>Network time = Total time - Server time</li>
				<li>Processing time = Server time - Load time</li>
			</ul>
			<p>
				The instances have to send the <a href="https://www.w3.org/TR/server-timing/">Server-Timing header</a> to providing the Server, Load, Network and Processing times.
				See the searx commit <a href="https://github.com/asciimoo/searx/commit/554a21e1d07f3b434b5097b4e3d49e1403be7527">554a21e1d07f3b43</a>.
			</p>
		</Fragment>
	}

	renderHeaders(state) {
		if (state.comments) {
			return <Fragment>
				<th class="column-comments">Comments</th>
				<th class="column-alternativeurls">Alternative URLs</th>
			</Fragment>;
		}
		return <Fragment>
			<th class="column-tls">TLS<a class="help" href="#help-tls-grade">?</a></th>
			<th class="column-csp">CSP<a class="help" href="#help-csp-grade">?</a></th>
			<th class="column-html">HTML<a class="help" href="#help-http-grade">?</a></th>
			<th class="column-certificate">Certificate</th>
			<th class="column-ipv6">IPv6<a class="help" href="#help-ipv6">?</a></th>
			<th class="column-country">Country<a class="help" href="#help-country">?</a></th>
			<th class="column-network">Network</th>
			<th class="column-responsetime">Search response time</th>
			<th class="column-responsetime">Google response time</th>
			<th class="column-responsetime">Wikipedia response time</th>
			<th class="column-responsetime">Initial response time</th>
		</Fragment>;
	}

	renderFilters(state) {
		if (state.comments) {
			return <Fragment>
				<th class="column-comments" />
				<th class="column-alternativeurls" />
			</Fragment>;
		}
		return <Fragment>
			<th class="column-tls"><input value={state.tls_grade} onInput={linkState(this, 'tlsGrade')} /></th>
			<th class="column-csp"><input value={state.csp_grade} onInput={linkState(this, 'cspGrade')} /></th>
			<th class="column-html"><input value={state.html_grade} onInput={linkState(this, 'htmlGrade')} /></th>
			<th class="column-certificate" />
			<th class="column-ipv6"><input value={state.ipv6} onInput={linkState(this, 'ipv6')} type="checkbox" /></th>
			<th class="column-country"><input value={state.networkCountry} onInput={linkState(this, 'networkCountry')} /></th>
			<th class="column-network">
				<input value={state.networkName} onInput={linkState(this, 'networkName')} style="width: 90%" />
				<span><input value={state.asnPrivacy} onInput={linkState(this, 'asnPrivacy')}  style="margin: 0 0.25em;vertical-align: middle; width:auto;" /></span>
			</th>
			<th class="column-responsetime"><input value={state.query} onInput={linkState(this, 'query')} type="checkbox" /></th>
			<th class="column-responsetime"><input value={state.query_google} onInput={linkState(this, 'query_google')} type="checkbox" /></th>
			<th class="column-responsetime" />
			<th class="column-responsetime" />
		</Fragment>;
	}

	/*
	renderInstance(instance, state) {
		if (state.comments) {
			return <Fragment>
				<td class="column-comments">
					TODO
				</td>
				<td class="column-alternativeurls">
					TODO
				</td>
			</Fragment>;
		}
		return <Fragment>
                    <td class="column-tls"><tls-component value={instance.tls} /></td>
                    <td class="column-csp"><csp-component value={instance.http} /></td>
                    <td class="column-html"><html-component value={instance.html} hashes={$root.hashes} url={instance.url}/></td>
                    <td class="column-certificate"><certificate-component value={instance.tls} url={instance.url} /></td>
                    <td class="column-ipv6"><ipv6-component value={instance.network} /></td>
                    <td class="column-country"><network-country-component value={instance.network} asns={$root.asns} /></td>
                    <td class="column-network"><network-name-component value={instance.network} asns={$root.asns} /></td>
                    <td class="column-responsetime"><time-component value={instance.timing.search} time_select={$root.display.time_select} /></td>
                    <td class="column-responsetime"><time-component value={instance.timing.search_go} time_select={$root.display.time_select} /></td>
                    <td class="column-responsetime"><time-component value={instance.timing.search_wp} time_select={$root.display.time_select} /></td>
                    <td class="column-responsetime"><time-component value={instance.timing.initial} time_select={$root.display.time_select} /></td>
		</Fragment>;
	}
	*/

	render(props, state) {
		const [data, loading, error] = usePrerenderData(props);

		if (loading) return <h1>Loading...</h1>;

		if (error) return <p>Error: {error}</p>;

		const displayedInstances = this.instances_filtered(data.instances, state);

		return <Fragment>
			<h1>{data.instances.length} online instances 
				{(data.instances.length != displayedInstances.length) && <span>, {displayedInstances.length} displayed</span>}
			</h1>
			<div class="table-responsive">
				<table class="table table-bordered table-striped table-hover">
					<thead>
						<tr>
							<th class={style.column_url}>URL</th>
							<th class="column-version">Version</th>
							{this.renderHeaders(state)}
						</tr>
						<tr>
							<th class="column-url" />
							<th class="column-version"><input value={state.version} onInput={linkState(this, 'version')} /></th>
							{this.renderFilters(state)}
						</tr>
					</thead>
					<tbody>
						{displayedInstances.map(instance => (
							<tr>
								<td class="column-url"><UrlComponent url={instance.url} alternativeurls={instance.alternativeUrls} comments={instance.comments} /></td>
								<td class="column-version">{instance.version}</td>
								{ /* this.renderInstance(instance, state) */}
							</tr>
						))}
					</tbody>
				</table>
			</div>
			{this.renderLabels()}
		</Fragment>;
	}

	instances_filtered(instances, state) {
		let result = instances.slice();
		result = applyStrFilter(result, state.version, (f, instance) => filterStartsWith(f, instance.version));
		result = applyStrFilter(result, state.csp_grade, (f, instance) => filterIndexOf(f, instance.http.grade));
		result = applyStrFilter(result, state.tls_grade, (f, instance) => filterIndexOf(f, instance.tls.grade));
		result = applyStrFilter(result, state.html_grade, (f, instance) => filterIndexOf(f, instance.html.grade));
		result = applyStrFilter(result, state.network_name,
			(f, instance) => {
				for (const ipInfo of Object.values(instance.network.ips)) {
					if (ipInfo.asn) {
						const asn_info = this.asns[ipInfo.asn];
						const network = asn_info.network_name || asn_info.asn_description || '';
						return network.toLowerCase().indexOf(f) >= 0;
					}
				}
				return false;
			});
		result = applyStrFilter(result, state.network_country,
			(f, instance) => {
				for (const ipInfo of Object.values(instance.network.ips)) {
					if (ipInfo.asn) {
						const asn_info = this.asns[ipInfo.asn]
						const country = asn_info.network_country || asn_info.network_country || '';
						return country.toLowerCase().indexOf(f) >= 0;
					}
				}
				return false;
			});
		if (state.ipv6) {
			result = result.filter((instance) => instance.network.ipv6 == true);
		}
		if (state.asn_privacy) {
			result = result.filter((instance) => instance.network.asn_privacy >= 0);
		}
		if (state.query) {
			result = result.filter((instance) => instance.timing.search.success_percentage > 0);
		}
		if (state.query_google) {
			result = result.filter((instance) => instance.timing.search_go.success_percentage > 0);
		}
		// sort
		result.sort(compareFunctionCompose(...SORT_CRITERIAS));
		return result;
	}
}
