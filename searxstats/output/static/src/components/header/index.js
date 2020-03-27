import { h } from 'preact';
import { Link } from 'preact-router/match';


const Header = () => (
	<header class="navbar navbar-expand navbar-dark flex-column flex-md-row bd-navbar">
		<a class="navbar-brand" href="#">Searx instances</a>
		<div class="collapse navbar-collapse" id="navbarSupportedContent">
			<ul class="navbar-nav mr-auto">
				<li class="nav-item" activeClassName="active"><Link href="/">Online HTTPS</Link></li>
				<li class="nav-item" activeClassName="active"><Link href="/tor">Online Tor</Link></li>
				<li class="nav-item" activeClassName="active"><Link href="/offline">Offline &amp; error</Link></li>
				<li class="nav-item" activeClassName="active"><Link href="/engines">Engines</Link></li>
				<li class="nav-item" activeClassName="active"><Link href="/about">About</Link></li>
			</ul>
		</div>
	</header>
);

export default Header;
