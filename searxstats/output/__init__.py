import os
import json
import shutil
import subprocess

import brotli
from ..model import SearxStatisticsResult


def write_file(file_name, content):
    os.makedirs(os.path.dirname(file_name), exist_ok=True)
    with open(file_name, 'w') as stream:
        stream.write(content)


def write_json(searx_stats_result: SearxStatisticsResult, output_file: str):
    searx_json = searx_stats_result.get_json()
    result = json.dumps(searx_json, indent=4, ensure_ascii=False)
    write_file(output_file, result)


def copy_build_to_output(build_directory: str, output_directory: str):
    for root, _, files in os.walk(build_directory, topdown=False, followlinks=True):
        for name in files:
            from_file_name = os.path.join(root, name)
            print(from_file_name)
            if from_file_name.startswith(build_directory):
                relative_file_name = from_file_name[len(build_directory)+1:]
                to_file_name = os.path.realpath(os.path.join(output_directory, relative_file_name))
                os.makedirs(os.path.dirname(to_file_name), exist_ok=True)
                shutil.copy(from_file_name, to_file_name)
                shutil.copystat(from_file_name, to_file_name)
            else:
                print('Internal Error', build_directory, from_file_name)


def write_compressed_files(output_directory: str):
    for root, _, files in os.walk(output_directory, topdown=False, followlinks=True):
        for name in files:
            if name.endswith('.html') or name.endswith('.css') or name.endswith('.js'):
                file_name = os.path.join(root, name)
                brotli_file_name = file_name + '.br'
                with open(file_name, 'rb') as stream:
                    content = stream.read()
                brotli_content = brotli.compress(content)
                with open(brotli_file_name, 'wb') as stream:
                    stream.write(brotli_content)
                shutil.copystat(file_name, brotli_file_name)


def write(searx_stats_result: SearxStatisticsResult, output_directory: str):
    current_directory = os.path.dirname(os.path.realpath(__file__))
    static_directory = os.path.join(current_directory, 'static')
    build_directory = os.path.join(static_directory, 'build')
    write_json(searx_stats_result, os.path.join(static_directory, 'instances.json'))
    subprocess.run(['npm', 'run', 'build'], cwd=static_directory, check=False)
    copy_build_to_output(build_directory, output_directory)
    shutil.rmtree(build_directory)
    write_compressed_files(output_directory)
