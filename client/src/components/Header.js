// src/components/Header.js
import React from 'react';
import { Link as RouterLink } from 'react-router-dom';
import { AppBar, Toolbar, Typography, Button, Box, Switch } from '@mui/material';

function Header({ darkMode, setDarkMode }) {
    return (
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            CaneBane
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Switch
              checked={darkMode}
              onChange={() => setDarkMode(!darkMode)}
              color="default"
            />
            <Typography variant="body2" sx={{ color: 'inherit', marginRight: 2 }}>
              {darkMode ? 'Light Mode' : 'Dark Mode'}
            </Typography>
            <Button color="inherit" component={RouterLink} to="/">Home</Button>
            <Button color="inherit" component={RouterLink} to="/dashboard">Dashboard</Button>
            <Button color="inherit" component={RouterLink} to="/login">Login</Button>
            <Button color="inherit" component={RouterLink} to="/signup">Sign Up</Button>
          </Box>
        </Toolbar>
      </AppBar>
    );
  }

export default Header;
