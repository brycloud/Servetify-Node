/*
    Servetify v1.0 by Brydget Cloud Development Team
    https://github.com/brycloud/Servetify-Node
    Licensed under MIT LICENSE

    © 2023 Brydget, Inc.
    All Rights Reserved.
*/

import express from 'express'; // Importing the express module
import multer from 'multer';
import mysql2 from 'mysql2'; // Importing the mysql2 module
import queryInspector from './util/queryInspector.js'; // Importing a custom queryInspector module
import mssql from 'mssql'; // Importing the mssql module
import htmlEntities from 'html-entities'
import TimeDetector from './util/TimeDetector.js'
import RateLimit from 'express-rate-limit'
const memoryStorage = multer.memoryStorage()
const filesHandler = multer({storage:memoryStorage})

const llocated = {}; // Variable to store routes
/**
 * Servetify is a library for Node.js that provides a simple and easy way to handle HTTP requests.
 * @constructor
 * @param {number} PORT - The port number for the server
 * @return {Servetify} - Server Driver
 */
class Servetify {
    poolConnections = []; // Array to store database connection pools
    server = express(); // Express server instance

    constructor(PORT) {
        this.PORT = PORT;
        this.server.use(express.json());
        this.server.use(express.urlencoded({ extended: false }));
    }
    /**
     * Connects to a database that uses SQL Server
     * @throws {Error} - Throws an error if the database configuration is invalid
     * @param {Object} o - Database configuration object
     * @param {string} o.user - Database username
     * @param {string} o.password - Database password
     * @param {string} o.server - Database server
     * @param {string} o.database - Database name
     * @param {boolean} o.encrypt - Whether to encrypt the connection or not
     * @return {{query(sql: string): Promise<Object>, close(): void}} - Object with query and close functions to interact with the database
     * @see https://github.com/brycloud/Servetify-Node
     */
    async SqlServer(o) {
        if (Object.prototype.toString.call(o) !== '[object Object]') {
            throw new Error('Invalid database configuration');
        }
        const { user, password, server, database, encrypt } = o;
        const pool = await mssql.connect({
            user,
            password,
            server,
            options: {
                encrypt: encrypt || true
            },
            database
        });
        return {
            /**
             * This function queries the database
             * @param {string} sql - The raw query for the database
             * @param {any[]} params - The parameters to make a prepared request, this protects against SQL injection
             * @param {boolean} disableProtection - Disable the protection of the query parameter
             * @return {Promise<Object>} - A promise that resolves with the query result
             * @see https://github.com/brycloud/Servetify-Node
             */
            query(sql, params, disableProtection = false) {
                return new Promise((resolve, reject) => {
                    if (typeof sql !== "string") {
                        return resolve({
                            success: false,
                            details: "INVALID_ENTRIES",
                            message: "The query parameter must be a string"
                        });
                    }
                    const isValidQuery = queryInspector(sql);
                    if (!isValidQuery && !disableProtection) {
                        resolve({
                            success: false,
                            details: "DANGER_QUERY",
                            message: 'Potential malformed or malicious SQL query, to solve this error, call the function without "protection" parameter (3rd parameter)'
                        });
                    }
                    const req = new mssql.Request();
                    params.forEach((...p) => {
                        sql = sql.replace("?", "@" + p[1])
                        req.input(p[1].toString(), mssql.NVarChar, p[0]);
                    });
                    req.query(htmlEntities.encode(sql), function (err, res) {
                        if (err) {
                            reject(err);
                            return;
                        }
                        resolve({
                            success: true,
                            details: res,
                            message: 'Query was successful'
                        });
                    })
                });
            },

            /**
             * Closes the pool.
             *
             * @return {void}
             */
            close() {
                pool.close();
            }
        }
    }

    /**
     * Creates a MySQL connection pool and returns an object containing query and close functions to interact with the database.
     *
     * @param {Object} o - Database configuration object
     * @param {string} o.user - Database username
     * @param {string} o.password - Database password
     * @param {string} o.host - Database host
     * @param {number} [o.port=3306] - Database port (optional, defaults to 3306)
     * @param {string} o.database - Database name
     * @throws {Error} - Throws an error if the database configuration is invalid
     * @return {{query(sql: string): Promise<Object>, close(): void}} - Object with query and close functions to interact with the database
     * @see https://github.com/brycloud/Servetify-Node
     */
    MySQL(o) {
        if (Object.prototype.toString.call(o) !== '[object Object]') {
            throw new Error('Invalid database configuration');
        }
        const { user, password, host, port, database } = o;
        const pool = mysql2.createPool({
            user,
            password,
            host,
            port: port || 3306,
            database
        });
        return {
            /**
             * Executes a SQL query using the provided parameters and returns a Promise that resolves to an object with a success boolean, details, and message properties.
             *
             * @param {string} sql - The SQL query to execute.
             * @param {Array} params - An array of parameters to be used with the SQL query.
             * @param {boolean} [disableProtection=false] - An optional boolean flag to disable protection against malicious SQL queries.
             * @return {Promise} - A promise that resolves to an object with a success boolean, details, and message properties.
             */
            query(sql, params, disableProtection = false) {
                return new Promise((resolve, reject) => {
                    if (typeof sql !== "string") {
                        return resolve({
                            success: false,
                            details: "INVALID_ENTRIES",
                            message: "The query parameter must be a string"
                        });
                    }
                    const isValidQuery = queryInspector(sql);
                    if (!isValidQuery && !disableProtection) {
                        return resolve({
                            success: false,
                            details: "DANGER_QUERY",
                            message: 'Potential malformed or malicious SQL query, to solve this error, call the function without "protection" parameter (3rd parameter)'
                        });
                    }
                    pool.query(htmlEntities.encode(sql), params, function (err, result) {
                        if (err) {
                            reject(err);
                        } else {
                            resolve({
                                success: true,
                                details: result,
                                message: 'Query was successful'
                            });
                        }
                    });
                });
            },

            /**
             * Closes the pool used by the function.
             *
             * @return {void}
             */
            close() {
                pool.end();
            }
        }
    }

    /**
     * Starts the server and sets up middleware to handle image requests.
     *
     * Be careful: The received files at the request are saved in the machine's RAM memory, so it does not generate files on the disk.
     * However, it may be a problem for machines without sufficient RAM memory if you want to receive a lot of images or requests.
     * To get the request files, use the req.files property.
     * @return {Promise<void>} - A promise that resolves when the server is ready to listen for requests.
     */
    start() {
        return new Promise((resolve) => {
            for (const route in llocated) {
                if (Object.hasOwnProperty.call(llocated, route)) {
                    const el = llocated[route];
                    if (this.server[el.method]) {
                        this.server[el.method](el.uri, filesHandler.none(), async (req, res) => {
                            const resp = el.resolve(req);
                            if (resp instanceof Response) {
                                const text = await resp.text();
                                for (const headerKey in resp.headers) {
                                    if (Object.hasOwnProperty.call(resp.headers, headerKey)) {
                                        const headerValue = resp.headers[header];
                                        res.header(headerKey, headerValue);
                                    }
                                }
                                if (!resp.headers["Content-Type"]) {
                                    res.header("Content-Type", "text/plain");
                                }
                                res.status(resp.status || 200);
                                res.send(text);
                            }
                        });
                    }
                }
            }
            this.server.listen(this.PORT, resolve);
        });
    }
    /**
     * Receives a middleware function that will be invoked in all requests.
     * Note that the middleware function can be a Express.js middleware function. As Servetify uses Express.js to setup the server
     * @param {function} middlewareFunction - A function that will be used as middleware.
     * @throws {Error} If the middlewareFunction argument is not a function.
     * @return {void}
    */
    Middleware(middlewareFunction) {
        if (typeof middlewareFunction !== "function") {
            throw new Error('Invalid middleware, it must be a function');
        }
        this.server.use(function(req, res, next) {
            middlewareFunction(req, res);
            next();
        });
    }
    /**
     * Handle a given route.
     * The route must have the syntax of an HTTP Request
     * Example: "GET /api/users/:id"
     * @param {string} route - The route to handle.
     * @return {Function(Function(req: Request): Response): void} - The given function is the handler for the route.
     * The first parameter of it will be the request object.
     * The function must return a response.
     * @see https://github.com/brycloud/Servetify-Node
     */
    handle(route) {
        return (resolve => {
            if (!route) return resolve();
            if (typeof route !== 'string') return resolve();
            if (route.split(' ').length > 2 || route.split(' ').length < 1) return resolve();
            const [method, uri] = route.split(' ');
            llocated[route] = {
                uri,
                method: method.toLowerCase(),
                resolve,
            };
        });
    }
    /**
     * Constructor for a DoS object that sets up a rate limiter to prevent DoS attacks.
     *
     * @param {{Interval: String, Requests: Number, Deny: String}} o - Object containing Interval, Requests, and Deny properties.
     * @throws {Error} Invalid database configuration or invalid DoS configuration.
     * @returns {Servetify}
     */
    DoS(o) {
        if (Object.prototype.toString.call(o) !== '[object Object]') {
            throw new Error('Invalid database configuration');
        }
        const { Interval, Requests, Deny } = o;
        if (!Interval || !Requests || !Deny || typeof Interval !== "string" || typeof Requests !== "number" || typeof Deny !== "string" || TimeDetector(Interval) === 0) {
            throw new Error('Invalid DoS configuration');
        }
        this.server.use(RateLimit({
            windowMs: TimeDetector(Interval),
            max: Requests,
            message: Deny
        }));
        return this;
    }
};


/*
    Got any suggestions or problems?
    Feel free to open an issue on GitHub or create a pull request
    We will be really grateful for your feedback and on heearing your suggestions
    Thank you
*/

export default Servetify;
