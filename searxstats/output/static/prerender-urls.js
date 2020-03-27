/* eslint-disable quote-props */
const SORT_CRITERIAS = ['http.status_code', 'error', 'timing.search.error', 'version', 'tls.grade',
    'http.grade', 'html.grade', 'timing.search.all', 'url'];

const COMMON_ERROR_MESSAGE = {
	'Connection refused': 'Connection refused',
	'Connection timed out': 'Connection timed out',
	'HTTP status code 4': 'HTTP client error',
	'HTTP status code 5': 'HTTP server error',
	'[Errno -2] Name or service not known': 'Unknown host',
	'[Errno -2] Name does not resolve': 'Unknown host',
	'certificate verify failed': 'Certificate verify failed',
	'hostname \'': 'Hostname doesn\'t match certificate',
	'Tor Error: ': 'Tor Error'
};


const HTML_GRADE_MAPPING = {
	'V': 3,
	'V, ?': 3,
	'V, js?': 3,

	'C': 3,
	'C, ?': 3,
	'C, js?': 3,

	'Cjs': 3,
	'Cjs, ?': 3,
	'Cjs, js?': 3,

	'E': 0,
	'E, ?': 0,
	'E, js?': 0,

	'?': -1,
	'js?': -1,
};

function getErrorKey(errorMessage) {
	if (typeof errorMessage === 'string') {
		for (const [errorKey, errorTitle] of Object.entries(COMMON_ERROR_MESSAGE)) {
			if (errorMessage.startsWith(errorKey)) {
				return errorTitle;
			}
		}
	}
	return 'Others';
}

function setDefault(obj, key, value) {
	if (obj[key] == null) {
		// eslint-disable-next-line no-param-reassign
		obj[key] = value;
	}
}

function setComputedTimes(timing) {
	if (timing.server !== undefined && timing.all !== undefined) {
		timing.network = {
			median: timing.all.median - timing.server.median || undefined,
			value: timing.all.value - timing.server.value || undefined
		}
	}
	if (timing.load !== undefined && timing.server !== undefined) {
		timing.processing = {
			median: timing.server.median - timing.load.median || undefined,
			value: timing.server.value - timing.load.value || undefined
		}
	}
}

function normalizeSearxVersion(v) {
	if (typeof (v) !== 'string') {
		return [0, 0, 0, 0, ''];
	}
	const vdash = v.split('-');
	const vdot = vdash[0].split('.').map((i) => parseInt(i, 10));
	if (vdash.length === 1) {
		return [vdot[0], vdot[1], vdot[2], 0, ''];
	}
	if (vdash[1] === 'unknow') {
		return [vdot[0], vdot[1], vdot[2], 0, ''];
	}
	return [vdot[0], vdot[1], vdot[2], parseInt(vdash[1], 10), vdash[2]];
}

function normalizeGrade(grade) {
	if (grade === undefined || grade === null) {
		return '';
	}
	if (grade === '?') {
		return -1;
	}
	const result = ('G'.codePointAt(0) - grade.codePointAt(0)) * 3 + 1;
	if (grade.length === 2 && grade.endsWith('+')) {
		return result + 1;
	}
	if (grade.length === 2 && grade.endsWith('-')) {
		return result - 1;
	}
	return result;
}

function normalizeHtmlGrade(grade) {
	if (grade === undefined || grade === null) {
		return -1;
	}
	const ngrade = HTML_GRADE_MAPPING[grade];
	if (ngrade === undefined) {
		return -1;
	}
	return ngrade;
}

function getValue(f, obj, ...keys) {
	let value = obj;
	for (let i = 0; i < keys.length; i++) {
		const k = keys[i];
		if (k === undefined) {
			break;
		}
		if ((value === undefined)
			|| (!Object.prototype.hasOwnProperty.call(value, k))) {
			value = undefined;
			break;
		}
		value = value[k];
	}
	if (value !== undefined && f !== null) {
		value = f(value);
	}
	return value;
}

function compareTool(a, b, f, ...keys) {
	const va = getValue(f, a, ...keys);
	const vb = getValue(f, b, ...keys);
	if (va === '' && vb !== '') {
		return 1;
	}
	if (vb === '' && va !== '') {
		return -1;
	}
	if (va === undefined && vb !== undefined) {
		return -1;
	}
	if (va !== undefined && vb === undefined) {
		return 1;
	}
	if (va < vb) {
		return 1;
	}
	if (va > vb) {
		return -1;
	}
	return 0;
}

function compareVersion(a, b) {
	const nsva = normalizeSearxVersion(a);
	const nsvb = normalizeSearxVersion(b);
	for (let i = 0; i < 3; i += 1) {
		const result = compareTool(nsva, nsvb, null, i);
		if (result !== 0) {
			return result;
		}
	}
	return 0;
}

function getTime(timing) {
	if (timing.value !== undefined) {
		return timing.value;
	}
	if (timing.median !== undefined) {
		return timing.median;
	}
	return undefined;
}

function isError(timing) {
	if (timing.success_percentage > 0) {
		return false;
	}
	return (timing.error !== undefined);
}

const CompareFunctionCriterias = {
	'http.status_code': (a, b) => -compareTool(a, b, null, 'http', 'status_code'),
	'error': (a, b) => -compareTool(a, b, null, 'error'),
	'error_wp': (a, b) => compareTool(a, b, null, 'timing', 'search_wp', 'error'),
	'network.asn_privacy': (a, b) => compareTool(a, b, null, 'network', 'asn_privacy'),
	'version': (a, b) => compareVersion(a.version, b.version),
	'tls.grade': (a, b) => compareTool(a, b, normalizeGrade, 'tls', 'grade'),
	'html.grade': (a, b) => compareTool(a, b, normalizeHtmlGrade, 'html', 'grade'),
	'http.grade': (a, b) => compareTool(a, b, normalizeGrade, 'http', 'grade'),
	'timing.initial.all': (a, b) => -compareTool(a, b, getTime, 'timing', 'initial', 'all'),
	'timing.search.error': (a, b) => -compareTool(a, b, isError, 'timing', 'search'),
	'timing.search.all': (a, b) => -compareTool(a, b, getTime, 'timing', 'search', 'all'),
	'timing.search_wp.server': (a, b) => -compareTool(a, b, getTime, 'timing', 'search_wp', 'server'),
	'timing.search_wp.all': (a, b) => -compareTool(a, b, getTime, 'timing', 'search_wp', 'all'),
	'url': (a, b) => -compareTool(a, b, null, 'url'),
};

function compareFunctionCompose(...criterias) {
	const criteriaFunctions = criterias.map((criteriaName) => CompareFunctionCriterias[criteriaName]);
	for (let i = 0; i < criteriaFunctions.length; i += 1) {
		if (typeof criteriaFunctions[i] !== 'function') {
			throw `criteria #${i} ${criterias[i]} is not a function (${criteriaFunctions[i]})`;
		}
	}
	return (a, b) => {
		for (let i = 0; i < criteriaFunctions.length; i += 1) {
			const result = criteriaFunctions[i](a, b);
			if (result !== 0) {
				return result;
			}
		}
		return 0;
	};
}

function getInitialState(data) {
	const instances = [];
	const instancesWithError = {};
	const instancesWithoutSearx = [];
	const instancesTor = [];
	for (const [url, instance] of Object.entries(data.instances)) {
		instance.url = url;
		instance.engines = undefined;

		// dispatch instance
		if (instance.error !== undefined) {
			const errorKey = getErrorKey(instance.error);
			setDefault(instancesWithError, errorKey, []);
			instancesWithError[errorKey].push(instance);
		} else if (instance.version === null) {
			instancesWithoutSearx.push(instance);
		} else {
			setDefault(instance, 'network', {});
			setDefault(instance, 'tls', {});
			setDefault(instance.tls, 'certificate', {});
			setDefault(instance, 'timing', {});
			setDefault(instance.timing, 'initial', {});
			setDefault(instance.timing.initial, 'all', {});
			setDefault(instance.timing, 'search', {});
			setDefault(instance.timing.search, 'all', {});
			setDefault(instance.timing, 'search_wp', {});
			setDefault(instance.timing.search_wp, 'all', {});
			setDefault(instance.timing, 'search_go', {});
			setDefault(instance.timing.search_go, 'all', {});
			setDefault(instance, 'html', {});
			setDefault(instance.html, 'grade', '');
			setComputedTimes(instance.timing.search);
			setComputedTimes(instance.timing.search_wp);
			setComputedTimes(instance.timing.search_go);
			if (instance.network_type == 'tor') {
				instancesTor.push(instance)
			} else {
				instances.push(instance);
			}			
		}
	}

	const compareInstance = compareFunctionCompose(...SORT_CRITERIAS);
	instances.sort(compareInstance);
	instancesWithoutSearx.sort(compareInstance);
	instancesTor.sort(compareInstance);
	for (const instanceList of Object.values(instancesWithError)) {
		instanceList.sort(compareInstance);
	}

	return {
		errored: false,
		timestamp: data.timestamp,
		hashes: data.hashes,
		engines: data.engines,
		categories: data.categories,
		asns: data.asns,
		instances,
		instancesTor,
		instancesWithError,
		instancesWithoutSearx,
	};
}

module.exports = function() {
  const data = require(__dirname + '/instances.json');
  const state = getInitialState(data);
  return [
    {
      url: "/",
      title: "index",
      timestamp: state.timestamp,
      hashes: state.hashes,
      asns: state.asns,
      instances: state.instances,
    },
    {
      url: "/offline",
      title: "Offline",
      timestamp: state.timestamp,
      instancesWithError: state.instancesWithError,
      instancesWithoutSearx: state.instancesWithoutSearx,
	},
    {
      url: "/about",
      title: "About",
	}
  ];
};
