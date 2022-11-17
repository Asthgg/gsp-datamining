require('dotenv').config()

import { buildTravels } from "./buildTravels.js";


buildTravels("2022-10-01: 00:00:00", "2022-10-02 00:00:00", 3000);