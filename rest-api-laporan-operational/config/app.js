import dotenv from 'dotenv';

dotenv.config();

export const APP_NAME = 'knitto-rest-sdm';
export const APP_PORT = process.env.APP_PORT || 1025;
export const WS_PORT = process.env.WS_PORT || 1026;

export const ROLE_USER = {
  SUPER_ADMIN: 'super-admin',
  STAFF: 'staff',
  TEAM_LEADER: 'team-leader',
};

export const ASANA_TASK_QUEUE = 'ASANA_TASK_QUEUE';

export const JWT_SECRET = 'kBFz70VDWbtCPK0JqK618djhCx0Kiy8n';
export const KNITTO_RABBIT_URL = process.env.KNITTO_RABBIT_URL || null;

export const TASK_LABEL_COLOR = [
  '#FF922E',
  '#3EDF23',
  '#8123DF',
];

export const KNITTO_REST_THIRD_PARTY = process.env.KNITTO_REST_THIRD_PARTY || null;

export const NODE_ENV = process.env.NODE_ENV || 'development';
