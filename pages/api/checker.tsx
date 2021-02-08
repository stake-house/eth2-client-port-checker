import { NextApiRequest, NextApiResponse } from "next";

import NetcatClient from 'netcat/client';

const DEFAULT_PORTS = [
  9000, // tcp/udp for teku, nimbus, lighthouse
  12000, // udb for prysm
  13000, // tcp for beacon prysm
  30303, // eth1 (geth, nethermind)
];

const parseIp = (req: NextApiRequest) => {
  return (typeof req.headers['x-forwarded-for'] === 'string'
      && req.headers['x-forwarded-for'].split(',').shift())
    || req.headers['x-real-ip']
    || req.socket?.remoteAddress
    || null;
}

const processPortsQueryString = (query: string): number[] | null => {
  return query
      .split(",")    // parse on ,
      .slice(0, 10)  // grab first 10
      .map(Number)   // string -> number
      .filter(number => !isNaN(number))                    // filter NaN
      .filter(number => (number > 0 && number <= 65535));   // limit valid ports
}

const parseQuery = (ports_query: string | string[]): number[] | null => {
  if (!ports_query) {
    return null;
  }

  if (Array.isArray(ports_query)) {
    if (ports_query.length > 0) {
      return processPortsQueryString(ports_query[0]);
    } else {
      return null;
    }
  }

  return processPortsQueryString(ports_query);
}

export default async function (req: NextApiRequest, res: NextApiResponse) {
  const client_ip = parseIp(req);

  const ports_query = req.query?.ports;
  const ports_requested: number[]|null = parseQuery(ports_query);

  const ports_to_check = ports_requested || DEFAULT_PORTS;

  return new Promise<void>((resolve) => {
    var results = [];

    for (const port in ports_to_check) {
      var nc = new NetcatClient().addr(client_ip).port(ports_to_check[port]).connect()
        .once('connect', function () {
          results.push(ports_to_check[port])
          nc.close()
        }).once('err', function () {
          nc.close()
        })
    }

    setTimeout(() => {
      res.status(200).json({
        requester_ip: client_ip,
        checked_ports: ports_to_check,
        open_ports: results
      })
      resolve()
    }, 1000);
  })

}
