// import express from 'express';
// import path from 'path';

// import {dirName} from '../../utilities/file.js';
const express = require("express");
const path = require("path");

// const {dirName} = require("../../utilities/file.js");

// const __dirname = dirName(import.meta.url);
// const HTML_DIR = path.join(process.cwd(), 'static', 'html');
// const HTML_DIR = path.join(__dirname, 'static', 'html');
// const HTML_DIR = path.join('static', 'html');
const HTML_DIR = path.join(__dirname, '..', '..', 'static', 'html');

const htmlRoute = express.Router();

htmlRoute.get('/', (req, res) => {
  res.sendFile(path.join(HTML_DIR, 'index.html'));
});

htmlRoute.get('/stepper', (req, res) => {
  res.sendFile(path.join(HTML_DIR, 'stepper.html'));
});

htmlRoute.get('/led', (req, res) => {
  res.sendFile(path.join(HTML_DIR, 'led.html'));
});

htmlRoute.get('/small', (req, res) => {
  res.sendFile(path.join(HTML_DIR, 'small.html'));
});

htmlRoute.get('/large', (req, res) => {
  res.sendFile(path.join(HTML_DIR, 'large.html'));
});

htmlRoute.get('/audio-test', (req, res) => {
  res.sendFile(path.join(HTML_DIR, 'audio-test.html'));
});

htmlRoute.get('/test-connect', (req, res) => {
  res.sendFile(path.join(HTML_DIR, 'test-connect.html'));
});

module.exports = htmlRoute;
