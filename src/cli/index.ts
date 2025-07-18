#!/usr/bin/env node

import dotenv from 'dotenv';
import { CLI } from './CLI';

// Load environment variables
dotenv.config();

const cli = new CLI();
cli.run();