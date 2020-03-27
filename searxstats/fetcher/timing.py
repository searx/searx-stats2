import sys
import traceback
import asyncio
import random

from lxml import etree
from searxstats.common.utils import exception_to_str
from searxstats.common.html import extract_text, html_fromstring
from searxstats.common.http import new_client, get, get_network_type, NetworkType
from searxstats.common.memoize import MemoizeToDisk
from searxstats.common.response_time import ResponseTimeStats
from searxstats.config import DEFAULT_COOKIES, DEFAULT_HEADERS
from searxstats.model import create_fetch


RESULTS_XPATH = etree.XPath(
    "//div[@id='main_results']/div[contains(@class,'result-default')]")
ENGINE_XPATH = etree.XPath("//span[contains(@class, 'label')]")
# There is no result, error on the main section
ALERT_DANGER_MAIN_XPATH = etree.XPath("//div[contains(@class, 'alert-danger')]/p[2]")
# There are results, error on the side (above infoboxes)
ALERT_DANGER_SIDE_XPATH = etree.XPath("//div[contains(@class, 'alert-danger')]/text()")


async def check_html_result_page(engine_name, response):
    document = await html_fromstring(response.text)
    result_element_list = RESULTS_XPATH(document)
    if len(result_element_list) == 0:
        return False, 'No result'
    for result_element in result_element_list:
        for engine_element in ENGINE_XPATH(result_element):
            if extract_text(engine_element).find(engine_name) >= 0:
                continue
            return False, f'A result is not from the {engine_name}'
    return True, None


async def check_google_result(response):
    return await check_html_result_page('google', response)


async def check_wikipedia_result(response):
    return await check_html_result_page('wikipedia', response)


async def check_search_result(response):
    document = await html_fromstring(response.text)
    result_element_list = RESULTS_XPATH(document)
    alert_danger_list = ALERT_DANGER_MAIN_XPATH(document)
    if len(alert_danger_list) > 0:
        return True, extract_text(alert_danger_list)
    alert_danger_list = ALERT_DANGER_SIDE_XPATH(document)
    if len(alert_danger_list) > 0:
        return True, extract_text(alert_danger_list)
    if len(result_element_list) == 0:
        return False, 'No result'
    if len(result_element_list) == 1:
        return False, 'Only one result'
    if len(result_element_list) == 2:
        return False, 'Only two results'
    return True, None


async def check_results_always_valid(_):
    return True, None


# pylint: disable=too-many-arguments, too-many-locals
async def request_stat(client, url, count, between_a, and_b, check_results, **kwargs):
    error_count = 0
    response_time_stats = ResponseTimeStats()
    check_results = check_results or check_results_always_valid
    # loop
    for _ in range(0, count):
        await asyncio.sleep(random.randint(a=between_a, b=and_b))
        response, error_msg = await get(client, url, **kwargs)

        # check error_msg
        if error_msg is not None:
            response_time_stats.add_error(error_msg)
        else:
            await response.aread()
            # check response
            valid_response, error_msg = await check_results(response)
            if valid_response:
                response_time_stats.add_response(response)
            else:
                response_time_stats.add_error(error_msg)
                error_count += 1
                if error_count > 3:
                    break
    return response_time_stats.get()


async def request_stat_with_log(instance, obj, key, *args, **kwargs):
    result = await request_stat(*args, **kwargs)
    obj[key] = result
    if 'error' in result:
        print(f'❌ {str(instance)}: {key}: {result["error"]}')


async def get_cookie_settings(client, url):
    # an user request without outgoing request:
    # currency will never match "ip".
    kwargs = {
        'params': {'q': '!currency ip'},
        'headers': DEFAULT_HEADERS,
        'cookies': DEFAULT_COOKIES,
    }

    _, error_msg = await get(client, url, **kwargs)
    if error_msg is not None and error_msg.startswith('HTTP status code 5'):
        # cookie settings may cause a server error: disable them and try again
        del kwargs['cookies']
        _, error_msg = await get(client, url, **kwargs)
        if error_msg is None:
            # no more error: cookies are (most probably) the cause.
            return None
        else:
            # there is still an error
            # disable cookie
            return None
    return DEFAULT_COOKIES


@MemoizeToDisk(expire_time=3600*24)
async def fetch_one(instance: str) -> dict:
    timings = {}
    try:
        network_type = get_network_type(instance)
        timeout = 15 if network_type == NetworkType.NORMAL else 30
        async with new_client(timeout=timeout, network_type=network_type) as client:
            # check if cookie settings is supported
            # intended side effect: add one HTTP connection to the pool
            cookies = await get_cookie_settings(client, instance)

            # check the default engines
            print('🔎 ' + instance)
            await request_stat_with_log(instance, timings, 'search',
                                        client, instance,
                                        3, 120, 160, check_search_result,
                                        params={'q': 'time'},
                                        cookies=cookies, headers=DEFAULT_HEADERS)

            # check the wikipedia engine
            print('🐘 ' + instance)
            await request_stat_with_log(instance, timings, 'search_wp',
                                        client, instance,
                                        2, 60, 160, check_wikipedia_result,
                                        params={'q': '!wp time'},
                                        cookies=cookies, headers=DEFAULT_HEADERS)

            # check the google engine
            # may include google results too, so wikipedia engine check before
            print('🔍 ' + instance)
            await request_stat_with_log(instance, timings, 'search_go',
                                        client, instance,
                                        2, 60, 160, check_google_result,
                                        params={'q': '!google time'},
                                        cookies=cookies, headers=DEFAULT_HEADERS)
    except Exception as ex:
        print('❌❌ {0}: unexpected {1} {2}'.format(str(instance), type(ex), str(ex)))
        timings['error'] = exception_to_str(ex)
        traceback.print_exc(file=sys.stdout)
    else:
        print('🏁 {0}'.format(str(instance)))
    return timings


# pylint: disable=invalid-name
fetch = create_fetch(['timing'], fetch_one, only_valid=True, limit=150)
