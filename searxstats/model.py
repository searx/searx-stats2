import inspect
import calendar
import datetime
import json
from enum import Enum

from .common.memoize import erase_by_name
from .common.utils import dict_update, create_task
from .common.foreach import for_each
from .common.http import get_network_type, NetworkType


class AsnPrivacy(Enum):
    BAD = -1
    UNKNOWN = 0
    GOOD = 1


class SearxStatisticsResult:

    __slots__ = 'metadata', 'instances', 'engines', 'categories', 'hashes', 'asns'

    def __init__(self):
        self.metadata = {
            'timestamp': calendar.timegm(datetime.datetime.now().utctimetuple()),
            'ips': {},
        }
        self.instances = {}
        self.engines = {}
        self.categories = []
        self.hashes = []
        self.asns = {}

    @staticmethod
    def _is_valid_instance(detail):
        return detail.get('version', None) is not None and 'error' not in detail

    def iter_instances(self, only_valid=False, network_type=NetworkType):
        if isinstance(network_type, NetworkType):
            network_type = [network_type]
        for instance, detail in self.instances.items():
            if only_valid and not self._is_valid_instance(detail):
                continue
            if get_network_type(instance) not in network_type:
                continue
            yield instance, detail

    def get_instance(self, url):
        return self.instances[url]

    def create_instance(self, url, detail):
        self.instances[url] = detail

    def update_instance(self, url, detail):
        if url in self.instances:
            self.instances[url].update(detail)
        else:
            self.instances[url] = detail

    def write(self, output_file_name):
        searx_json = {
            'metadata': self.metadata,
            'instances': self.instances,
            'engines': self.engines,
            'categories': self.categories,
            'hashes': self.hashes,
            'asns': self.asns,
        }
        with open(output_file_name, "w") as output_file:
            json.dump(searx_json, output_file, indent=4, ensure_ascii=False)


class Fetcher:

    __slots__ = 'name', 'help_message', 'fetch_module', 'group_name', 'mandatory'

    # pylint: disable=too-many-arguments
    def __init__(self, fetch_module, name, help_message, group_name=None, mandatory=False):
        self.fetch_module = fetch_module
        self.name = name
        self.help_message = help_message
        self.group_name = group_name
        self.mandatory = mandatory

    def create_fetch_task(self, loop, executor, searx_stats_result: SearxStatisticsResult):
        fetch = self.get_function('fetch')
        return create_task(loop, executor, fetch, searx_stats_result)

    def create_initialize_task(self, loop, executor):
        initialize = self.get_function('initialize')
        if initialize is not None:
            return create_task(loop, executor, initialize)

        async def dummy():
            pass
        return dummy()

    def erase_memoize(self):
        erase_by_name(self.fetch_module.__name__)

    def get_function(self, name):
        if hasattr(self.fetch_module, name):
            function = getattr(self.fetch_module, name)
            if inspect.isfunction(function):
                return function
        return None


def create_fetch(keys, fetch_one, only_valid=False, network_type=NetworkType, limit=1):

    async def fetch_and_set_async(url, detail, *args, **kwargs):
        result = await fetch_one(url, *args, **kwargs)
        dict_update(detail, keys, result)

    def fetch_and_set_function(url, detail, *args, **kwargs):
        result = fetch_one(url, *args, **kwargs)
        dict_update(detail, keys, result)

    async def fetch(searx_stats_result: SearxStatisticsResult):
        if inspect.iscoroutinefunction(fetch_one):
            fetch_and_set = fetch_and_set_async
        else:
            fetch_and_set = fetch_and_set_function
        instance_iterator = searx_stats_result.iter_instances(only_valid=only_valid, network_type=network_type)
        await for_each(instance_iterator, fetch_and_set,
                       limit=limit)

    fetch.__name__ = 'fetch({}, {}, only_valid={}, network_type={}, limit={})'.\
        format(str(keys), fetch_one.__name__, only_valid, network_type, limit)

    return fetch
