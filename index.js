/*
    Servetify v1.2 by Brydget Cloud Development Team
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
import crypto from 'crypto'
import NodeCache from 'node-cache'
import PostgreDb from 'pg'
import {v4 as uuidv4} from 'uuid'
const memoryStorage = multer.memoryStorage()
const filesHandler = multer({storage:memoryStorage})

const llocated = {}; // Variable to store routes
/**
 * Servetify is a library for Node.js that provides a simple and easy way to handle HTTP requests.
 * @constructor
 * @param {number} PORT - The port number for the server
 * @param {boolean} useMemoryStorage - Use memory storage to store requests
 * @param {number} IntervalToClearReceivedRequestsFromIps - Interval to clear received requests from IPs
 * @return {Servetify} - Server Driver
 */
class Servetify {
    server = express(); // Express server instance

    constructor(PORT, useMemoryStorage = true, IntervalToClearReceivedRequestsFromIps=1000) {
        this.PORT = PORT;
        this.server.use(express.json());
        this.server.use(cookieParser());
        this.server.use(express.urlencoded({ extended: false }));
        // This function is designed to prevent brute force attacks
        // Update: handwritten from scratch due to dependencies issues
        //(async () => {
            if (useMemoryStorage) {
                const BruteForceStorage = this.MemoryStorage();
                this.server.use(function(req, res, next) {
                    const reqIp = req.ip;
                    const crypted = crypto.createHash("sha256").update(reqIp).digest("hex");
                    const isAtDb = BruteForceStorage.get(crypted);
                    if (isAtDb) {
                        BruteForceStorage.set(crypted, parseInt(isAtDb)+1);
                        setTimeout(() => {
                            BruteForceStorage.del(crypted);
                        }, IntervalToClearReceivedRequestsFromIps);
                    } else {
                        BruteForceStorage.set(crypted, 1);
                    }
                    if (parseInt(isAtDb)+1 > 200) {
                        res.statusCode = 429;
                        res.send("Too many attempts");
                    } else {
                        next();
                    }
                });
            }
        //})();
        this.server.use(function(req, res, next) {
            /**
             * Sets a cookie for the client.
             * @param {string} key - The key for the cookie.
             * @param {string} value - The value for the cookie.
             * @param {number} ttl - The time to live for the cookie (in seconds).
             */
            req.SetClientCookie = function(key, value) {
                res.cookie(key, value);
            }
            next();
        })
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
                            const resp = await el.resolve(req);
                            //if (resp instanceof Response) {
                                const text = await resp.text();
                                for (const headerKey in (resp.cookies || {})) {
                                    if (Object.hasOwnProperty.call(resp.cookies, headerKey)) {
                                        const headerValue = resp.cookies[headerKey];
                                        res.cookie(headerKey, headerValue);
                                    }
                                }
                                for (const headerKey in resp.headers) {
                                    if (Object.hasOwnProperty.call(resp.headers, headerKey)) {
                                        const headerValue = resp.headers[header];
                                        res.header(headerKey, headerValue);
                                    }
                                }
                                if (resp.headers && !resp.headers["Content-Type"]) {
                                    res.header("Content-Type", "text/plain");
                                }
                                res.status(resp.status || 200);
                                res.send(text);
                            //}
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
        return (async resolve => {
            if (!route) return await resolve();
            if (typeof route !== 'string') return await resolve();
            if (route.split(' ').length > 2 || route.split(' ').length < 1) return await resolve();
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
        if (Array.isArray(method)) {
            method.forEach(method => {
                this.server.use(function(req, res, next) {
                    if (req.method.toUpperCase() === method.toUpperCase()) {
                        res.status(405).end();
                    }
                    next();
                });
            });
            return this;
        }
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
    MemoryStorage() {
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
            if (typeof o.sessionConfig.ttl !== "number") {
                throw new Error('Invalid database configuration');
            }
            if (o.sessionConfig.ttl <= 0) {
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
            } else if (connectionType.toLowerCase() === "memory") {
                const connection = this.MemoryStorage();
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
    /**
     * Creates a session manager that stores sessions in memory with a given time-to-live (TTL).
     * @param {Object} config - The configuration object with the TTL in seconds.
     * @param {number} config.ttl - The time-to-live (TTL) for the sessions in seconds.
     * @return {Promise<{New: function, Close: function, Fetch : function, Delete : function}>} Connection object based on the connectionType.
    */
    async InMemorySessionManager(config) {
        if (Object.prototype.toString.call(config) !== '[object Object]') {
            throw new Error('Invalid database configuration');
        }
        const {ttl} = config;
        if (typeof ttl !== 'number') {
            throw new Error('Invalid database configuration');
        }
        if (ttl <= 0) {
            throw new Error('Invalid database configuration');
        }
        const Sessions = this.MemoryStorage();
        return {
            /**
             * Synchronously creates a new session with the given information.
             * @param {Object} info - The information to be stored in the session.
             * @return {string} The unique session ID.
            */
            New(info) {
                const sessionId = uuidv4();
                Sessions.set(sessionId, JSON.stringify(info));
                setTimeout(() => {
                    Sessions.del(sessionId);    
                }, ttl*1000);
                return sessionId;
            },
            /**
             * Deletes a session with the given ID.
             *
             * @param {number} id - The ID of the session to delete.
             * @return {Promise<void>} A promise that resolves when the session is deleted.
            */
            Delete(id) {
                Sessions.del(id);
            },
            /**
             * Parses the JSON object stored in the session with the specified ID.
             *
             * @param {string} id - the ID of the session to retrieve
             * @return {object} the parsed JSON object, or an empty object if the session is not found
            */
            Fetch(id) {
                return JSON.parse(Sessions.get(id) || "{}");
            }
        }
    }
    /**
     * Creates a response new response object compatible with Serveetify
     * @param {string} text - The text to be returned by the async text method.
     * @param {object} object - An object containing additional properties to be added to the response object.
     * @return {object} An object with an async text method and any additional properties specified in the object argument.
    */
    static Response(text, object) {
        return {
            /**
             * Asynchronously retrieves the text.
             * @return {Promise<string>} The text.
            */
            async text() {
                if (Object.prototype.toString.call(text) === '[object Object]') {
                    return JSON.stringify(text);
                }
                return text;
            },
            ...object
        }
    }
    /**
     * Creates a protected resource with given route, api key, waited header, and allowCors value.
     * @param {string} route - The route to create a protected resource for.
     * @param {string} apiKey - The API key to use for authentication.
     * @param {string} [WaitedHeader=ApiKey] - The waited header to check for the correct API key.
     * @param {boolean} [allowCors=true] - Whether or not to allow cross-origin resource sharing.
     * @return {Functionn} A promise that resolves when the protected resource is created.
     */
    ProtectedResource(route, apiKey, WaitedHeader="ApiKey") {
        return (async resolve => {
            if (!route) return await resolve();
            if (typeof route !== 'string') return await resolve();
            if (route.split(' ').length > 2 || route.split(' ').length < 1) return await resolve();
            const [method, uri] = route.split(' ');
            llocated[route] = {
                uri,
                method: method.toLowerCase(),
                resolve:function(req, res, next) {
                    if ((Object.entries(req.headers || {}).filter(x => x[0].toLowerCase() === WaitedHeader.toLowerCase())[0] || [])[1] === apiKey) {
                        return [resolve(req), (next || (() => {}))()][0];
                    } else {
                        return Servetify.Response("Unauthotized", {
                            status:401
                        });
                    }
                    next();
                },
            };
        });
    }
    /**
     * Configures CORS for the server based on the origin
     * @param {string | string[]} origin - The origin or list of origins allowed to access the server.
     * @throws {Error} Invalid CORS configuration if the origin is not a string when an array is passed.
     */
    CORS(origin) {
        if (Array.isArray(origin)) {
            if (typeof origin !== 'string') {
                throw new Error('Invalid CORS configuration');
            }
            this.server.use((req, res, next) => {
                res.header("Access-Control-Allow-Origin", origin);
                res.header("Access-Control-Allow-Headers", "*");
                res.header("Access-Control-Allow-Methods", "*");
                res.header("Access-Control-Allow-Credentials", "true");
                return [(next || (() => {}))()][2];
            });
            return this;
        } else if (typeof origin === 'string') {
            this.server.use((req, res, next) => {
                res.header("Access-Control-Allow-Origin", origin);
                res.header("Access-Control-Allow-Headers", "*");
                res.header("Access-Control-Allow-Methods", "*");
                res.header("Access-Control-Allow-Credentials", "true");
                return [(next || (() => {}))()][2];
            });
            return this;
        } else {
            throw new Error('Invalid CORS configuration');
        }
    }
};

/*
    Got any suggestions or problems?
    Feel free to open an issue on GitHub or create a pull request
    We will be really grateful for your feedback and on heearing your suggestions
    Thank you
*/

export default Servetify;