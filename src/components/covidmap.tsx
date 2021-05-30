import 'leaflet/dist/leaflet.css';
import React, { useState } from 'react'
import { makeStyles } from '@material-ui/core/styles';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet'
import coviddata from '../data.json'
import L from "leaflet";
import { AppBar, Button, Card, CardContent, TextField, Toolbar, Typography } from '@material-ui/core';
import moment from 'moment';

const useStyles = makeStyles((theme) => ({
  root: {
    minWidth: 275,
  },
  bullet: {
    display: 'inline-block',
    margin: '0 2px',
    transform: 'scale(0.8)',
  },
  title: {
    // fontSize: 30,
    flexGrow: 1,
  },
  pos: {
    marginBottom: 12,
  },
  menuButton: {
    marginRight: theme.spacing(2),
  },
  markerhtml: {
    fontSize: 20,
  },
  textField: {
    fontColor: '#FFF',
    color: 'white',
    marginLeft: theme.spacing(1),
    marginRight: theme.spacing(1),
  }
}));

export function CovidMap() {
  const classes = useStyles();

  const iconOptions = {
    className: classes.markerhtml,
    //runner, medium skin tone, Zero-Width-Joiner, female:
    html: '🛑' // or: '&#x1f3c3;&#x1f3fd;&#x200d;&#x2640;'
  }
  const [selectedDate, setSelectedDate] = useState<string | null>(
    null,
  );
  const handleDateChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    console.log('event=', event)
    if (event !== null && event.target !== null && event.target.value !== "") {
      console.log('event.target.value=', event.target.value)
      setSelectedDate(event.target.value);
    }
    else setSelectedDate(null)
  };

  return (
    <div>
      <AppBar position="static">
        <Toolbar>
          <Typography className={classes.title} variant="h5" noWrap>
            Covid exposure sites in Victoria
          </Typography>
          <div className={classes.title}>
            <Typography variant="h6" >
              Select a Date:
          </Typography>
            <Typography variant="h6">
              <TextField
                id="date"
                type="date"
                value={selectedDate}
                onChange={handleDateChange}
                className={classes.textField}
                InputProps={{ style: { color: 'white' } }}
                InputLabelProps={{
                  shrink: true,
                }}
              />
            </Typography>
          </div>
          <Button color="inherit" href="https://github.com/xg1990/vic_covid_exposure_sites_2021">Github</Button>
        </Toolbar>
      </AppBar>
      <MapContainer center={[-37.8136, 144.9631]} zoom={11} scrollWheelZoom={true}>
        <TileLayer
          attribution='&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {coviddata.filter(
          (record)=>{
            if (selectedDate === null) return true;
            else {
              const d1 = moment(record['Exposure_date'] || '', "DD/MM/YYYY").format('L');
              const d2 = moment(selectedDate || '', 'YYYY-MM-DD').format('L');
              console.log(record['Exposure_date'] || '')
              console.log(selectedDate)
              console.log("d1,d2=", d1, d2)
              return d1 === d2;
            }
          }
        ).map((record) => {
          const is_tier_one = record['Advice_title'].match(/^Tier 1/)
          return (
            <Marker position={[record['lat'] || 0, record['lon'] || 0]} icon={L.divIcon({ ...iconOptions, html: is_tier_one ? '🛑' : '⚠️' })}>
              <Popup>
                <Card className={classes.root}>
                  <CardContent>
                    <Typography className={classes.title} color="textSecondary" gutterBottom>
                      {record['Advice_title']}
                    </Typography>
                    <Typography variant="h5" component="h2">
                      {record['Site_title']}
                    </Typography>
                    <Typography className={classes.pos} color="textSecondary">
                      {record['Site_streetaddress']}, {record['Suburb']} {record['Site_postcode']}
                    </Typography>
                    <Typography variant="body2" component="p">
                      {record['Advice_instruction']}
                    </Typography>
                    <Typography variant="body2" component="p">
                      <b>Exposure_date</b>: {record['Exposure_date']}, {record['Exposure_time']}
                    </Typography>
                  </CardContent>
                </Card>
              </Popup>
            </Marker>
          )
        })}
      </MapContainer>
    </div>
  )
}