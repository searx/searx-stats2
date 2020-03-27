import { h } from 'preact';
import style from './style';

const About = () => { 
	return <div class={style.about}>
		<h1>About</h1>
		<p>This website shows the searx public instances. It is updated every 24 hours, except the response times which are updated every 3 hours.
		It requires Javascript until the <a href="https://github.com/dalf/searx-stats2/issues/9">issue #9</a> is fixed.</p>
		<p><a href="https://github.com/asciimoo/searx">Searx</a> is a free internet metasearch engine which aggregates results from more than 70 search services. Users are neither tracked nor profiled.</p>
		<p>Public instances listed here may yield less accurate results as they have much higher traffic and consequently have a higher chance of being blocked
		by search providers such as Google, Qwant, Bing, Startpage, etc. Hosting your own instance or using an instance that isn't listed here
		may give you a more consistent search experience.</p>
		<p>The source code of this website: <a href="https://github.com/dalf/searx-stats2">https://github.com/dalf/searx-stats2</a></p>
		<p>If something doesn't work as expected on this website, or you have a feature request, you can <a href="https://github.com/dalf/searx-stats2/issues">create an issue</a></p>

		<h3>Meta-searx instances</h3>
		<p>These are websites that source from other searx instances. These are useful if you can't decide which Searx instance to use:</p>
		<div class="table-responsive">
		<table class="table table-bordered table-striped table-hover">
			<thead>
			<tr>
				<th>URL</th>
				<th>Onion URL</th>
				<th>Comment</th>
			</tr>
			</thead>
			<tbody>
			<tr>
				<td class="column_url"><a href="https://searx.neocities.org/">Neocities</a></td>
				<td class="column_url" />
				<td>
				<p>Redirects users directly to a random selection of any known running
				server after entering query.</p>
				<p>Requires Javascript.</p>
				<p>Excludes servers with user tracking and analytics or are proxied through Cloudflare.</p>
				<p><a href="https://searx.neocities.org/changelog.html">Changelog</a></p>
				</td>
			</tr>
			<tr>
				<td class="column_url" />
				<td class="column_url"><a href="http://searxes.nmqnkngye4ct7bgss4bmv5ca3wpa55yugvxen5kz2bbq67lwy6ps54yd.onion/">Searxes</a></td>
				<td>
				<p>sources data from a randomly selected running server that satisfies
				admin's quality standards which is used for post-processing</p>
				<p>filters out privacy-hostile websites (like CloudFlare) and either marks
				them as such or folds them below the high ranking results.</p>
				<p><a href="https://github.com/Danwin">@Danwin</a></p>
				</td>
			</tr>
			</tbody>
		</table>
		</div>

		<h3>How can I add / remove my instance on this site ?</h3>
		<p>See the <a href="https://github.com/dalf/searx-instances">searx-instances</a> project</p>

		<h3>How can I install searx ?</h3>
		<p>See the <a href="https://asciimoo.github.io/searx/admin/index.html">searx documentation</a></p>
		<p>Or if you want to use docker: <a href="https://github.com/searx/searx-docker">https://github.com/searx/searx-docker</a></p>

		<h3>How can I use the results in another project ?</h3>
		<p>You can fetch <a href="data/instances.json">instances.json</a> directly.</p>
		<p>Do note that the format may change in the future.</p>

		<h3>Similar projects</h3>
		<ul>
		<li><a href="https://github.com/pointhi/searx_stats">https://github.com/pointhi/searx_stats</a></li>
		</ul>
	</div>
}
export default About;
