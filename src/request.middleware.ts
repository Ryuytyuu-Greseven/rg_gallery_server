import { NextFunction, Request, Response } from 'express';
import { createConnection } from 'mongoose';

const connections = new Map();

function makeConnection(request: any) {
  return createConnection(
    `mongodb://localhost`,
    {
      dbName: request.headers.prefix,
      user: 'root',
      pass: 'root',
      connectTimeoutMS: 2,
    },
    (error, db) => {
      if (error) {
        console.log('error encountered\t\t --', error);
      } else {
        console.log(`connected to ${request.headers.prefix}`);
      }
    },
  );
}

export async function generateConnections(
  request: Request,
  response: Response,
  next: NextFunction,
) {
  console.log(request.headers['prefix']);
  request['mongo'] = await makeConnection(request);
  // console.log(request['mongo']);
  next();
}
