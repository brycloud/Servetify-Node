<a href="https://github.com/brycloud/Servetify-Node"><img src="https://raw.githubusercontent.com/brycloud/Servetify-Node/master/GitHubUrl.png" style="height:70;width:auto;"></a>

# Servetify for Node.js

Servetify is an open-source project licensed under [*MIT LICENSE*](.//LICENSE)
Feel free to open an issue on GitHub or create a pull request for suggestions or problems.

Servetify provides easy-to-use interfaces and developer-friendly functionalities to setup a web server, interact with databases like SQL Server and MySQL.
We're working on algorithms to prevent SQL Code Injection, for now, we've implemented an algorithm that partially prevents this. Follow the best practices with parametrized queries and preventing Cross-Site-Scripting. We use RegExp to validate XSS Attacks and common attacks like deleting data without authorization.

# Quick-Start (Web Server)

1. To start using Servetify as a web server software, you may need to install it first

```bash
npm i servetify
```

or 

```bash
yarn add servetify
```

2. Once installed, you can start using Servetify. Here is an example code to an example web server

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
    return new Response("Hello world");
});

// Wait for the server to start listening
await handler.start();
// Server is listening
console.log("Example app succesfully listening at NET Port ::"+handler.PORT+" on your local network");
```

**NOTE:** Servetify is developed with ES6 Modules System, so Servetify is needed to import as a module

In the example below, we deployed a web server at the port ::2020, then we configured the handler to listen GET requests at route `/`. Exactly here:

```js
handler.handle("GET /")
```

The `handle` method receives the route as a string, it may have the syntax of an HTTP Request, we defined the method and then the route: `GET /`, that means: listen to GET requests at route `/`.

The `handle` method returns a function, the function must be called to register the response for an specific route, the function will be executed every time the same route is fetched. Also, the function needs to return a `Response` object, the `Response` object will be interpreted and will be served to the client.

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
        return new Response("Hey! You did not provided the query parameters, please check the URL and try again.");
    }
    return new Response("Hello, "+name+", are you "+age+"?");
    // Example resut: Hello, John Doe, are you 21?
});

// Wait for the server to start listening
await handler.start();
// Server is listening
console.log("Example app succesfully listening at NET Port ::"+handler.PORT+" on your local network");
```

You can also use middlewares designed Express.js with Servetify, this is useful to do many tasks. To do this, you can access the base server or use the `Middleware()` method provided by Servetify.

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

**Application Security**

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

**NEW: Serving static files**

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

**NEW: Blocking specific request methods**

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

**Receiving POST Data, Cookies and files**

Servetify is configured to receive POST data without adding more lines to your code, you may only need to use `req.body`. Also, you can access to the cookies sent from the client with the `req.cookies` property. Finally, you can access too to the files sennt from the client with `req.files`.

**NOTE:** The files sent from the client are stored in computer RAM memory, leak of memory is a common issue, we recommend to use a cloud hosting provider for large-scale applications

Example of code:

```js
const handler = new Servetify(2020);

// Handle a request at a route
// ...

// Setup DoS Protection
handler.handle("GET /", function(req) {
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


## Interact with a SQL Database

Servetify applications can interact with MySQL and SQL Server Databases, to do this, the library provides the `SqlServer` and `MySQL` methods, that are used to interact with databases. We're working to interact too with PostgreSQL and MongoDB the easy way.

We use three security layers to interact with your databases securely. Summary:

1. **The server tries to send the query to the database**

    Once the connection is stablished to the database, the server can make queries to it. But, the query string needs to pass our security check to prevent malicious queries and SQL Injection. However, if you're not working on a real application, this security step can be disabled to prioritize the speed of the query.

2. **Servetify analyzes the query**

    Servetify needs to analyze the query before sending it to the database, the query is analyzed with RegExp to match potential malicious code. If found, the function will not send the query and return a warning or error.

3. **XSS Protection**

    Servetify search for `<script>` tags on the query, if found, the function will not query to the database and will return an error or warning.

4. **Characte Encoding**

    After passing all other checks, Servetify encodes the string with a trusted module of HTML character escaping. Is important to note that this check by itself is not totally secure, Servetify has implemented all other security checks to ensure malicious code injection

**BONUS ON SECURITY FOCUS:** Servetify uses prepared queries, and does not concat values, this is a good practice to prevent SQL Code injection. However, the query usage will be shown below, if you don't use the query parameters to prepared queries, this security integration will not be useful.

**Code Examples**

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

This example uses a parameterized query to separate the values with the query, that prevents malicious SQL code injection.
The result of the query may change in different scenarios, here's the examples of what values can return the function

| Key | Type | Value | Description
| --------- | --------------------- | ---------------- | -----------
| `success` | `boolean` | `false` or `true`| Determines if the query was successful
| `details` | `Object` or `string` | `"INVALID_ENTRIES"`, `"DANGER_QUERY"`, or `Object` | Indicates the query deny reason or the query results
| `message` | `string` | `Potential malformed or malicious SQL query, to solve this error, call the function without "protection" parameter (3rd parameter)`, `The query parameter must be a string`, `Query was successful` | Provides a more detailed description about the query deny reason, or the query if was successful.

**Explanation of the errors**

* `"INVALID_ENTRIES"`: `The query parameter must be a string`, This error appears when the query provided to the function is not a string, the query is required  to be a string in all cases.

* `"DANGER_QUERY"` : `Potential malformed or malicious SQL query, to solve this error, call the function without "protection" parameter (3rd parameter)`, This error appears when the Servetify algorithm detects malicious code at the query string, to ensure your application integrity, Servetify denies the query. Is important to note that you can disable this protection step, but we don't recommend to do this, because your website may be vulnerable to attacks.

**Example disabling SQL Injection Protection Algorithm**

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

**Interacting with SQL Server Databases**

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

**Interacting with PostgreSQL Databases**

To interact with PostgreSQL databases, the proccess of doing queries is the same, Servetify ensures the same security algorithm for SQL Server connections, the proccess of doing queries is totally the same, but the connection proccess variates.
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

**Closing connections**

Is important to close the connection to the database after you have finished using the database, this is a good practice to prevent server overloading and excesive loading times. Its simpler as a line of code

```js
Database.close();
```

With this line of code, the connection will be closed and the server will stop using SQL and will disconnect from the SQL Database

## New: SessionManager

SessionManager is a secure session storage for your web applications based in NoSQL Databases to ensure scalability on your applications. The way we perform this is identifying the user and its session by its IP address.

SessionManager works with SQLite3, MongoDB and a built-in database stored at the machine memory. However, is important to note that every database works different ways, **a built-in database in memory can cause memory leaks, because data is stored at computer or VM RAM memory. In this cases, if the stored data objects are too big, the server can even get down or crash.** However, **memory databases are known because of their efficience and speed at data recovering**. 
If you prefer to use SQLite3 is a good initiative, **SQLite3 is known because of its speed and its lower file weight on .db files, however on massive data objects, the .db file may be too big and can cause a resource missing issue.**
Finally, if you would rather to use MongoDB, its a good option too. **MongoDB is a NoSQL Database known because of its speed and scalability**, however is **important to configure your production environment properly to prevent server crashes**

*The decision of using any of these databases for SessionManager depends on your system limitations, we highly recommend to analyze carefully your requieremnts and system resources to prevent errors*

SessionManager uses cryptography to hash securely sessions information, so you will need to provide a secret key to hash information given to the server.
**NOTE:** The secret key must be of 32 bytes long, if it is longer or shorter, the system will automatically fill or short the key.

**1. Example of code for MongoDB:**

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
        return new Response("You don't have an open session. We've generated one for you")
    }
    // ...
})
```

**2. Example of code for SQLite3:**

```js
// First, we import Servetify
import Servetify from "servetify";

/// ...
// We create a handler for Servetify
const Handler = new Servetify(2020);
// Setup connection to the database
const SessionManager = Handler.Authenticator({
    // The property is not lower-upper sensitive.
    connectionType:"SQLite",
    // Connection details for SQLite
    connection:{
        // If the string does not includes the ".db" extension at the end, it will be added automatically
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
        return new Response("You don't have an open session. We've generated one for you")
    }
    // ...
})
```

**2. Example of code for Cache Database:**

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
        return new Response("You don't have an open session. We've generated one for you")
    }
    // ...
})
```

## New: Crypto

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
const encodedStringn = CryptoHandler.hash("Hello world");
const decodedStringn = CryptoHandler.decrypt(encodedStringn);

console.log(encodedStringn, decodedStringn);
// The algorithm generates a different string any time is called.
```


## Contributing

We love to hear your ideas!
Feel free to open an issue or create a pull request at GitHub or NPM
We will be really grateful for your feedback and on heearing your suggestions
Thank you.