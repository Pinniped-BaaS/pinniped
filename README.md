# Summary
Pinniped is an open-source, JavaScript backend-as-a-service application that offers:
 * An embedded SQLite3 Database,
 * An admin dashboard,
 * Autogenerated RESTish APIs,
 * Custom events and extensible routes.

## Table of Contents
* [How to Use](https://github.com/Pinniped-BaaS/pinniped/tree/readme?tab=readme-ov-file#how-to-use)
* [Documentation](https://github.com/Pinniped-BaaS/pinniped/tree/readme?tab=readme-ov-file#documentation)

## How to Use
Before starting, check if you meet the requirements [here](https://github.com/Pinniped-BaaS).

Install the dependency
```javascript 
npm install pinniped
```
Import and create a Pinniped instance
```javascript
// CommonJS
const { pnpd } = require('pinniped');
const app = pnpd();
app.start(serverConfig);

// Or ECMAScript
import { pnpd } from 'pinniped'
const app = pnpd();
app.start();
```
Or install the CLI and create a project
1. Run `npm install pinniped-cli -g`
2. Run `pinniped create`

## Documentation
### start (serverConfig)
Optionally, the Pinniped instance accepts an object that contains the server configuration.
There are configurations to change how the Express server runs. By default, these values are expected to be in a `.env` file. 
However, you can change the source for the server-specific configurations where Pinniped is instantiated.
```javascript
let serverConfig = {
  port: process.env.SERVER_PORT,
  domain: process.env.SERVER_DOMAIN,
  altNames: process.env.SERVER_ALTNAMES,
  directory: process.env.SERVER_DIRECTORY,
};

app.start(serverConfig);
```
## Server Config
If your Pinniped-powered project was built with `pinniped-cli`, then the project's `.env` file will contain supported configuration settings.

### SERVER_DOMAIN 
The base domain name for requesting a TLS certificate from Let's Encrypt. If `SERVER_DOMAIN` has a value, it'll auto-cert the domain.
If this is undefined the server will run on `SERVER_PORT`. Otherwise, if it's present and the auto-cert runs, the `SERVER_PORT` value is ignored and the server will run on port 443 with a redirect server (running on port 80) that redirects to port 443. 
```javascript
SERVER_DOMAIN=example.com
```

### SERVER_ALTNAMES
Holds any alternative names you'd like on the certificate. If left undefined, it'll automatically add the `www` version of `SERVER_DOMAIN`. If you have multiple domain names that point to the same site you can add them here. The format is the same as `SERVER_DOMAIN` but commas separate each name. 
```javascript
SERVER_ALTNAMES=www.example.com,www.example.net
```

### SERVER_DIRECTORY 
This tells the server to try to obtain a staging certificate or a production certificate. By default, it'll get a staging certificate. Once you verify that you can get the staging certificate you can change this value to `production`. 
```javascript
SERVER_DIRECTORY=production
```
For more information about this process, check out [LetsEncrypt](https://letsencrypt.org/docs/staging-environment/).

### SERVER_PORT
The port that the server runs on. This is only used if `SERVER_DOMAIN` is undefined and the server is running on HTTP. It defaults to 3000 if undefined.

### CORS_WHITELIST 
Can be regex or plaintext, if not provided, defaults to allowing all CORS traffic. Commas separate each domain that CORS should allow. 
```javascript
CORS_WHITELIST=www.example.com,/regexvalue/,www.example2.com
```

### SESSION_SECRET 
Used by the server to encrypt session information. If left blank the server will automatically generate one and save it here.

## Custom Routes and Event Handlers
If the project was created using `pinniped-cli`, it's recommended to write these methods in the project's `index.js`.

### addRoute (method, path, handler)
`addRoute` mounts the parameter, path, onto the host's path. Once it receives
the specified HTTP request method at that path, it'll invoke the handler passed in.
```javascript
app.addRoute("GET", "/store", () => {
	console.log("GET request received at /store");
});
```
### onGetOneRow ( ... tables)
`onGetOneRow` returns a new `PinnipedEvent` that can `add` a handler or `trigger` the event.
The tables in the database can be specified to invoke the handler on this event, getting a single row.
To have it run on any table, leave the parameter empty. 
```javascript
app.onGetOneRow().add(() => {
	console.log("onGetOneRow triggered on any tables"
});


app.onGetOneRow("seals").add(() => {
	console.log("onGetOneRow triggered on 'seals' table");
});

app.onGetOneRow("seals", "dolphins").add(() => {
	console.log("onGetOneRow triggered on 'seals' and 'dolphin' tables");
});

// Trigger the Event Artificially
app.onGetOneRow().trigger();
```
### onGetAllRows ( ... tables)
Functions similarly to `onGetOneRow` except in the event where all rows are grabbed.
```javascript
app.onGetAllRows().add(() => {
	console.log("onGetAllRows triggered on any table");
});
```
### onCreateOneRow ( ... tables)
Functions similarly to `onGetOneRow` except in the event where a row is created.
```javascript
app.onCreateOneRow().add(() => {
	console.log("onCreateOneRow triggered on any table");
});
```

### onUpdateOneRow ( ... tables)
Functions similarly to `onGetOneRow` except in the event where a row is updated.
```javascript
app.onUpdateOneRow().add(() => {
	console.log("onUpdateOneRow triggered on any table");
});
```
### onDeleteOneRow ( ... tables)
Functions similarly to `onGetOneRow` except in the event where a row is deleted.
```javascript
app.onDeleteOneRow().add(() => {
	console.log("onDeleteOneRow triggered on all tables");
});
```
### onBackupDatabase
Can add handlers in the event that the database is backed up.
```javascript
app.onBackupDatabase().add(() => {
	console.log("Database backed up");
});
```
### onRegisterUser
```javascript
app.onRegisterUser().add(() => {
	console.log("User is registered");
});
```
### onRegisterAdmin
```javascript
app.onRegisterAdmin().add(() => {
	console.log("Admin is registered");
});
```
### onLoginUser
```javascript
app.onLoginUser().add(() => {
	console.log("User logged in");
});
```
### onLoginAdmin
```javascript
app.onLoginAdmin().add(() => {
	console.log("Admin logged in");
});
```
### onLogout
```javascript
app.onLogout().add(() => {
	console.log("Logged out");
});
```
### onCustomRoute
```javascript
app.onCustomRoute().add(() => {
	console.log("Custom route is hit with a request");
});
```
### onGetTableMeta
```javascript
app.onGetTableMeta().add(() => {
	console.log("Get 'tablemeta'");
});
```
### onCreateTable
```javascript
app.onCreateTable().add(() => {
	console.log("Table created");
});
```
### onUpdateTable
```javascript
app.onUpdateTable().add(() => {
	console.log("Table updated");
});
```
### onDropTable
```javascript
app.onDropTable().add(() => {
	console.log("Table dropped");
});
```
