import requests_cache
import pandas as pd
import click
import tqdm
import os


API_KEY = os.getenv('GCP_API_KEY')

def retrieve_xy(record):
    qry_address = (f"{record['Site_title']}, {record['Site_streetaddress']} "
                  f"{record['Suburb']}, {record['Site_state']} {record['Site_postcode']}")
    gcp_endpoint = "https://maps.googleapis.com/maps/api/geocode/json?address={address}&key={API_KEY}".format(
        address=qry_address, API_KEY=API_KEY
    )
    with requests_cache.CachedSession('temp_cache', expire_after=86400) as session:
        raw = session.get(gcp_endpoint).json()
    if raw['status'] != 'OK' or len(raw['results']) == 0:
        return (None, None)
    location = raw['results'][0]['geometry']['location']
    return location['lat'], location['lng']


@click.command()
@click.option('-o', '--output', required=True, type=click.Path(writable=True))
def retrieve_data(output):
    url = 'https://www.coronavirus.vic.gov.au/sdp-ckan?resource_id=afb52611-6061-4a2b-9110-74c920bede77&limit=10000'
    with requests_cache.CachedSession('temp_cache', expire_after=86400) as session:
        raw = session.get(url).json()
    
    lat, lon = list(zip(*[retrieve_xy(record) for record in tqdm.tqdm(raw['result']['records'])]))

    df = pd.DataFrame(raw['result']['records'])
    df['lat'] = lat
    df['lon'] = lon

    df.to_json(output, orient='records')
    

if __name__ == "__main__":
    retrieve_data()