<?php
// Deployment template compatible with upstream Easy!Appointments config-sample.php.
// Copy to config.php in the separate Easy!Appointments installation, not this CMS.
class Config
{
    const BASE_URL = 'https://booking.necrotixlab.com'; // Suggested host; create it first.
    const LANGUAGE = 'bulgarian';
    const DEBUG_MODE = false;
    const DB_HOST = 'localhost';
    const DB_NAME = 'REPLACE_WITH_BOOKING_DATABASE';
    const DB_USERNAME = 'REPLACE_WITH_BOOKING_USER';
    const DB_PASSWORD = 'REPLACE_WITH_RANDOM_PASSWORD';
}
