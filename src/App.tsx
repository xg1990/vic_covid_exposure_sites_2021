import React from 'react';
// import logo from './logo.svg';
import './App.css';
import { CovidMap } from './components/covidmap';
import Grid from '@material-ui/core/Grid';

function App() {
  return (
    <Grid container spacing={3}>
      <Grid item xs={12}>
        <CovidMap />
      </Grid>
    </Grid>
  );
}

export default App;
