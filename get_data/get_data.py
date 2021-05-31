import requests_cache
import pandas as pd
import click
import os
import aiohttp
import asyncio
import numpy as np
import warnings

API_KEY = os.getenv('GCP_API_KEY')
assert API_KEY is not None


# Limit the cocurrent worker
# https://stackoverflow.com/questions/48483348/how-to-limit-concurrency-with-python-asyncio
sem = asyncio.Semaphore(10)


async def retrieve_xy(record):
    qry_address = (f"{record['Site_title']}, {record['Site_streetaddress']}, "
                  f"{record['Suburb']}, {record['Site_state']}, {record['Site_postcode']}, "
                  "Australia")
    gcp_endpoint = "https://maps.googleapis.com/maps/api/geocode/json"
    params = dict(key=API_KEY, address=qry_address, region='au')
    async with sem:
        async with aiohttp.ClientSession() as session:
            async with session.get(gcp_endpoint, params=params) as response:
                raw = await response.json()
    # print('params=', params)
    # print('raw=', raw)
    if raw['status'] != 'OK' or len(raw['results']) == 0:
        return (None, None)
    location = raw['results'][0]['geometry']['location']
    return location['lat'], location['lng']


def value_check(l, v_min, v_max):
    return np.array([(v is not None) and (v_min <= v <= v_max) for v in l])


@click.command()
@click.option('-o', '--output', required=True, type=click.Path(writable=True))
def retrieve_data(output):
    url = 'https://www.coronavirus.vic.gov.au/sdp-ckan?resource_id=afb52611-6061-4a2b-9110-74c920bede77&limit=10000'
    with requests_cache.CachedSession('temp_cache', expire_after=3600) as session:
        raw = session.get(url).json()
    records = raw['result']['records']
    loop = asyncio.get_event_loop()

    results = loop.run_until_complete(
        asyncio.gather(
        *[retrieve_xy(record) for record in records]
    ))
    
    lat, lon = list(zip(*results))

    df = pd.DataFrame(records)
    df['lat'] = lat
    df['lon'] = lon

    # value check
    correct_records = value_check(lon, 140.7, 150.88) & value_check(lat, -40.73, -33.7)

    if sum(~correct_records) > 1:
        warnings.warn(f"incorrectly parsed {sum(~correct_records)} addresses:")
        warnings.warn(str(df))
        warnings.warn(str(df[['Site_streetaddress', 'Suburb', 'Site_postcode', 'lat', 'lon']][~correct_records]))

    df.to_json(output, orient='records')


if __name__ == "__main__":
    retrieve_data()
