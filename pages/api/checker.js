const NetcatClient = require('netcat/client')

const DEFAULT_PORTS = [
  9000, // tcp/udp for teku, nimbus, lighthouse
  12000, // udb for prysm
  13000, // tcp for beacon prysm
  30303, // eth1 (geth, nethermind)
];

const parseIp = (req) => {
  return (typeof req.headers['x-forwarded-for'] === 'string'
      && req.headers['x-forwarded-for'].split(',').shift())
    || req.headers['x-real-ip']
    || req.connection?.remoteAddress
    || req.socket?.remoteAddress
    || req.connection?.socket?.remoteAddress
    || null;
}

const getQueryPorts = (query) => {
  const ports_from_query = query && query.ports ?
    query.ports
      .split(",")    // parse on ,
      .slice(0, 10)  // grab first 10
      .map(Number)   // string -> number
      .filter(number => !isNaN(number))                    // filter NaN
      .filter(number => (number > 0 && number <= 65535))   // limit valid ports
    : null;

  return ports_from_query;
}

export default async function (req, res) {
  const client_ip = parseIp(req);
  // console.log("client ip " + client_ip);

  const query = req ? req.query : null;
  // console.log(query);

  const query_ports = getQueryPorts(query);
  const ports_to_check = query_ports || DEFAULT_PORTS;
  // console.log("ports to check: " + ports_to_check);

  return new Promise((resolve) => {
    var results = [];

    for (const port in ports_to_check) {
      var nc = new NetcatClient().addr(client_ip).port(ports_to_check[port]).connect()
        .once('connect', function () {
          results.push(ports_to_check[port])
          nc.close()
        }).once('err', function (err) {
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
