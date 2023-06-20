/*
    Servetify v1.1 by Brydget Cloud Development Team
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
import cookieParser from 'cookie-parser'
import CryptoAlg from './util/Crypto.js'
import mongodb from 'mongodb'
import sqlite3 from 'sqlite3'
import crypto from 'crypto'
import NodeCache from 'node-cache'
import PostgreDb from 'pg'
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
        this.server.use(cookieParser());
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
     * Creates a new PostgreDB object that can be used to query a PostgreSQL database.
     * @param {Object} o - An object containing the configuration for the database connection.
     * @param {string} o.user - The username to use when connecting to the database.
     * @param {string} o.password - The password to use when connecting to the database.
     * @param {string} o.host - The hostname of the machine running the database.
     * @param {number} [o.port=5432] - The port number to use when connecting to the database.
     * @param {string} o.database - The name of the database to connect to.
     * @throws {Error} If the configuration object is not an object.
     * @return {Object} An object with two methods: "query" and "close".
     */
    PostgreSQL(o) {
        if (Object.prototype.toString.call(o) !== '[object Object]') {
            throw new Error('Invalid database configuration');
        }
        const { user, password, host, port, database } = o;
        const pool = new PostgreDb.Pool({
            user,
            password,
            host,
            port: port || 5432,
            database
        });
        return {
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
                                details: result.rows,
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
     * Creates a Crypto object that allows for string encryption and decryption using a given key.
     * @param {string} key - the encryption key
     * @return {object} an object with two methods: hash(str) and decrypt(str)
    */
    Crypto(key) {
        return {
            /**
             * Hashes a string using CryptoAlg.encrypt.
             * @param {string} str - The string to be hashed.
             * @return {string} The hashed string.
            */
            hash(str) {
                return CryptoAlg.encrypt(str, key);
            },
            /**
             * Decrypts a string using a given key.
             *
             * @param {string} str - the string to be decrypted
             * @return {string} the decrypted string
            */
            decrypt(str) {
                return CryptoAlg.decrypt(str, key);
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
                        this.server[el.method](el.uri, filesHandler.any(), async (req, res) => {
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
            middlewareFunction(req, res, function(){});
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
     * Adds a static file directory to the Express server.
     * @param {string} path - The path of the directory to serve static files from.
     * @return {object} Returns the instance of the Express server.
    */
    static(path) {
        this.server.use(express.static(path));
        return this;
    }
    block(method) {
        if (typeof method !== "string") {
            throw new Error('Invalid block configuration');
        }
        this.server.use(function(req, res, next) {
            if (req.method.toUpperCase() === method.toUpperCase()) {
                res.status(405).end();
            }
            next();
        });
        return this;
    }
    /**
     * Constructor for a DoS object that sets up a rate limiter to prevent DoS attacks.
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
    /**
     * Creates a new instance of MemoryStorage.
     * Data is stored in RAM memory.
     * Be careful beacause of memory leaks.
     * @return {Promise<NodeCache>} A Promise that resolves with a new instance of NodeCache.
     */
    async MemoryStorage() {
        const client = new NodeCache();
        return client;
    }
    /**
     * Authenticator is a function written totally by Brydget
     * Its functionallity is to securely save users sessions.
     * Session IDs are generated by a public hash and can be resolved with the user IP
     * @param {Object} o - Object containing database configuration parameters.
     * @param {string} o.connectionType - String representing the type of database connection to be made. Valid values are "mongodb", "sqlite" and "memory".
     * @param {Object} o.connection - Object containing the connection parameters for the respective database type.
     * @param {string} ip - The user IP saved to the database or used to register a new session.
     * @param {Object} o.sessionConfig - Object containing the session configuration parameters.
     * @param {boolean} o.sessionConfig.onlyOne - Only one session can be active at a time.
     * @param {string} o.sessionConfig.ttl - The TTL of the session. (is secocnds). After this time, the session will be deleted. TTL must be specified in seconds and a number.
     * @throws {Error} Invalid database configuration if the input 'o' is not an object or if the connectionType is not a string.
     * @return {Promise<{New: function, Close: function, Fetch : function, Delete : function}>} Connection object based on the connectionType.
     */
    async Authenticator(o, hashKey) {
        //return async (req, _, next) => {
            if (Object.prototype.toString.call(o) !== '[object Object]') {
                throw new Error('Invalid database configuration');
            }
            if (Object.prototype.toString.call(o.sessionConfig) !== '[object Object]') {
                throw new Error('Invalid database configuration');
            }
            const { connectionType } = o;
            if (!connectionType || typeof connectionType !== "string") {
                throw new Error('Invalid database configuration');
            }
            if (connectionType.toLowerCase() === "mongodb") {
                const connection = await (new (mongodb).MongoClient(o.connection.uri).connect());
                const db = connection.db(o.connection.database);
                /**
                 * Takes in a function and returns a new function that returns a Promise
                 * with the output of the original function.
                 * @param {function} func - the original function to be promisified
                 * @param {...*} p - any number of arguments to be passed to the original function
                 * @return {Promise} a Promise that resolves with the output of the original function
                 * or rejects with any errors encountered
                 */
                function Promisify(func) {
                    //return function(...p) {
                        return new Promise((resolve, reject) => {
                            func(...p, function(err, res) {
                                err ? reject(err) : resolve(res);
                            });
                        });
                    //}
                }
                const cons = await Promisify(db.listCollections({name:"sessions"}).next);
                if (!cons) await db.createCollection("sessions");
                return {
                    /**
                     * Asynchronously creates a new session in the "sessions" collection
                     * with the provided session information and a crypted IP.
                     * @param {Object} info - The information to be stored in the new session.
                     * @return {Promise<{id: string, success: boolean, error: any}>} An object containing the crypted IP as the id, a boolean
                     * indicating success, and any potential errors.
                     */
                    async New(ip, info) {
                        const cryptedIp = crypto.createHash("sha256").update(ip).digest("hex");
                        if (o.sessionConfig.onlyOne) {
                            const sess = await db.collection("sessions").findOne({cryptedIp});
                            if (sess) {
                                return {
                                    id: cryptedIp,
                                    success:false,
                                    error: "This IP owns a session already."
                                }
                            } else {
                                await db.collection("sessions").insertOne({cryptedIp, info:CryptoAlg.encrypt(JSON.stringify(info), hashKey)});
                                setTimeout(async () => {
                                    await db.collection("sessions").deleteOne({cryptedIp});
                                }, o.sessionConfig.ttl * 1000);
                                return {
                                    id: cryptedIp,
                                    success:true,
                                    error: null
                                }
                            }
                        } else {
                            await db.collection("sessions").insertOne({cryptedIp, info:CryptoAlg.encrypt(JSON.stringify(info), hashKey)});
                            setTimeout(async () => {
                                await db.collection("sessions").deleteOne({cryptedIp});
                            }, o.sessionConfig.ttl * 1000);
                            return {
                                id: cryptedIp,
                                success:true,
                                error: null
                            }
                        }
                    },
                    /**
                     * Deletes a session with the given session ID from the "sessions" collection in the database.
                     * @param {string} sessionId - The ID of the session to be deleted.
                     * @return {Object} An object with a `success` boolean indicating if the deletion was successful and an `error` string if there was an error.
                     */
                    async Delete(ip) {
                        const cryptedIp = crypto.createHash("sha256").update(ip).digest("hex");
                        await db.collection("sessions").deleteOne({cryptedIp});
                        return {
                            success:true,
                            error: null
                        };
                    },
                    /**
                     * Asynchronously fetches session data from the sessions collection.
                     * @param {string} sessionId - The ID of the session to fetch.
                     * @return {Promise<Object>} An object with success flag, session data, and error message.
                    */
                    async Fetch(ip) {
                        const cryptedIp = crypto.createHash("sha256").update(ip).digest("hex");
                        const info = await db.collection("sessions").findOne({cryptedIp});
                        if (!info) {
                            return {
                                success: false,
                                data: null,
                                error: "No session found."
                            }
                        }
                        return {
                            success: true,
                            data: JSON.parse(CryptoAlg.decrypt(info).info, hashKey),
                            error: null
                        }
                    }
                }
            } else if (connectionType.toLowerCase() === "sqlite") {
                if (!o.connection.database.match(/\.db$/)) {
                    o.connection.database += ".db";
                }
                const connection = new (sqlite3.verbose()).Database(o.connection.database);
                connection.run("CREATE TABLE IF NOT EXISTS sessions (id TEXT PRIMARY KEY, data TEXT)");
                return {
                    /**
                     * Asynchronously creates a new session ID for a given IP address and stores it in a database.
                     * @param {Object} info - an object containing database configuration details
                     * @return {Promise<{id: string, success: boolean, error: any}>} An object containing the crypted IP as the id, a boolean
                     * @throws {Error} if the info parameter is not a valid object
                     */
                    New(info, ip) {
                        return new Promise((resolve, reject) => {
                            if (Object.prototype.toString.call(info) !== '[object Object]') {
                                throw new Error('Invalid database configuration');
                            }
                            const cryptedIp = crypto.createHash("sha256").update(ip).digest("hex");
                            if (Object.prototype.toString.call(info) !== '[object Object]') {
                                throw new Error('Invalid database configuration');
                            }
                            if (o.sessionConfig.onlyOne) {
                                connection.all("SELECT * FROM sessions WHERE id = ?", [cryptedIp], (err, rows) => {
                                    if (err) return reject(err);
                                    if (rows.length > 0) {
                                        return {
                                            id: cryptedIp,
                                            success:false,
                                            error: "This IP owns a session already.",
                                        }
                                    }
                                    connection.run("INSERT INTO sessions (id, data) VALUES (?, ?)", [cryptedIp, CryptoAlg.encrypt(JSON.stringify(info), hashKey)], function(err) {
                                        if (err) return reject(err);
                                        setTimeout(() => {
                                            connection.run("DELETE FROM sessions WHERE id = ?", [cryptedIp], function() {});
                                        }, o.sessionConfig.ttl*1000);
                                        resolve({
                                            id: cryptedIp,
                                            success:true,
                                            error: null
                                        });
                                    });
                                });
                            } else {
                                connection.run("INSERT INTO sessions (id, data) VALUES (?, ?)", [cryptedIp, CryptoAlg.encrypt(JSON.stringify(info), hashKey)], function(err) {
                                    if (err) return reject(err);
                                    setTimeout(() => {
                                        connection.run("DELETE FROM sessions WHERE id = ?", [cryptedIp], function() {});
                                    }, o.sessionConfig.ttl*1000);
                                    resolve({
                                        id: cryptedIp,
                                        success:true,
                                        error: null
                                    });
                                });
                            }
                        });
                    },
                    /**
                     * Deletes a session from the 'sessions' table.
                     *
                     * @param {string} sessionId - The ID of the session to be deleted.
                     * @return {Promise} A Promise that returns an object with properties:
                     *         - success (boolean): true if deletion is successful.
                     *         - error (object): null if no error, otherwise an object with error details.
                    */
                    async Delete(ip) {
                        const cryptedIp = crypto.createHash("sha256").update(ip).digest("hex");
                        return new Promise((resolve, reject) => {
                            if (Object.prototype.toString.call(sessionId) !== '[object String]') {
                                throw new Error('Invalid database configuration');
                            }
                            connection.all("DELETE FROM sessions WHERE id = ?", [cryptedIp], function(err) {
                                if (err) return reject(err);
                                resolve({
                                    success:true,
                                    error: null
                                });
                            });
                        });
                    },
                    /**
                     * Asynchronously fetches a session by ID from the sessions database.
                     *
                     * @param {string} sessionId - The ID of the session to fetch.
                     * @return {Promise<object>} A Promise that resolves to an object with the following structure:
                     * {
                     *   success: boolean, // Whether or not the session was found
                     *   error: string, // An error message if the session was not found
                     *   data: object // The session data if the session was found
                     * }
                     * If the function fails to fetch the session, the Promise is rejected with an error.
                     * @throws {Error} If the sessionId parameter is not a string.
                    */
                    async Fetch(ip) {
                        const cryptedIp = crypto.createHash("sha256").update(ip).digest("hex");
                        return new Promise((resolve, reject) => {
                            if (Object.prototype.toString.call(sessionId) !== '[object String]') {
                                throw new Error('Invalid database configuration');
                            }
                            connection.all("SELECT * FROM sessions WHERE id = ?", [cryptedIp], (err, rows) => {
                                if (err) return reject(err);
                                if (rows.length === 0) {
                                    return {
                                        success:true,
                                        data: null,
                                        error: "No session found.",
                                    }
                                }
                                resolve({
                                    success:true,
                                    error: null,
                                    data: JSON.parse(CryptoAlg.decrypt(rows[0].data, hashKey))
                                });
                            });
                        });
                    },
                    /**
                     * Closes the connection to the database.
                     * @return {void}
                     */
                    Close() {
                        connection.close();
                    }
                }
            } else if (connectionType.toLowerCase() === "memory") {
                const connection = await this.MemoryStorage();
                return {
                    /**
                     * Asynchronously creates a new session ID for a given IP address and stores it in a database.
                     * @param {Object} info - an object containing database configuration details
                     * @return {Promise<{id: string, success: boolean, error: any}>} An object containing the crypted IP as the id, a boolean
                     * @throws {Error} if the info parameter is not a valid object
                     */
                    async New(info, ip) {
                        const cryptedIp = crypto.createHash("sha256").update(ip).digest("hex");
                        if (Object.prototype.toString.call(info) !== '[object Object]') {
                            throw new Error('Invalid database configuration');
                        }
                        if (o.sessionConfig.onlyOne) {
                            if (connection.get(cryptedIp)) {
                                return {
                                    id: cryptedIp,
                                    success:false,
                                    error: "This IP owns a session already.",
                                }
                            } else {
                                const query = connection.set(cryptedIp, CryptoAlg.encrypt(JSON.stringify(info), hashKey), o.sessionConfig.ttl);
                                if (query) {
                                    setTimeout(() => {
                                        connection.del(cryptedIp);
                                    }, o.sessionConfig.ttl*1000);
                                    return {
                                        id: cryptedIp,
                                        success:true,
                                        error:null
                                    }
                                } else {
                                    return {
                                        id: cryptedIp,
                                        success:false,
                                        error: "This IP owns a session already.",
                                    }
                                }
                            }
                        } else {
                            const query = connection.set(cryptedIp, CryptoAlg.encrypt(JSON.stringify(info), hashKey), o.sessionConfig.ttl);
                            if (query) {
                                setTimeout(() => {
                                    connection.del(cryptedIp);
                                }, o.sessionConfig.ttl*1000);
                                return {
                                    id: cryptedIp,
                                    success:true,
                                    error:null
                                }
                            } else {
                                return {
                                    id: cryptedIp,
                                    success:false,
                                    error:null
                                }
                            }
                        }
                    },
                    /**
                     * Deletes a session by ID.
                     * @param {string} sessionId - The ID of the session to delete.
                     * @return {Object} An object with a success property indicating if the deletion was successful.
                     */
                    async Delete(ip) {
                        const cryptedIp = crypto.createHash("sha256").update(ip).digest("hex");
                        const query = connection.del(cryptedIp);
                        if (query) {
                            return {
                                id:sessionId,
                                success:true,
                                error:null
                            }
                        } else {
                            return {
                                id:sessionId,
                                success:false,
                                error:null
                            }
                        }
                    },
                    /**
                     * Asynchronously fetches the session with the given sessionId from the connection object. Returns an object containing session id, success status, and the associated query data, if available.
                     * @param {string} sessionId - The id of the session to fetch.
                     * @return {Promise<Object>} - An object containing session id, success status, and the associated query data, if available.
                     */
                    async Fetch(ip) {
                        const cryptedIp = crypto.createHash("sha256").update(ip).digest("hex");
                        const query = connection.get(cryptedIp);
                        if (query) {
                            return {
                                id:sessionId,
                                success:true,
                                data:JSON.parse(CryptoAlg.decrypt(query, hashKey)),
                                error:null
                            };
                        } else {
                            return {
                                id:sessionId,
                                success:false,
                                error:"No session found.",
                            }
                        }
                    },
                    /**
                     * Closes the connection to the database
                     * @return {void}
                     */
                    Close() {
                        connection.close();
                    }
                }
            } else {
                throw new Error('Invalid or unsupported database configuration');
            }
            ///next();
        }
    //}
};

/*
    Got any suggestions or problems?
    Feel free to open an issue on GitHub or create a pull request
    We will be really grateful for your feedback and on heearing your suggestions
    Thank you
*/

export default Servetify;