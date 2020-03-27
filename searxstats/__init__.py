import logging
import asyncio

from .common import initialize as initialize_common, finalize as finalize_common
from .fetcher import fetch, initialize as initialize_fetcher, FETCHERS
from .searx_instances import get_searx_stats_result_from_repository, get_searx_stats_result_from_list
from .output import write as output_write


async def initialize():
    await initialize_common()
    initialize_logging()


async def finalize():
    await finalize_common()


def initialize_logging():
    logging.basicConfig(level=logging.DEBUG)
    for logger_name in ('httpx.client', 'httpx.config', 'hpack.hpack', 'hpack.table',
                        'httpx.dispatch.connection_pool', 'httpx.dispatch.connection',
                        'httpx.dispatch.http2', 'httpx.dispatch.http11',
                        'ipwhois.rdap', 'ipwhois.ipwhois', 'ipwhois.net', 'ipwhois.asn',
                        'selenium.webdriver.remote', 'urllib3.connectionpool',
                        'git.cmd', 'git.repo'):
        logging.getLogger(logger_name).setLevel(logging.WARNING)


async def run_once(output_directory: str, private: bool, instance_urls: list, selected_fetcher_names: list):
    # select fetchers
    selected_fetchers = list(
        filter(lambda f: f.name in selected_fetcher_names, FETCHERS))

    # initialize fetchers
    await initialize_fetcher(selected_fetchers)

    # fetch instance list
    if not private and (instance_urls is None or len(instance_urls) == 0):
        searx_stats_result = await get_searx_stats_result_from_repository()
    else:
        searx_stats_result = await get_searx_stats_result_from_list(instance_urls, private)

    # output
    print('\n{0} instance(s)\n'.format(len(searx_stats_result.instances.keys())))

    # fetch
    await fetch(searx_stats_result, selected_fetchers)

    # write results
    output_write(searx_stats_result, output_directory)


async def run_server(*args, **kwargs):
    await run_once(*args, **kwargs)
    while True:
        print('\n💤 Sleep until next run\n')
        await asyncio.sleep(24 * 3600)
        await run_once(*args, **kwargs)


def erase_memoize(fetcher_name_list: list):
    for fetcher in filter(lambda f: f.name in fetcher_name_list, FETCHERS):
        fetcher.erase_memoize()
