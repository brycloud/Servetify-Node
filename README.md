![GitHub](https://img.shields.io/badge/Github-Servetify--Node-any?logo=https%3A%2F%2Fcdn-icons-png.flaticon.com%2F512%2F25%2F25231.png&logoColor=white&link=https%3A%2F%2Fgithub.com%2Fbrycloud%2FServetify-Node) ![NPM](https://img.shields.io/badge/npm-servetify%401.2.2-white?labelColor=orange&link=https%3A%2F%2Fwww.npmjs.com%2Fpackage%2Fservetify%3FactiveTab%3Dreadme)

## Table of contents

* [Introduction](#servetify-for-node.js)
    - [LICENSE]((.//LICENSE))
- [Quick Start (Web Server)](#quick-start-web-server)
    - [Install](#install)
    - [New handler](#new-handler)
    - [Sending status codes to the client](#sending-status-codes-to-the-client)
    - [CORS](#cors)
    - [Middlewares](#middlewares)
    - [Protecting routes](#protecting-routes)
    - [Application Security](#application-security)
    - [Serving static files](#serving-static-files)
    - [Blocking specific request methods](#blocking-specific-request-methods)
    - [Receiving POST Data, Cookies and files](#receiving-post-data-cookies-and-files)
    - [Setting cookies](#setting-cookies)
    - [async/await at handlers](#asyncawait-at-handlers)
- [Interact with a SQL Database](#interact-with-a-sql-database)
    - [Verification Steps](#verification-steps)
    - [Query Results](#query-results)
        - [Explanation of the errors](#explanation-of-the-errors)
    - [MySQL](#mysql)
        - [Example disabling SQL Injection Protection Algorithm](#example-disabling-sql-injection-protection-algorithm)
    - [SqlServer](#interacting-with-sql-server-databases)
    - [PostgreDB](#interacting-with-postgredb)
    - [Closing connections](#closing-connections)
- [SessionManager](#sessionmanager)
    - [Examples](#sessionmanager)
        - [MongoDB](#example-of-code-for-mongodb)
        - [Cache DB](#example-of-code-for-cache-database)
    - [Memory Session Manager](#in-memory-session-manager-v2)
- [Crypto](#crypto)
- [Changelog](./CHANGELOG.md)
- [Contributing](#contributing)


# Servetify for Node.js

Servetify is an open-source project licensed under [*MIT LICENSE*](.//LICENSE)
Feel free to open an issue on GitHub or create a pull request for suggestions or problems.

Servetify provides easy-to-use interfaces and developer-friendly functionalities to setup a web server, interact with databases like SQL Server and MySQL.
We're working on algorithms to prevent SQL Code Injection, for now, we've implemented an algorithm that partially prevents this. Follow the best practices with parametrized queries and preventing Cross-Site-Scripting. We use RegExp to validate XSS Attacks and common attacks like deleting data without authorization.

# Quick Start (Web Server)

### Install

To start using Servetify as a web server software, you may need to install it first

```bash
npm i servetify
```

or 

```bash
yarn add servetify
```

### New Handler

Once installed, you can start using Servetify. Here is an example code to an example web server

```js
// First, we import Servetify
import Servetify from "servetify";
// We create a handler for a new web server
// The constructor param will be the server port
const handler = new Servetify(2020, true, 1000);

// Handle a request at a route
handler.handle("GET /")(req => {
    // You can aaccess the request object through the "req" variable
    // Ex.: req.files
    return Servetify.Response("Hello world");
});

// Wait for the server to start listening
await handler.start();
// Server is listening
console.log("Example app succesfully listening at NET Port ::"+handler.PORT+" on your local network");
```

**NOTE:** Servetify is developed with ES6 Modules System, so Servetify is needed to import as a module

**Addition:** On Servetify 1.2.2, the brute force algorithm was modified, using a from-scratch code due to vulnerabilities found on an existing module. All servers will have a built-in brute force prevention algorithm. The clear inverval can be modified whenn a constructor is invoked.

Example:

```js
// First, we import Servetify
import Servetify from "servetify";
// We create a handler for a new web server
// The constructor param will be the server port
const handler = new Servetify(2020, true, 1000);
```

* The `true` param specifies that the storage used for registring requests may  be alocated at a RAM DB. When a request is received, the user is identified by its IP and when 200 requests from the same IP are received on the specified interval, the request will be denied.
* The `1000` param specifies the interval, when a request is denied, the denied IP will be still be denied for 1000ms (1s) on this case

In the example below, we deployed a web server at the port ::2020, then we configured the handler to listen GET requests at route `/`. Exactly here:

```js
handler.handle("GET /")
```

The `handle` method receives the route as a string, it may have the syntax of an HTTP Request, we defined the method and then the route: `GET /`, that means: listen to GET requests at route `/`.

The `handle` method returns a function, the function must be called to register the response for a specific route, the function will be executed every time the same route is fetched. Also the function needs to return a `Response` object, the `Response` object will be interpreted and will be served to the client.

### Sending status codes to the client

To send status code at the client request, the `Response` object may contain the `status` property.

Example:

```js
// First, we import Servetify
import Servetify from "servetify";
// We create a handler for a new web server
// The constructor param will be the server port
const handler = new Servetify(2020);

// Handle a request at a route
handler.handle("GET /")(req => {
    // You can aaccess the request object through the "req" variable
    // Ex.: req.files
    return Servetify.Response("Hello world", {
        status:200
    });
    // Sendin status 200 "OK"
});

// Wait for the server to start listening
await handler.start();
// Server is listening
console.log("Example app succesfully listening at NET Port ::"+handler.PORT+" on your local network");
```

### CORS

On Servetify 1.2.2, the method `CORS` was added to allow CORS requests. You can use the built-in `CORS` method instead of using middelwares

Examples:

```js
// First, we import Servetify
import Servetify from "servetify";
// We create a handler for a new web server
// The constructor param will be the server port
const handler = new Servetify(2020);
handler.CORS([
    "mydomain.com",
    "myanotherdomain.com"
]);
handler.CORS("*");

// Handle a request at a route
handler.handle("GET /")(req => {
    // You can aaccess the request object through the "req" variable
    // Ex.: req.files
    return Servetify.Response("Hello world", {
        status:200
    });
    // Sendin status 200 "OK"
});

// Wait for the server to start listening
await handler.start();
// Server is listening
console.log("Example app succesfully listening at NET Port ::"+handler.PORT+" on your local network");
```

### Middlewares

**NOTE:** Servetify uses [Express.js](https://expressjs.com/) to setup your server, so you can take advantage of all functionalities offered by Express.js. You may want to check their [Documentation](https://expressjs.com/en/starter/installing.html) to know all of the functionalities that you can take advantage of.

If you want to access the base server, you can use the `server` property of any `Servetify` instance.

*Example:*

```js
const Handler = new Servetify(2020);
// Access to base server
const baseServer = Handler.server;
// Custom funcion for any request
baseServer.use(function(req, res, next) {
    // ...
    // Continue to the next function or serve the request
    next();
});
```

The difference between using Express.js and Servetify is the focus on the security and integrity of your applications. Servetify uses secure algorithms to protect your applications against DoS Attacks, XSS Attacks and SQL Injection Attacks.

As Servetify uses Express.js as base server configuration, you can access to all functionalitie, like query params proccessing

Ex.: This code is based in Express.js and uses its functionalities working with Servetify

```js
// First, we import Servetify
import Servetify from "servetify";
// We create a handler for a new web server
// The constructor param will be the server port
const handler = new Servetify(2020);

// Handle a request at a route
handler.handle("GET /")(req => {
    // You can aaccess the request object through the "req" variable
    // Ex.: req.files
    // Here you can extract the query params 
    const {name, age} = req.query;
    // Check if params are not listed
    if (!age || !name) {
        // Some of the params are not listed, you can manage the error here
        return Servetify.Response("Hey! You did not provided the query parameters, please check the URL and try again.");
    }
    return Servetify.Response("Hello, "+name+", are you "+age+"?");
    // Example resut: Hello, John Doe, are you 21?
});

// Wait for the server to start listening
await handler.start();
// Server is listening
console.log("Example app succesfully listening at NET Port ::"+handler.PORT+" on your local network");
```

You can also use middlewares designed Express.js with Servetify, this is useful to do many tasks. To do this, you can access the base server or use the `Middleware()` method provided by Servetify or just use the base server.

Examples of code:

```js
const Handler = new Servetify(2020);
// Access to base server
const baseServer = Handler.server;
// Custom funcion for any request
baseServer.use(function(req, res, next) {
    // Here you can design your own middleware or use an existing one.
    // Continue to the next function or serve the request
    next();
});
```

Or you can use the `Middleware()` method provided by Servetify. Example below

```js
const Handler = new Servetify(2020);
// Access to base server
const baseServer = Handler.server;
// Custom funcion for any request
baseServer.Middleware(function(req, res) {
    // Here you can design your own middleware or use an existing one.
    // Continue to the next function or serve the request
    // next() is called automatically, you don't need to call it manually
});
```

**NOTE:** Servetify has self-implemented DoS Attacks and brute force attacks mitigators, however is important to note that these algorithims can fail in massive attacks, for a complete security structure, you can use Servetify integrated security system combinated with a security system provided by cloud companies like [CloudFlare](https://cloudflare.com/)

### Protecting routes

The method `ProtectedResource()` was added on v1.2.2, its functionality is to not serve content without an specific key sent by the client at the request headers. Example of use:

```js
// First, we import Servetify
import Servetify from "../index.js";
// Creating a new handler
const handler = new Servetify(2020, true, 1000);

// Receive any request at any route
handler.ProtectedResource("ALL *", "HelloWorld", "Brydget-API-Key", true)(async req => {
    return await (() => {
        // Send the response
        return  Servetify.Response("Hello world");
    })();
});

// Wait for the server to start listening
await handler.start();
// Server is listening
console.log("Example app succesfully listening at NET Port ::"+handler.PORT+" on your local network");
```

On the example below:

* `ALL *` is the route, it works the same as the `handle()` method
* `"HelloWorld"` is the key that unlocks the access to this route, we highly recommend to save the key on an environment variable.
* `"Brydget-Api-Key"` is the header to check that might have the key to unlock

> If the validation process is failed, the response will be a 401 HTTP Status Code, and `Unauthorized` response body.

### Application Security

You can sete the rate limit for your application, this prevents partially DoS Attacks, however take care of the above recomendation
Example of code:

```js
// First, we import Servetify
import Servetify from "servetify";
const handler = new Servetify(2020);

// Handle a request at a route
// ...

// Setup DoS Protection
handler.DoS({
    Interval: "1h", // Max requests in 1h
    Requests: 125, // 125 Max Requests in 1h
    Deny: "You've reached our request limit per hour."
});
// That's it!

// Wait for the server to start listening
await handler.start();
// Server is listening
console.log("Example app succesfully listening at NET Port ::"+handler.PORT+" on your local network");
```

### Serving static files

This functionality is based on [`express.static()`](https://expressjs.com/en/starter/static-files.html) method, and allows you to serve static conntent on your server. You might want to check their documenntation to know how this works.

Example of code:

```js
// First, we import Servetify
import Servetify from "servetify";
const handler = new Servetify(2020);

// ...
handler.static("my_dir");
// ...
```

### Blocking specific request methods

This functionality allows you to block specific HTTP request methods. This allows to prevent unwanted changes at your applications. Is as easy as using the `.block()` method.

Example of code:

```js
// First, we import Servetify
import Servetify from "servetify";
const handler = new Servetify(2020);

// ...
handler.block("PUT");
handler.block("DELETE");
// ...
```

**NOTE:** This creates a middleware for this specific methods at your server, do not create handlers for this methods, because this may generate contradictions and errors.

**Addition:** You can also block two methods calling the same methos, specifying the parameter as an array.

Example:

```js
// First, we import Servetify
import Servetify from "servetify";
const handler = new Servetify(2020);

// ...
handler.block(["PUT", "DELETE"]);
// ...
```

### Receiving POST Data, Cookies and files

Servetify is configured to receive POST data without adding more lines to your code, you may only need to use `req.body`. Also, you can access to the cookies sent from the client with the `req.cookies` property. Finally, you can access too to the files sennt from the client with `req.files`.

**NOTE:** The files sent from the client are stored in computer RAM memory, leak of memory is a common issue, we recommend to use a cloud hosting provider for large-scale applications

Example of code:

```js
const handler = new Servetify(2020);

// Handle a request at a route
// ...

// Receive a GET request
handler.handle("GET /")(function(req) {
    const cookies = req.cookies;
    const postBody = req.body;
    const files = req.files;

    // Do whatever here with the received data
    // Send a response
})
// That's it!

// Wait for the server to start listening
await handler.start();
// Server is listening
console.log("Example app succesfully listening at NET Port ::"+handler.PORT+" on your local network");
```

### Setting cookies

To save cookies, Servetify offers the `req.SetClientCookie` function to save cookies at the client browser. You can also specify the cookies at the `Response` object. Both methofds do the same, developers may choose the functionality that is more legible for their needs.

**Definition of the function**

```ts
function SetClientCookie(key: string, value: string, ttl: number) : void
```

Examples:

```js
// First, we import Servetify
import Servetify from "../index.js";
// Creating a new handler
const handler = new Servetify(2020);

// Receive any request at any route
handler.handle("ALL *")(req => {
    // You can aaccess the request object through the "req" variable
    // Saves a new cookie
    req.SetClientCookie("a cookie", "a value");
    return Servetify.Response("Hello world");
});
```

You can also specify the cookies at the response, but you may need to use the `Servetify.Response` method to generate a compatible response object. With a traditional `Response` object, the cookies may not be proccessed.

```js
// First, we import Servetify
import Servetify from "../index.js";
// Creating a new handler
const handler = new Servetify(2020);

// Receive any request at any route
handler.handle("ALL *")(req => {
    // You can aaccess the request object through the "req" variable
    // Saves a new cookie
    return Servetify.Response("Hello world", {
        cookies:{
            "a cookie":"a value"
        }
    });
});
```

### async/await at handlers

On Servetify 1.1.2, support for `async/await` was added on route handlers, this is udeful for making HTTP Requests, performing asynchronous tasks and more.

Examples:

```js
// First, we import Servetify
import Servetify from "../index.js";
// Creating a new handler
const handler = new Servetify(2020);

// Receive any request at any route
handler.handle("ALL *")(async req => {
    // Await for a response
    return await (() => {
        // Send the response
        return  Servetify.Response("Hello world");
    })();
});

// Wait for the server to start listening
await handler.start();
// Server is listening
console.log("Example app succesfully listening at NET Port ::"+handler.PORT+" on your local network");
```
Or more legible:

```js
// First, we import Servetify
import Servetify from "../index.js";
// Creating a new handler
const handler = new Servetify(2020);

// Receive any request at any route
handler.handle("ALL *")(async req => {
    // Await for a response
    const ApiResponse = await MakeARequestToMyAPI("...");
    return Servetify.Response(ApiResponse);
});

// Wait for the server to start listening
await handler.start();
// Server is listening
console.log("Example app succesfully listening at NET Port ::"+handler.PORT+" on your local network");
```


## Interact with a SQL Database

Servetify applications can interact with MySQL and SQL Server Databases, to do this, the library provides the `SqlServer` and `MySQL` methods, that are used to interact with databases. We're working to interact too with PostgreSQL and MongoDB the easy way.

### Verification Steps

We use three security layers to interact with your databases securely. Summary:

1. **The server tries to send the query to the database**

    Once the connection is stablished to the database, the server can make queries to it. But, the query string needs to pass our security check to prevent malicious queries and SQL Injection. However, if you're not working on a real application, this security step can be disabled to prioritize the speed of the query.

2. **Servetify analyzes the query**

    Servetify needs to analyze the query before sending it to the database, the query is analyzed with RegExp to match potential malicious code. If found, the function will not send the query and return a warning or error.

3. **XSS Protection**

    Servetify search for `<script>` tags on the query, if found, the function will not query to the database and will return an error or warning.

4. **Character Encoding**

    After passing all other checks, Servetify encodes the string with a trusted module of HTML character escaping. Is important to note that this check by itself is not totally secure, Servetify has implemented all other security checks to ensure malicious code injection

**BONUS ON SECURITY FOCUS:** Servetify uses prepared queries, and does not concat values, this is a good practice to prevent SQL Code injection. However, the query usage will be shown below, if you don't use the query parameters to prepared queries, this security integration will not be useful.

### MySQL

To connect a MySQL Database, you can use the `MySQL` methohd, it may receive an object containing the connect information like user, password, host and port.

```js
// First, we import Servetify
import Servetify from "servetify";

/// ...
// We create a handler for Servetify
const Handler = new Servetify(2020);
// You can setup your server here
// ...
// Setup connection to the database
const Database = Handler.MySQL({
    user:"root",
    password:"",
    // If you dont specify the port, the connection will be redirected to port 3306 (Default MySQL Port)
    // port: 3306,
    host:"localhost",
    database:"my_database",
    // The "database" parameter is not required, but you may need to check your hosting provider limitations to not violate their terms and conditions
});

// The Database constant is an object that contains the connection and two methods: query() aad close()
const query = await Database.query("SELECT * FROM my_table WHERE condition = ?", ["my_value"]);
if (!query.success) {
    // Validation failed or malicious SQL Code detected, manage the error
    throw new Error("Validation failed")
}
console.log(query.details); // Get the query result
```

### Query Results

This example uses a parameterized query to separate the values with the query, that prevents malicious SQL code injection.
The result of the query may change in different scenarios, here's the examples of what values can return the function

| Key | Type | Value | Description
| --------- | --------------------- | ---------------- | -----------
| `success` | `boolean` | `false` or `true`| Determines if the query was successful
| `details` | `Object` or `string` | `"INVALID_ENTRIES"`, `"DANGER_QUERY"`, or `Object` | Indicates the query deny reason or the query results
| `message` | `string` | `Potential malformed or malicious SQL query, to solve this error, call the function without "protection" parameter (3rd parameter)`, `The query parameter must be a string`, `Query was successful` | Provides a more detailed description about the query deny reason, or the query if was successful.

### Explanation of the errors

* `"INVALID_ENTRIES"`: `The query parameter must be a string`, This error appears when the query provided to the function is not a string, the query is required  to be a string in all cases.

* `"DANGER_QUERY"` : `Potential malformed or malicious SQL query, to solve this error, call the function without "protection" parameter (3rd parameter)`, This error appears when the Servetify algorithm detects malicious code at the query string, to ensure your application integrity, Servetify denies the query. Is important to note that you can disable this protection step, but we don't recommend to do this, because your website may be vulnerable to attacks.

### Example disabling SQL Injection Protection Algorithm

The only thing you need to do is set `true` as third parameter when you call the function `query`

```js
// First, we import Servetify
import Servetify from "servetify";

/// ...
// We create a handler for Servetify
const Handler = new Servetify(2020);
// You can setup your server here
// ...
// Setup connection to the database
const Database = Handler.MySQL({
    user:"root",
    password:"",
    // If you dont specify the port, the connection will be redirected to port 3306 (Default MySQL Port)
    // port: 3306,
    host:"localhost",
    database:"my_database",
    // The "database" parameter is not required, but you may need to check your hosting provider limitations to not violate their terms and conditions
});

// The Database constant is an object that contains the connection and two methods: query() aad close()
const query = await Database.query("SELECT * FROM my_table WHERE condition = ?", ["my_value"], true);
// With the "true" param, the protection will be disabled.
if (!query.success) {
    // Query malformed or invalid synntax
    throw new Error("Validation failed")
}
console.log(query.details); // Get the query result
```

**NOTE:** Is important to note that doing queries this way must be potentially insecure and you can be vulnerable to XSS Attacks and malicious SQL queries

### Interacting with SQL Server Databases

To interact with SQL Server databases, the proccess of doing queries is the same, Servetify ensures the same security algorithm for SQL Server connections, the proccess of doing queries is totally the same, but the connection proccess variates.
As SQL Server does not use the same authentication methods as MySQL and requires a connection string, the proccess is the different, however Servetify has made the proccess most similar possible as MySQL Connections.

Example of code:
```js
// First, we import Servetify
import Servetify from "servetify";

/// ...
// We create a handler for Servetify
const Handler = new Servetify(2020);
// You can setup your server here
// ...
// Setup connection to the database
const Database = Handler.SqlServer({
    user:"root",
    password:"",
    // Here, we don't need to specify a port, it is set automatically
    host:"localhost",
    // "encrypt" is a new propery, it ensures that the connection to the database is encrypted with the SQL Server algorithm
    encrypt:true,
    database:"my_database",
    // The "database" parameter is required, but you may need to check your hosting provider limitations to not violate their terms and conditions
});

// The Database constant is an object that contains the connection and two methods: query() aad close()
const query = await Database.query("SELECT * FROM my_table WHERE condition = ?", ["my_value"]);
// With the "true" param, the protection will be disabled.
if (!query.success) {
    // Validation failed or malicious SQL Code detected, manage the error
    throw new Error("Validation failed")
}
console.log(query.details); // Get the query result
```

### Interacting with PostgreDB

To interact with PostgreDB databases, the proccess of doing queries is the same, Servetify ensures the same security algorithm for SQL Server connections, the proccess of doing queries is totally the same, but the connection proccess variates.
As SQL Server does not use the same authentication methods as MySQL and requires a connection string, the proccess is the different, however Servetify has made the proccess most similar possible as MySQL Connections.

Example of code:
```js
// First, we import Servetify
import Servetify from "servetify";

/// ...
// We create a handler for Servetify
const Handler = new Servetify(2020);
// You can setup your server here
// ...
// Setup connection to the database
const Database = Handler.PostgreSQL({
    user:"root",
    password:"",
    // If you dont specify the port, the connection will be redirected to port 5432 (Default PGSQL Port)
    // port: 5432,
    host:"localhost",
    database:"my_database",
    // The "database" parameter is not required, but you may need to check your hosting provider limitations to not violate their terms and conditions
});

// The Database constant is an object that contains the connection and two methods: query() aad close()
const query = await Database.query("SELECT * FROM my_table WHERE condition = ?", ["my_value"]);
// With the "true" param, the protection will be disabled.
if (!query.success) {
    // Validation failed or malicious SQL Code detected, manage the error
    throw new Error("Validation failed")
}
console.log(query.details); // Get the query result
```

_The functionality is the at all SQL Database Providers, you can disable the maicious SQL Detector with the 3rd parameter._

### Closing connections

Is important to close the connection to the database after you have finished using the database, this is a good practice to prevent server overloading and excesive loading times. Its simpler as a line of code

```js
Database.close();
```

With this line of code, the connection will be closed and the server will stop using SQL and will disconnect from the SQL Database

## SessionManager

SessionManager is a secure session storage for your web applications based in NoSQL Databases to ensure scalability on your applications. The way we perform this is identifying the user and its session by its IP address.

SessionManager works with MongoDB and a built-in database stored at the machine memory. However, is important to note that every database works different ways, **a built-in database in memory can cause memory leaks, because data is stored at computer or VM RAM memory. In this cases, if the stored data objects are too big, the server can even get down or crash.** However, **memory databases are known because of their efficience and speed at data recovering**.
Finally, if you would rather to use MongoDB, its a good option too. **MongoDB is a NoSQL Database known because of its speed and scalability**, however is **important to configure your production environment properly to prevent server crashes**

*The decision of using any of these databases for SessionManager depends on your system limitations, we highly recommend to analyze carefully your requieremnts and system resources to prevent errors*

SessionManager uses cryptography to hash securely sessions information, so you will need to provide a secret key to hash information given to the server.
**NOTE:** The secret key must be of 32 bytes long, if it is longer or shorter, the system will automatically fill or short the key.

> Support for SQLite3 was removed on v1.2.2 due to package outage and vulnerabilities found on the paackage that manages SQLite3 for Node.js.

### Example of code for MongoDB

```js
// First, we import Servetify
import Servetify from "servetify";

/// ...
// We create a handler for Servetify
const Handler = new Servetify(2020);
// Setup connection to the database
const SessionManager = Handler.Authenticator({
    // The property is not lower-upper sensitive.
    connectionType:"MongoDB",
    // Connection details for MongoDB
    connection:{
        // Connection URL
        uri:"mongodb://...",
        // Be careful: this database needs to be created first
        database:"my_database"
    },
    // The configuration for the sessions
    sessionConfig:{
        // Allows to limit only one session per IP
        onlyOne:true,
        // Time before the session expires (in seconds)
        ttl:1000
        // In this case, the session will expire after 1000 seconds
    }
    // Considerations: this code generates a collection named "sessions" at your database.
}, "my_secret_key");
// Here "my_secret_key" is going to be the key used to hash values
// You can setup your server here
// ...
Handler.handle("GET /", async function(req) {
    // Get the session
    const session = await SessionManager.Fetch(req.ip);
    // When you generate a session, an unique ID is assigned to the session
    // Sessions can be found by the user IP
    /*
        Return value example:
        {
            success:true,
            data: null,
            error: "No session found.",
        }
        {
            success:true,
            data: {
                "key1":"value1"
            },
            error: null,
        }
    */
    if (!session.data) {
        await SessionManager.New({
            "userId":1234,
        }, req.ip);
        /*
            Return structure:
            {
                id: "...",
                success:true,
                error:null
            }

            or

            {
                id: "...",
                success:false,
                error: "This IP owns a session already.",
            }
        */
        return Servetify.Response("You don't have an open session. We've generated one for you")
    }
    // ...
})
```

### Example of code for Cache Database

```js
// First, we import Servetify
import Servetify from "servetify";

/// ...
// We create a handler for Servetify
const Handler = new Servetify(2020);
// Setup connection to the database
const SessionManager = Handler.Authenticator({
    // The property is not lower-upper sensitive.
    connectionType:"Memory",
    // No connection credentials required
    connection:{},
    // The configuration for the sessions
    sessionConfig:{
        // Allows to limit only one session per IP
        onlyOne:true,
        // Time before the session expires (in seconds)
        ttl:1000
        // In this case, the session will expire after 1000 seconds
    }
}, "my_secret_key");
// Here "my_secret_key" is going to be the key used to hash values
// You can setup your server here
// ...
Handler.handle("GET /", async function(req) {
    // Get the session
    const session = await SessionManager.Fetch(req.ip);
    // When you generate a session, an unique ID is assigned to the session
    // Sessions can be found by the user IP
    /*
        Return value example:
        {
            success:true,
            data: null,
            error: "No session found.",
        }
        {
            success:true,
            data: {
                "key1":"value1"
            },
            error: null,
        }
    */
    if (!session.data) {
        await SessionManager.New({
            "userId":1234,
        }, req.ip);
        /*
            Return structure:
            {
                id: "...",
                success:true,
                error:null
            }

            or

            {
                id: "...",
                success:false,
                error: "This IP owns a session already.",
            }
        */
        return Servetify.Response("You don't have an open session. We've generated one for you")
    }
    // ...
})
```

## In-Memory Session Manager v2

This functionality uses an UUID and an in-memory storage to store the sessions, but the UUID generated for the Session ID  needs to be saved as a cookie at the client.

Example:

```js
// First, we import Servetify
import Servetify from "../index.js";
// Creating a new handler
const handler = new Servetify(2020);
// Create a new session manager
const SessionsHandler = await handler.InMemorySessionManager({ttl:150});

// Receive any request at any route
handler.handle("ALL *")(req => {
    // You can aaccess the request object through the "req" variable
    // Fetch a session
    const session = SessionsHandler.Fetch(req.cookies.session);
    const { userId } = session; // 123 | undefined (When TTL expires)
    if (!userId) {
        // Generate a new session and save it to the client
        req.SetClientCookie("session", SessionsHandler.New({
            userId:123
        }));
    }
    // Fetch here the information from your DB
    console.log(userId); // 123
    return Servetify.Response("Hello world");
});

// Wait for the server to start listening
await handler.start();
// Server is listening
console.log("Example app succesfully listening at NET Port ::"+handler.PORT+" on your local network");
```

The method `SessionHandler.New()` returns a string that is an UUID. The UUID works as a Session ID, then the code saves the Session ID as a cookie at the Client Browser.

When the function `handler.InMemorySessionManager()` is called, the `ttl` propery specifies the time (in seconds) to live before the session is destroyed. In the example above, when a new session is registered, it will be destroyed after 150 seconds.

## Crypto

Crypto is an easy form to encrypt and decrypt strings using Node.js and Servetify. It uses the `crypto` module that is a module integrated with Node.js and is highly trusted.

**NOTE:** The secret key must be of 32 bytes long, if it is longer or shorter, the system will automatically fill or short the key.

Example of code:

```js
// First, we import Servetify
import Servetify from "servetify";
// ...
const Handler = new Servetify(2020);
/// Define secret key
const myKey = "my_secret_key";
// Create a new crypto handler
const CryptoHandler = Handler.Crypto(myKey);
// Encode your first string
const encodedString = CryptoHandler.hash("Hello world");
const decodedString = CryptoHandler.decrypt(encodedString);

console.log(encodedString, decodedString);
// The algorithm generates a different string any time is called.
```


## Contributing

We love to hear your ideas!
Feel free to open an issue or create a pull request at GitHub or NPM
We will be really grateful for your feedback and on heearing your suggestions
Thank you.